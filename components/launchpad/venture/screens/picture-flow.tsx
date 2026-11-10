"use client";

import { useEffect, useState } from "react";
import type { LaunchpadPictureScreen } from "@/lib/launchpad/content/types";
import { StoryAudioPlayer } from "@/components/academy/lesson/story-audio-player";
import { STORY_BEAT_NEXT_LOCK_MS, playStoryClipFromGesture, stopStoryAudio, storyBeatNextEnabled } from "@/lib/academy/lessons/story-audio/playback";
import { SplitEditor } from "@/components/launchpad/venture/screens/split-editor";
import { writeBudgetSplit } from "@/lib/launchpad/content/budgeting/split";
import { LessonContinue, LessonCredit, LessonSurface } from "@/components/launchpad/venture/screens/screen-ui";
import { LESSON_BODY } from "@/components/launchpad/venture/screens/screen-ui";

function pageAudio(page: { audio?: { src: string; durationMs: number } } | { split: true } | undefined) {
  return page && "audio" in page ? page.audio : undefined;
}

function pageCredit(page: { credit?: string } | { split: true } | undefined) {
  return page && "credit" in page ? page.credit : undefined;
}

/** Square art was about 350px tall and covered the last lines. This stays above Academy's 11rem (176px). */
const ART_CLASS = "mx-auto mb-3 block h-auto max-h-[260px] w-auto max-w-full object-contain";

function BodyCopy({ body }: { body: string }) {
  const splitAt = body.lastIndexOf(" ");
  if (splitAt < 0) return <span data-body-end="">{body}</span>;
  return (
    <>
      {body.slice(0, splitAt + 1)}
      <span data-body-end="">{body.slice(splitAt + 1)}</span>
    </>
  );
}

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
  const [split, setSplit] = useState<readonly number[] | null>(null);
  const total = screen.pages.length;
  const current = screen.pages[Math.min(page, Math.max(0, total - 1))] ?? screen.pages[0];
  const beatKey = pageAudio(current)?.src && current ? current.id : "";
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
    isStoryBeat: Boolean(pageAudio(current)?.src),
    screenReady: true,
    elapsedMs: beatElapsedMs,
  });
  const splitTotal = split?.reduce((sum, value) => sum + value, 0) ?? 100;
  const canContinue = continueEnabled && (!current.split || splitTotal === 100);
  const last = page >= total - 1;
  const leave = (go: () => void) => {
    stopStoryAudio();
    go();
  };
  const show = (index: number) => {
    const next = screen.pages[index];
    const audio = pageAudio(next);
    if (audio?.src) playStoryClipFromGesture(audio.src);
    setPage(index);
  };
  const finish = () => {
    if (current.split && split) writeBudgetSplit(split);
    leave(onFinish);
  };
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <LessonSurface
        title={current.split ? "Set your own split" : screen.title}
        onBack={() => (page === 0 ? leave(onExit) : show(page - 1))}
        progress={total > 1 ? { index: page + 1, total } : undefined}
        progressClassName={current.split ? "mt-8" : undefined}
        showMute={screen.voice === true}
        creditSlot={screen.pages.some((item) => pageCredit(item))}
        aboveFooter={pageAudio(current) ? <StoryAudioPlayer inline clip={pageAudio(current)} preloadSrc={pageAudio(screen.pages[page + 1])?.src} /> : null}
        footer={<LessonContinue disabled={!canContinue} onClick={() => (current.split ? finish() : last ? leave(onFinish) : show(page + 1))}>{current.split ? "Lock in my split" : "Continue"}</LessonContinue>}
      >
        {pageCredit(current) ? <LessonCredit credit={pageCredit(current) ?? ""} /> : null}
        <div data-task-screen="picture" data-picture-page={current.id}>
          {current.split ? (
            <SplitEditor onChange={setSplit} />
          ) : (
            <>
              <img src={current.image} alt={current.alt} className={ART_CLASS} />
              <p className={LESSON_BODY}><BodyCopy body={current.body} /></p>
            </>
          )}
        </div>
      </LessonSurface>
    </div>
  );
}
