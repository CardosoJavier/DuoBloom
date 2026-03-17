import { getSignedUrl } from "@/api/media-api";
import { useQuery } from "@tanstack/react-query";

const STALE_TIME = 55 * 60 * 1000; // 55 min — refresh before the 1h signed URL expires
const GC_TIME = 60 * 60 * 1000; // 60 min

/**
 * Returns a signed URL for a private storage path, cached in TanStack Query.
 *
 * - If `path` is null/undefined, returns { signedUrl: null, isLoading: false }.
 * - If `path` is already a full URL (starts with "http"), returns it as-is.
 * - Otherwise generates and caches a signed URL for 55 minutes, so the same
 *   storage object is never signed twice within a session.
 */
export function useSignedUrl(
  path: string | null | undefined,
  bucket = "user_media",
): { signedUrl: string | null; isLoading: boolean } {
  const isFullUrl = !!path && path.startsWith("http");
  const needsSigning = !!path && !isFullUrl;

  const { data, isLoading } = useQuery({
    queryKey: ["signed-url", bucket, path],
    queryFn: () => getSignedUrl(bucket, path!),
    enabled: needsSigning,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    select: (result) => (result.success ? (result.url ?? null) : null),
  });

  if (!path) return { signedUrl: null, isLoading: false };
  if (isFullUrl) return { signedUrl: path, isLoading: false };

  return { signedUrl: data ?? null, isLoading };
}
