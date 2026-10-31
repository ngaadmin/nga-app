"use server";

/**
 * First-party log line for a lesson picture or clip that failed to load.
 * Vercel runtime logs keep it. Only the media URL and the lesson context are
 * sent. No learner data.
 */
export async function reportAcademyMediaFailure(input: {
  src: string;
  kind: "image" | "audio";
  path?: string;
}): Promise<void> {
  try {
    const src = String(input?.src ?? "").slice(0, 500);
    if (!src) return;
    const kind = input?.kind === "audio" ? "audio" : "image";
    const path = String(input?.path ?? "").slice(0, 200);
    console.warn(JSON.stringify({ event: "academy_media_failed", kind, src, path }));
  } catch {
    // Logging must never break a lesson.
  }
}
