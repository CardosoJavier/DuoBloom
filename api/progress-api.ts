import * as Crypto from "expo-crypto";

import { ApiResult } from "@/types/api";
import { ErrorCode } from "@/types/error";
import { ProgressPhoto, ProgressPhotoInput } from "@/types/progress";
import { UserSettings } from "@/types/user";
import { supabase } from "@/util/supabase";

const BUCKET = "user_media";

const mapProgressPhoto = (row: any): ProgressPhoto => ({
  id: row.id,
  userId: row.user_id,
  frontPhotoUrl: row.front_photo_url,
  sidePhotoUrl: row.side_photo_url,
  backPhotoUrl: row.back_photo_url,
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
 * Uploads one JPEG to the storage bucket via a signed upload URL.
 * Returns the finalised storage path on success.
 */
const uploadRawImage = async (path: string, uri: string): Promise<string> => {
  const { data: signedData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (urlError || !signedData) {
    throw new Error(
      `Failed to get signed upload URL for "${path}": ${urlError?.message}`,
    );
  }

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signedData.path, signedData.token, formData);

  if (uploadError) {
    throw new Error(`Upload failed for "${path}": ${uploadError.message}`);
  }

  return signedData.path;
};

export const progressApi = {
  /**
   * Uploads three progress photos (FRONT, SIDE, BACK) to Supabase Storage
   * and persists a single row to the progress_photos table.
   *
   * Pipeline:
   * 1. Upload all three JPEG files in parallel via signed upload URLs.
   * 2. Insert one row into progress_photos with the resulting storage paths.
   * 3. On DB insert failure, delete all uploaded files to prevent orphans.
   */
  uploadProgressUpdate: async (
    userId: string,
    input: ProgressPhotoInput,
  ): Promise<ApiResult<ProgressPhoto>> => {
    const batchId = Crypto.randomUUID();
    const basePath = `progress/${userId}/${input.capturedDate}_${batchId}`;

    const uploadedPaths: string[] = [];
    let frontPath: string;
    let sidePath: string;
    let backPath: string;

    try {
      [frontPath, sidePath, backPath] = await Promise.all([
        uploadRawImage(`${basePath}_front.jpg`, input.frontUri),
        uploadRawImage(`${basePath}_side.jpg`, input.sideUri),
        uploadRawImage(`${basePath}_back.jpg`, input.backUri),
      ]);
      uploadedPaths.push(frontPath, sidePath, backPath);
    } catch (err: any) {
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

    const { data, error: dbError } = await supabase
      .from("progress_photos")
      .insert({
        user_id: userId,
        front_photo_url: frontPath,
        side_photo_url: sidePath,
        back_photo_url: backPath,
        captured_date: input.capturedDate,
        weight_kg: input.weightKg ?? null,
        weight_lb: input.weightLb ?? null,
        body_fat: input.bodyFat ?? null,
      })
      .select()
      .single();

    if (dbError || !data) {
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

    return { success: true, data: mapProgressPhoto(data) };
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
