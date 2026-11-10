"use client";

import { useEffect, useState } from "react";
import type { LaunchpadPictureScreen } from "@/lib/launchpad/content/types";
import { playStoryClipOnScreen, stopStoryAudio } from "@/lib/academy/lessons/story-audio/playback";
import { LessonContinue, LessonCredit, LessonSurface } from "@/components/launchpad/venture/screens/screen-ui";
import { LESSON_BODY } from "@/components/launchpad/venture/screens/screen-ui";

/** Art and one paragraph on the shared white lesson page. No extra headings. */
export function PictureFlow({
  screen,
  onExit,
  onFinish,
}: {
  screen: LaunchpadPictureScreen;
  onExit: () => void;
  onFinish: () => void;
}) {
  const [page, setPage] = useState(0);
  const total = screen.pages.length;
  const current = screen.pages[Math.min(page, Math.max(0, total - 1))] ?? screen.pages[0];
  useEffect(() => {
    if (!current) return;
    void playStoryClipOnScreen(current.audio);
  }, [current]);
  useEffect(() => () => stopStoryAudio(), []);
  if (!current) return null;
  const last = page >= total - 1;
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={total > 1 ? { index: page + 1, total } : undefined}
      showMute={screen.voice === true}
      creditSlot={screen.pages.some((item) => item.credit)}
      footer={<LessonContinue onClick={() => (last ? onFinish() : setPage(page + 1))} />}
    >
      {current.credit ? <LessonCredit credit={current.credit} /> : null}
      <div data-task-screen="picture" data-picture-page={current.id}>
        <img src={current.image} alt={current.alt} className="mx-auto mb-4 block h-auto w-full" />
        <p className={LESSON_BODY}>{current.body}</p>
      </div>
    </LessonSurface>
  );
}
