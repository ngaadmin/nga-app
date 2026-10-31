/**
 * Pictures held back from the academy-media bucket until Jasper approves the
 * compressed Lars set. Bucket names can't be overwritten, so a held picture is
 * uploaded once, after the OK, from the approved compressed files.
 *
 * Held: any name with "lars" in it, and the Lars-fix Explorer Module 1 story
 * scenes (beat-ex-m1-l*), which show Lars but don't name him.
 */
export function isHeldLarsMedia(objectPath: string): boolean {
  const name = objectPath.split("/").pop() ?? "";
  if (!name) return false;
  return /lars/i.test(name) || /^beat-ex-m1-l\d/i.test(name);
}

/** Size caps from the Academy go-live plan, in bytes. */
export const ACADEMY_IMAGE_MAX_BYTES = 120 * 1024;
export const ACADEMY_LARS_IMAGE_MAX_BYTES = 90 * 1024;

export function imageByteCap(objectPath: string): number {
  return isHeldLarsMedia(objectPath) ? ACADEMY_LARS_IMAGE_MAX_BYTES : ACADEMY_IMAGE_MAX_BYTES;
}

export const ACADEMY_MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Auth headers for a server key. A legacy JWT key goes in both headers. A
 * newer `sb_secret_` key is not a JWT, so it goes in `apikey` only.
 */
export function supabaseKeyHeaders(key: string): Record<string, string> {
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}
