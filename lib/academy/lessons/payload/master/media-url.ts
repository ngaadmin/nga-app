import { localPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import {
  academyAudioUrl,
  academyImageUrl,
  academyMediaBase,
  mediaBaseName,
} from "@/lib/academy/media/academy-media";

/**
 * Object names the reader and the publish check use.
 * Pictures use the canonical file name the player requests, so a cell that
 * says `lars-celebrating` is `lars-celebrating-512.webp` in the bucket.
 * Audio uses the Audio File Name as written.
 */
export function masterImageObjectName(fileName: string): string | undefined {
  const local = localPairSheetImagePath(fileName);
  if (!local) return undefined;
  return mediaBaseName(local) || undefined;
}

export function masterAudioObjectName(fileName: string): string | undefined {
  const name = mediaBaseName(fileName);
  if (!name || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.mp3$/i.test(name)) return undefined;
  return name;
}

/** Bucket URL for a picture cell. Storage only. */
export function resolveAcademyImageUrl(
  fileName: string,
  base = academyMediaBase(),
): string | undefined {
  const name = masterImageObjectName(fileName);
  if (!name) return undefined;
  return academyImageUrl(name, base) || undefined;
}

/** Bucket URL for an Audio File Name. Storage only, never /public. */
export function resolveAcademyAudioUrl(
  fileName: string,
  base = academyMediaBase(),
): string | undefined {
  const name = masterAudioObjectName(fileName);
  if (!name) return undefined;
  return academyAudioUrl(name, base) || undefined;
}
