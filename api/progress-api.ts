import { Buffer } from "@craftzdog/react-native-buffer";

import { userApi } from "@/api/user-api";
import { encryptionService } from "@/services/EncryptionService";
import { ApiResult } from "@/types/api";
import { ErrorCode } from "@/types/error";
import {
  ProgressPhoto,
  ProgressPhotoInput,
  UploadProgressResult,
} from "@/types/progress";
import { User, UserSettings } from "@/types/user";
import { supabase } from "@/util/supabase";

const BUCKET = "progress-photos";

const mapProgressPhoto = (row: any): ProgressPhoto => ({
  id: row.id,
  userId: row.user_id,
  frontPhotoUrl: row.front_photo_url,
  sidePhotoUrl: row.side_photo_url,
  backPhotoUrl: row.back_photo_url,
  frontPhotoMetadata: row.front_photo_metadata,
  sidePhotoMetadata: row.side_photo_metadata,
  backPhotoMetadata: row.back_photo_metadata,
  capturedDate: row.captured_date,
  weightKg: row.weight_kg,
  weightLb: row.weight_lb,
  bodyFat: row.body_fat,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapUserSettings = (row: any): UserSettings => ({
  id: row.id,
  userId: row.user_id,
  privacyMode: row.privacy_mode,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Uploads one encrypted binary to the private bucket via a signed upload URL.
 * Returns the finalised storage path on success.
 */
const uploadEncryptedBlob = async (
  path: string,
  encryptedBase64: string,
): Promise<string> => {
  const { data: signedData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (urlError || !signedData) {
    throw new Error(
      `Failed to get signed upload URL for "${path}": ${urlError?.message}`,
    );
  }

  const bytes = Buffer.from(encryptedBase64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(
      signedData.path,
      signedData.token,
      bytes as unknown as ArrayBuffer,
      { contentType: "application/octet-stream" },
    );

  if (uploadError) {
    throw new Error(`Upload failed for "${path}": ${uploadError.message}`);
  }

  return signedData.path;
};

export const progressApi = {
  /**
   * Atomically encrypts three progress photos (FRONT, SIDE, BACK) and
   * persists them to Supabase Storage + the progress_photos table.
   *
   * Pipeline:
   * 1. Validate own identity key exists.
   * 2. Resolve partner's public key — if partner is present in the local store
   *    but their publicKey is null, call userApi.getUserProfile(partner.id) once
   *    to fetch the full profile. The resolved partner is returned so the caller
   *    can update authStore (authStore.setPartner(resolvedPartner)) and avoid
   *    repeating this fetch on future uploads.
   * 3. Build recipientMap containing both user and partner IDs → public keys.
   * 4. Encrypt all three views in parallel (AES-256-GCM, RSA-OAEP key wrap).
   * 5. Upload encrypted binaries to the private bucket via signed upload URLs.
   * 6. Insert one row into progress_photos with storage paths + JSONB encryption
   *    metadata (iv, authTag, wrappedKeys) per image.
   * 7. On DB insert failure, delete all uploaded binaries to prevent orphans.
   */
  uploadProgressUpdate: async (
    user: User,
    partner: User | null,
    input: ProgressPhotoInput,
  ): Promise<ApiResult<UploadProgressResult>> => {
    // ── 1. Validate current user has an identity key ──────────────────────
    if (!user.publicKey) {
      return {
        success: false,
        error: {
          code: ErrorCode.PROGRESS_MISSING_PUBLIC_KEY,
          message:
            "Your account is missing an encryption key. Please re-generate your identity keys in Settings.",
        },
      };
    }

    // ── 2. Resolve partner public key via userApi.getUserProfile if absent ─
    // We reuse getUserProfile (which calls mapDbUser) to avoid duplicating the
    // DB query or the field mapping logic.
    let resolvedPartner: User | null = null;

    if (partner) {
      if (partner.publicKey) {
        resolvedPartner = partner;
      } else {
        const profileResult = await userApi.getUserProfile(partner.id);
        if (!profileResult.success || !profileResult.data) {
          return {
            success: false,
            error: {
              code: ErrorCode.PROGRESS_PARTNER_FETCH_ERROR,
              message: `Could not retrieve partner's encryption key: ${profileResult.error?.message}`,
              originalError: profileResult.error,
            },
          };
        }
        resolvedPartner = profileResult.data;
      }
    }

    // ── 3. Build recipient map (user + partner if available) ───────────────
    const recipientMap: Record<string, string> = {
      [user.id]: user.publicKey,
    };
    if (resolvedPartner?.publicKey) {
      recipientMap[resolvedPartner.id] = resolvedPartner.publicKey;
    }

    // ── 4. Encrypt all three views in parallel ────────────────────────────
    let frontPayload, sidePayload, backPayload;
    try {
      [frontPayload, sidePayload, backPayload] = await Promise.all([
        encryptionService.encryptImage(input.frontUri, recipientMap),
        encryptionService.encryptImage(input.sideUri, recipientMap),
        encryptionService.encryptImage(input.backUri, recipientMap),
      ]);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ErrorCode.PROGRESS_ENCRYPTION_ERROR,
          message: `Encryption failed: ${err.message}`,
          originalError: err,
        },
      };
    }

    // ── 5. Upload encrypted binaries to private storage bucket ────────────
    // Path structure: {userId}/{capturedDate}/{batchId}/{view}.enc
    // batchId (epoch ms) makes the triplet unique if the user uploads twice
    // on the same date without overwriting previous photos.
    const batchId = Date.now().toString();
    const basePath = `${user.id}/${input.capturedDate}/${batchId}`;

    const uploadedPaths: string[] = [];
    let frontPath: string;
    let sidePath: string;
    let backPath: string;

    try {
      [frontPath, sidePath, backPath] = await Promise.all([
        uploadEncryptedBlob(
          `${basePath}/front.enc`,
          frontPayload.encryptedData,
        ),
        uploadEncryptedBlob(`${basePath}/side.enc`, sidePayload.encryptedData),
        uploadEncryptedBlob(`${basePath}/back.enc`, backPayload.encryptedData),
      ]);
      uploadedPaths.push(frontPath, sidePath, backPath);
    } catch (err: any) {
      // Clean up any paths that succeeded before the failure
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths);
      }
      return {
        success: false,
        error: {
          code: ErrorCode.PROGRESS_UPLOAD_ERROR,
          message: `Storage upload failed: ${err.message}`,
          originalError: err,
        },
      };
    }

    // ── 6. Persist to DB (single atomic insert) ───────────────────────────
    const { data, error: dbError } = await supabase
      .from("progress_photos")
      .insert({
        user_id: user.id,
        front_photo_url: frontPath,
        side_photo_url: sidePath,
        back_photo_url: backPath,
        front_photo_metadata: frontPayload.metadata,
        side_photo_metadata: sidePayload.metadata,
        back_photo_metadata: backPayload.metadata,
        captured_date: input.capturedDate,
        weight_kg: input.weightKg ?? null,
        weight_lb: input.weightLb ?? null,
        body_fat: input.bodyFat ?? null,
      })
      .select()
      .single();

    if (dbError || !data) {
      // ── 7. Rollback: delete uploaded binaries to prevent orphaned storage ─
      await supabase.storage.from(BUCKET).remove(uploadedPaths);

      return {
        success: false,
        error: {
          code: ErrorCode.PROGRESS_DB_INSERT_ERROR,
          message: `Database insert failed: ${dbError?.message ?? "unknown error"}`,
          originalError: dbError,
        },
      };
    }

    return {
      success: true,
      data: { photo: mapProgressPhoto(data), resolvedPartner },
    };
  },

  /** Fetches all progress photos for a user on a specific ISO date (YYYY-MM-DD). */
  getProgressPhotosForDate: async (
    userId: string,
    date: string,
  ): Promise<ApiResult<ProgressPhoto[]>> => {
    const { data, error } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .eq("captured_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.PROGRESS_DB_INSERT_ERROR,
          message: `Failed to fetch progress photos: ${error.message}`,
          originalError: error,
        },
      };
    }

    return { success: true, data: (data ?? []).map(mapProgressPhoto) };
  },

  /** Fetches the user_settings row for a given user id. */
  getSettings: async (userId: string): Promise<ApiResult<UserSettings>> => {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: `Failed to fetch settings: ${error.message}`,
          originalError: error,
        },
      };
    }

    return { success: true, data: mapUserSettings(data) };
  },

  /** Toggles privacy_mode for the current user and returns the updated row. */
  updatePrivacyMode: async (
    userId: string,
    privacyMode: boolean,
  ): Promise<ApiResult<UserSettings>> => {
    const { data, error } = await supabase
      .from("user_settings")
      .update({ privacy_mode: privacyMode })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: `Failed to update privacy mode: ${error.message}`,
          originalError: error,
        },
      };
    }

    return { success: true, data: mapUserSettings(data) };
  },
};
