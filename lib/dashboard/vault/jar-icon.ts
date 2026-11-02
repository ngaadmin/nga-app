import { INITIAL_DESTINATION_JARS } from "@/lib/dashboard/destination-jars";
import { JAR_ICONS, type JarIconId } from "@/lib/dashboard/progress-icons-a";

const DEFAULT_EMOJI = new Map<string, string>(
  INITIAL_DESTINATION_JARS.map((jar) => [jar.id, jar.emoji]),
);

/**
 * Direction A icon for the four starter jars (same as the Parent Hub), or null
 * when the jar is custom or the child picked their own emoji for it.
 */
export function foundationJarIcon(bucket: { id: string; emoji: string }) {
  const fallback = DEFAULT_EMOJI.get(bucket.id);
  if (!fallback || bucket.emoji !== fallback) return null;
  return JAR_ICONS[bucket.id as JarIconId] ?? null;
}
