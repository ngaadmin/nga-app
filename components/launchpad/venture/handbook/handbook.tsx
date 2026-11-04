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

const READ_ONLY_SAVE = () => {};

/** r4 warm paper grain (a faint SVG noise tile over #FDFBF7). */
const PAPER_NOISE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .07 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>";

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
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/** r4 lock glyph (outline, 10px). */
function SmallLock() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#9CA3AF" strokeWidth="2.4">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
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
  setAnswer,
  onClose,
}: {
  entry: HandbookEntry;
  businessName: string;
  floors: readonly LaunchpadFloor[];
  progress: VentureTestProgress;
  iconVentureId: string;
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
      className="fixed inset-0 z-modal mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-white text-[#111827]"
      data-handbook={entry}
    >
      <header className="flex h-16 flex-none items-center gap-2 pl-1.5 pr-4">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close handbook"
          onClick={onClose}
          className="flex size-11 flex-none items-center justify-center rounded-[10px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 id="handbook-title" className="font-heading text-lg font-semibold leading-tight text-[#111827]">
            My handbook
          </h1>
          <p className="truncate text-[13px] text-[#6B7280]">{businessName}</p>
        </div>
        {entry === "home" && (
          <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]" data-read-only="">
            Read only
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        {isLast && ghost && (
          <div
            aria-label={`Next page, locked: ${ghost.silverTitle}`}
            role="img"
            className="absolute bottom-[62px] right-[64px] top-[14px] w-9 rounded-r-[14px] border border-l-0 border-[#EDE7DC] bg-[#FDFBF7]"
            data-handbook-ghost=""
          >
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rotate-90 items-center gap-1.5 whitespace-nowrap pl-1.5 text-[11px] font-medium text-[#9CA3AF]">
              <SmallLock />
              Next: {ghost.silverTitle}
            </span>
          </div>
        )}
        {page && (
          <div
            className="absolute bottom-[52px] left-4 right-[88px] top-1 z-raised rounded-2xl border border-[#EDE7DC]"
            style={{ background: `#FDFBF7 url("${PAPER_NOISE}")` }}
            data-paper-card=""
            onPointerDown={(e) => (swipeX.current = e.clientX)}
            onPointerUp={(e) => {
              if (swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 60) go(at + (dx < 0 ? 1 : -1));
            }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute -left-5 bottom-[18px] z-raised h-5 w-20 rotate-[38deg] bg-[#3FB7DA] opacity-50 [clip-path:polygon(0_8%,6%_0,12%_10%,18%_0,82%_0,88%_12%,94%_0,100%_10%,100%_92%,94%_100%,88%_88%,82%_100%,18%_100%,12%_90%,6%_100%,0_88%)]" data-washi="" />
            <div className="h-full overflow-y-auto px-5 pb-10 pt-5">
              <LaunchpadAnswersProvider
                value={{ iconVentureId, answers: progress.answers ?? {}, setAnswer: setAnswer ?? READ_ONLY_SAVE }}
              >
                <HandbookPage key={page.silver.id} page={page} editable={editable} iconVentureId={iconVentureId} />
              </LaunchpadAnswersProvider>
            </div>
            <p className="pointer-events-none absolute bottom-3 right-[18px] text-[11px] text-[#9CA3AF]" aria-hidden="true">
              Page {page.number}
            </p>
          </div>
        )}

        <nav aria-label="Handbook floors" className="absolute right-2.5 top-[14px] flex w-11 flex-col gap-2">
          {tabs.map((t) => {
            const label = `Level ${t.level}, ${t.name}`;
            const base = "flex h-[58px] w-11 flex-col items-center justify-center gap-1 rounded-[10px] text-[13px]";
            if (!t.tappable)
              return (
                <button
                  key={t.level}
                  type="button"
                  disabled
                  aria-label={`${label}, not earned yet`}
                  className={`${base} font-medium text-[#9CA3AF] shadow-[inset_0_0_0_1px_#E5E7EB]`}
                  data-tab-state={t.state}
                >
                  L{t.level}
                  <SmallLock />
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
                className={`${base} font-semibold ${t.state === "current" ? "bg-[#3FB7DA] text-white" : "bg-[#F3F4F6] text-[#374151]"} ${
                  viewing && t.state !== "current" ? "shadow-[inset_0_0_0_1.5px_#9CA3AF]" : ""
                }`}
                data-tab-state={t.state}
              >
                L{t.level}
              </button>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-1 flex h-11 items-center justify-center gap-2">
          <button type="button" aria-label="Previous page" disabled={at === 0} onClick={() => go(at - 1)} className="flex size-11 items-center justify-center rounded-full disabled:opacity-40">
            <Chevron dir="left" />
          </button>
          <div className="flex items-center gap-[7px]" aria-hidden="true" data-page-dots="">
            {pages.map((p, i) => (
              <span key={p.silver.id} className={`h-1.5 rounded-full ${i === at ? "w-[18px] rounded-[3px] bg-[#111827]" : "w-1.5 bg-[#E5E7EB]"}`} />
            ))}
            {ghost && <span className="size-1.5 rounded-full shadow-[inset_0_0_0_1px_#9CA3AF]" />}
          </div>
          <span className="sr-only" aria-live="polite">
            Page {at + 1} of {pages.length}
          </span>
          <button type="button" aria-label="Next page" disabled={isLast} onClick={() => go(at + 1)} className="flex size-11 items-center justify-center rounded-full disabled:opacity-40">
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </div>
  );
}
