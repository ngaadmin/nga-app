"use client";

import { useEffect, useRef, useState } from "react";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import type { BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import {
  handbookGhost,
  handbookOpenIndex,
  handbookPages,
  handbookTabs,
  handbookTabTarget,
  isHandbookPageEditable,
  type HandbookEntry,
} from "@/lib/launchpad/venture-test/handbook";
import type { VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { HandbookPage } from "@/components/launchpad/venture/handbook/handbook-page";
import { HandbookIcon } from "@/components/launchpad/venture/handbook/handbook-art";
import { LockIcon } from "@/components/launchpad/venture-test/venture-test-ui";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

const READ_ONLY_SAVE = () => {};

/** 44x44 book button that opens the handbook (home In Progress cards and the building screen). */
export function HandbookButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open handbook"
      onClick={onClick}
      className="flex size-11 flex-none items-center justify-center rounded-full bg-nga-panel shadow-[0_3px_0_#099fb8]"
      data-handbook-button=""
    >
      <HandbookIcon />
    </button>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} stroke={VT.ink} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The handbook overlay. Opened from home it is read-only; opened from the
 * building, pages for completed silvers can be edited inline. It reads and
 * writes the same saved answers as the lessons and wrap-ups (single source
 * of truth), so every page re-renders straight from them.
 */
export function Handbook({
  entry,
  businessName,
  floors,
  progress,
  iconVentureId,
  ventureId,
  setAnswer,
  onClose,
}: {
  entry: HandbookEntry;
  businessName: string;
  floors: readonly LaunchpadFloor[];
  progress: VentureTestProgress;
  iconVentureId: string;
  ventureId: string;
  /** Save an answer. Only used from the building; home is read-only. */
  setAnswer?: (answerKey: string, answer: BusinessIdentityAnswer) => void;
  onClose: () => void;
}) {
  const pages = handbookPages(progress, floors);
  const ghost = handbookGhost(progress, floors);
  const tabs = handbookTabs(progress, floors);
  const [index, setIndex] = useState(() => handbookOpenIndex(pages));
  const at = Math.min(index, Math.max(0, pages.length - 1));
  const page = pages[at];
  const isLast = at === pages.length - 1;
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const go = (i: number) => setIndex(Math.max(0, Math.min(pages.length - 1, i)));
  const editable = page ? isHandbookPageEditable(entry, page.done) && !!setAnswer : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="handbook-title"
      className="fixed inset-0 z-modal mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-white text-nga-ink"
      data-handbook={entry}
    >
      <header className="flex h-16 flex-none items-center gap-2 px-3">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close handbook"
          onClick={onClose}
          className="flex size-11 flex-none items-center justify-center rounded-full bg-nga-mist"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke={VT.ink} strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 id="handbook-title" className="font-heading text-lg font-extrabold leading-tight">
            My handbook
          </h1>
          <p className="truncate text-xs font-semibold text-nga-slate">{businessName}</p>
        </div>
        {entry === "home" && (
          <span className="rounded-full border border-nga-panel px-2.5 py-1 text-[11px] font-semibold text-nga-slate" data-read-only="">
            Read only
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        {isLast && ghost && (
          <div
            aria-label={`Next page, locked: ${ghost.silverTitle}`}
            role="img"
            className="absolute bottom-2 left-3 right-[60px] top-1 rounded-2xl border-2 border-dashed border-nga-panel bg-nga-mist/60"
            data-handbook-ghost=""
          >
            <span className="absolute right-1 top-1/2 flex -translate-y-1/2 rotate-180 items-center gap-1.5 text-[11px] font-semibold text-nga-slate/70 [writing-mode:vertical-rl]">
              <LockIcon size={11} color={VT.slate} />
              Next: {ghost.silverTitle}
            </span>
          </div>
        )}
        {page && (
          <div
            className="absolute bottom-3 left-3 right-[78px] top-0 overflow-y-auto rounded-2xl bg-white p-3.5 shadow-[0_2px_0_#bde9fb,0_8px_24px_rgba(3,31,130,0.12)] ring-2 ring-nga-panel"
            onPointerDown={(e) => (swipeX.current = e.clientX)}
            onPointerUp={(e) => {
              if (swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 60) go(at + (dx < 0 ? 1 : -1));
            }}
          >
            <LaunchpadAnswersProvider
              value={{ iconVentureId, answers: progress.answers ?? {}, setAnswer: setAnswer ?? READ_ONLY_SAVE }}
            >
              <HandbookPage key={page.silver.id} page={page} editable={editable} iconVentureId={iconVentureId} propVentureId={ventureId} />
            </LaunchpadAnswersProvider>
          </div>
        )}

        <nav aria-label="Handbook floors" className="absolute bottom-3 right-0 top-2 flex w-[62px] flex-col items-end gap-1.5">
          {tabs.map((t) => {
            const label = `Level ${t.level}, ${t.name}`;
            const base = "flex min-h-11 max-h-[96px] flex-1 items-center justify-center rounded-l-xl font-heading text-[15px] font-extrabold";
            if (!t.tappable)
              return (
                <button
                  key={t.level}
                  type="button"
                  disabled
                  aria-label={`${label}, not earned yet`}
                  className={`${base} w-[54px] border-2 border-r-0 border-dashed border-nga-panel bg-white text-nga-slate/40`}
                  data-tab-state={t.state}
                >
                  L{t.level}
                </button>
              );
            const viewing = page?.level === t.level;
            return (
              <button
                key={t.level}
                type="button"
                aria-label={label}
                aria-current={viewing ? "true" : undefined}
                onClick={() => go(handbookTabTarget(pages, t.level))}
                className={`${base} ${t.state === "current" ? "w-[62px] bg-nga-secondary text-nga-ink" : "w-[54px] bg-nga-ink text-white"} ${viewing ? "ring-2 ring-inset ring-nga-cta" : ""}`}
                data-tab-state={t.state}
              >
                L{t.level}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex h-14 flex-none items-center justify-center gap-3 pb-1">
        <button type="button" aria-label="Previous page" disabled={at === 0} onClick={() => go(at - 1)} className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
          <Chevron dir="left" />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {pages.map((p, i) => (
            <span key={p.silver.id} className={`size-2 rounded-full ${i === at ? "w-4 bg-nga-secondary" : "bg-nga-panel"}`} />
          ))}
          {ghost && <span className="size-2 rounded-full border border-dashed border-nga-slate/50" />}
        </div>
        <span className="sr-only" aria-live="polite">
          Page {at + 1} of {pages.length}
        </span>
        <button type="button" aria-label="Next page" disabled={isLast} onClick={() => go(at + 1)} className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}
