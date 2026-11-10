"use client";

import { useEffect, useState } from "react";
import type { LaunchpadPictureScreen } from "@/lib/launchpad/content/types";
import { StoryAudioPlayer } from "@/components/academy/lesson/story-audio-player";
import { STORY_BEAT_NEXT_LOCK_MS, playStoryClipFromGesture, stopStoryAudio, storyBeatNextEnabled } from "@/lib/academy/lessons/story-audio/playback";
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
  const beatKey = current?.audio?.src ? current.id : "";
  const [lockKey, setLockKey] = useState(beatKey);
  const [beatElapsedMs, setBeatElapsedMs] = useState(0);
  if (beatKey !== lockKey) {
    setLockKey(beatKey);
    setBeatElapsedMs(0);
  }
  useEffect(() => {
    if (!beatKey) return;
    const timer = window.setTimeout(() => setBeatElapsedMs(STORY_BEAT_NEXT_LOCK_MS), STORY_BEAT_NEXT_LOCK_MS);
    return () => window.clearTimeout(timer);
  }, [beatKey]);
  useEffect(() => () => stopStoryAudio(), []);
  if (!current) return null;
  const continueEnabled = storyBeatNextEnabled({
    isStoryBeat: Boolean(current.audio?.src),
    screenReady: true,
    elapsedMs: beatElapsedMs,
  });
  const last = page >= total - 1;
  const leave = (go: () => void) => {
    stopStoryAudio();
    go();
  };
  const show = (index: number) => {
    const next = screen.pages[index];
    if (next?.audio?.src) playStoryClipFromGesture(next.audio.src);
    setPage(index);
  };
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <StoryAudioPlayer
        clip={current.audio}
        preloadSrc={screen.pages[page + 1]?.audio?.src}
        aboveCredit={Boolean(current.credit)}
      />
      <LessonSurface
        title={screen.title}
        onBack={() => (page === 0 ? leave(onExit) : show(page - 1))}
        progress={total > 1 ? { index: page + 1, total } : undefined}
        showMute={screen.voice === true}
        creditSlot={screen.pages.some((item) => item.credit)}
        footer={<LessonContinue disabled={!continueEnabled} onClick={() => (last ? leave(onFinish) : show(page + 1))} />}
      >
        {current.credit ? <LessonCredit credit={current.credit} /> : null}
        <div data-task-screen="picture" data-picture-page={current.id}>
          <img src={current.image} alt={current.alt} className="mx-auto mb-4 block h-auto w-full" />
          <p className={LESSON_BODY}>{current.body}</p>
        </div>
      </LessonSurface>
    </div>
  );
}
