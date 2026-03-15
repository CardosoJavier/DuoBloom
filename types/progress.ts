import { EncryptionMetadata } from "@/services/EncryptionService";
import { User } from "@/types/user";

/** Caller-provided input for a single progress photo upload session. */
export interface ProgressPhotoInput {
  frontUri: string; // local file URI
  sideUri: string;
  backUri: string;
  capturedDate: string; // ISO date 'YYYY-MM-DD'
  weightKg?: number;
  weightLb?: number;
  bodyFat?: number;
}

/**
 * A progress_photos DB row as returned from the API.
 * Photo URLs are Supabase Storage paths pointing to encrypted binaries.
 * Metadata holds the cryptographic material (iv, authTag, wrappedKeys)
 * required to decrypt each image.
 */
export interface ProgressPhoto {
  id: string;
  userId: string;
  frontPhotoUrl: string;
  sidePhotoUrl: string;
  backPhotoUrl: string;
  frontPhotoMetadata: EncryptionMetadata;
  sidePhotoMetadata: EncryptionMetadata;
  backPhotoMetadata: EncryptionMetadata;
  capturedDate: string;
  weightKg: number | null;
  weightLb: number | null;
  bodyFat: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Returned by progressApi.uploadProgressUpdate.
 * When resolvedPartner is non-null and the original partner.publicKey was
 * absent, the caller should call authStore.setPartner(resolvedPartner) to
 * keep the local cache warm for future uploads without an extra fetch.
 */
export interface UploadProgressResult {
  photo: ProgressPhoto;
  resolvedPartner: User | null;
}
