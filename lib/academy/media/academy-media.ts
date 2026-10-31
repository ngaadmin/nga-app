/**
 * Lesson pictures and clips are served from the academy-media bucket only.
 *
 * Base: NEXT_PUBLIC_ACADEMY_MEDIA_BASE when set. Otherwise the public
 * academy-media bucket on NEXT_PUBLIC_SUPABASE_URL. Object names are flat:
 * `images/<file name>` and `audio/<file name>`. Names are versioned and are
 * never overwritten, so a changed picture gets a new name.
 *
 * Shared app chrome (avatars, Penny, medals outside lessons) stays in /public
 * and does not go through this file.
 */

export const ACADEMY_MEDIA_BUCKET = "academy-media";

function trimBase(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

/**
 * Literal `process.env.NEXT_PUBLIC_*` reads so Next inlines them in the browser.
 * Pass `env` in tests and tools.
 */
export function academyMediaBase(env?: Record<string, string | undefined>): string {
  const explicit = trimBase(
    env ? env.NEXT_PUBLIC_ACADEMY_MEDIA_BASE : process.env.NEXT_PUBLIC_ACADEMY_MEDIA_BASE,
  );
  if (explicit) return explicit;
  const supabase = trimBase(
    env ? env.NEXT_PUBLIC_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  if (!supabase) return "";
  return `${supabase}/storage/v1/object/public/${ACADEMY_MEDIA_BUCKET}`;
}

/** Last path segment. `a/b/c.webp` gives `c.webp`. */
export function mediaBaseName(fileOrPath: string): string {
  return fileOrPath.trim().split(/[/\\]/).pop() ?? "";
}

export function academyMediaObjectPath(kind: "images" | "audio", fileName: string): string {
  return `${kind}/${mediaBaseName(fileName)}`;
}

/** Bucket URL for an image file name, or "" when no base is configured. */
export function academyImageUrl(fileName: string, base = academyMediaBase()): string {
  const name = mediaBaseName(fileName);
  if (!name || !base) return "";
  return `${base}/images/${encodeURIComponent(name)}`;
}

/** Bucket URL for an audio file name, or "" when no base is configured. */
export function academyAudioUrl(fileName: string, base = academyMediaBase()): string {
  const name = mediaBaseName(fileName);
  if (!name || !base) return "";
  return `${base}/audio/${encodeURIComponent(name)}`;
}

/**
 * A lesson picture path from the illustration registry
 * (`/assets/illustrations/...`) mapped to the bucket by file name.
 * Anything else, or an empty base, is returned unchanged.
 */
export function academyLessonImageSrc<T extends string | undefined>(localPath: T, base: string): T {
  if (!localPath || !base) return localPath;
  if (!localPath.startsWith("/assets/illustrations/")) return localPath;
  return (academyImageUrl(localPath, base) || localPath) as T;
}
