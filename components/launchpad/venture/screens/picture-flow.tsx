"use client";

import { useState } from "react";
import type { LaunchpadPictureScreen } from "@/lib/launchpad/content/types";
import { LessonContinue, LessonSurface } from "@/components/launchpad/venture/screens/screen-ui";
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
  if (!current) return null;
  const last = page >= total - 1;
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={total > 1 ? { index: page + 1, total } : undefined}
      footer={<LessonContinue onClick={() => (last ? onFinish() : setPage(page + 1))} />}
    >
      <div data-task-screen="picture" data-picture-page={current.id}>
        <img src={current.image} alt={current.alt} className="mx-auto mb-4 block h-auto w-full" />
        <p className={LESSON_BODY}>{current.body}</p>
      </div>
    </LessonSurface>
  );
}
