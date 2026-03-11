import { SignedUrlResult } from "@/types/media";
import { supabase } from "@/util/supabase";

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Generates a signed URL for a private storage object.
 * @param bucket - The storage bucket name (e.g. "user_media").
 * @param path - The object path within the bucket (e.g. "meals/userId/uuid.jpg").
 * @param ttlSeconds - How long the URL should remain valid. Defaults to 3600s (1 hour).
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  ttlSeconds = DEFAULT_TTL,
): Promise<SignedUrlResult> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds);

  if (error) {
    console.error(`[media-api] Error signing ${bucket}/${path}:`, error);
    return { success: false, error };
  }

  return { success: true, url: data.signedUrl };
};
