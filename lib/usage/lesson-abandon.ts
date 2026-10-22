const LESSON_ATTEMPT_COMPLETED_EVENT = "nga:lesson-attempt-completed";

/**
 * Tell the open lesson that this attempt finished, so leaving the page does
 * not also count as abandoned. One event, no stored identity.
 */
export function markLessonAttemptCompleted(lessonNumber: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(lessonNumber)) return;
  window.dispatchEvent(
    new CustomEvent(LESSON_ATTEMPT_COMPLETED_EVENT, { detail: lessonNumber }),
  );
}

export function lessonAbandonedBody(lessonNumber: number): string {
  return JSON.stringify({
    eventType: "lesson_abandoned",
    lessonNumber,
  });
}

/** One POST. sendBeacon survives a tab close; fetch keepalive is the fallback. */
export function postLessonAbandoned(lessonNumber: number): void {
  const body = lessonAbandonedBody(lessonNumber);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/usage/event", blob)) return;
    }
  } catch {
    // The fetch below is the fallback.
  }
  if (typeof fetch !== "function") return;
  void fetch("/api/usage/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Fire lesson_abandoned once when this attempt leaves before completion.
 * Route changes run the cleanup. A hidden tab or page close uses sendBeacon.
 * The arming timer ignores a React strict-mode setup/cleanup pair.
 */
export function bindLessonAbandon(lessonNumber: number): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => undefined;
  }

  let completed = false;
  let sent = false;
  let armed = false;

  const timer = setTimeout(() => {
    armed = true;
  }, 0);

  const onCompleted = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (detail === lessonNumber) completed = true;
  };

  const send = () => {
    if (!armed || sent || completed) return;
    sent = true;
    postLessonAbandoned(lessonNumber);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") send();
  };

  const onPageHide = () => send();

  window.addEventListener(LESSON_ATTEMPT_COMPLETED_EVENT, onCompleted);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);

  return () => {
    clearTimeout(timer);
    window.removeEventListener(LESSON_ATTEMPT_COMPLETED_EVENT, onCompleted);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    send();
  };
}
