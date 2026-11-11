"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import type { LaunchpadAnswer } from "@/lib/launchpad/content/answers";
import {
  handbookGhost,
  handbookOpenIndex,
  handbookPages,
  handbookPagesForLevel,
  handbookScopePages,
  handbookTabs,
  handbookTabTarget,
  isHandbookPageEditable,
  type HandbookEntry,
} from "@/lib/launchpad/venture-test/handbook";
import type { VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { HandbookPage, TemplatesComingSoon } from "@/components/launchpad/venture/handbook/handbook-page";
import { HandbookIcon } from "@/components/launchpad/venture/handbook/handbook-art";
import { PAPER_BACKGROUND, SpiralBinding, Washi, WORKBOOK_BODY } from "@/components/launchpad/venture/handbook/paper-art";
import { TemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";
import { placeRhythmDoodles } from "@/components/launchpad/venture/handbook/scribble-mark";

const READ_ONLY_SAVE = () => {};

function paperLabel(page: { sheet?: string; number: number; silver: { id: string } }): string {
  return `Page ${page.number}`;
}

/** 44x44 book button that opens the handbook (home In Progress cards and the building screen). */
export function HandbookButton({ onClick }: { onClick: () => void }) {
  const s = useSurfaceCopy();
  return (
    <button
      type="button"
      aria-label={s.workbook.open}
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
  onBackToLift,
  onEditCosts,
  initialSheet,
  initialLevel,
  scopeLevel,
  backLabel = "‹ Back to the lift",
}: {
  entry: HandbookEntry;
  businessName: string;
  floors: readonly LaunchpadFloor[];
  progress: VentureTestProgress;
  iconVentureId: string;
  /** Save an answer. Only used from the building; home is read-only. */
  setAnswer?: (answerKey: string, answer: LaunchpadAnswer) => void;
  onClose: () => void;
  /** "Back to the lift": shown from the building; returns to the corridor with the plaques. */
  onBackToLift?: () => void;
  /** Pencil on My costs: open that sheet in the task. */
  onEditCosts?: (step: { name: "startup" } | { name: "service"; serviceId: string }) => void;
  /** Open on a named sheet, such as the Planning wrap after Jobs. */
  initialSheet?: string;
  /** Open on this floor's workbook section, including a read-only preview when it is still empty. */
  initialLevel?: number;
  /** Home card: only this level's template pages. Floor shortcuts leave this unset. */
  scopeLevel?: number;
  /** Label for the back control. The floor shortcut keeps "Back to the lift". */
  backLabel?: string;
}) {
  const s = useSurfaceCopy();
  const pages = scopeLevel != null
    ? handbookScopePages(progress, floors, scopeLevel)
    : initialLevel == null
      ? handbookPages(progress, floors)
      : handbookPagesForLevel(progress, floors, initialLevel);
  const ghost = scopeLevel == null ? handbookGhost(progress, floors) : null;
  const tabs = handbookTabs(progress, floors)
    .filter((tab) => scopeLevel == null || tab.level === scopeLevel)
    .map((tab) => (scopeLevel == null ? tab : { ...tab, tappable: true }));
  // A named sheet wins, then this floor's first page. Otherwise page 1. Next page moves forward.
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [index, setIndex] = useState(() => {
    if (initialSheet) {
      const found = pages.findIndex((item) => item.sheet === initialSheet);
      if (found !== -1) return found;
    }
    if (initialLevel != null) {
      const found = pages.findIndex((item) => item.level === initialLevel);
      if (found !== -1) return found;
    }
    return handbookOpenIndex(pages);
  });
  const at = Math.min(index, Math.max(0, pages.length - 1));
  const page = pages[at];
  const isLast = at === pages.length - 1;
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeX = useRef<number | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (paperRef.current) placeRhythmDoodles(paperRef.current, page?.number ?? 1);
  });
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
      data-handbook-scope={scopeLevel ?? undefined}
    >
      <header className="flex h-16 flex-none items-center gap-2 pl-1.5 pr-4">
        <button
          ref={closeRef}
          type="button"
          aria-label={s.workbook.close}
          onClick={onClose}
          className="flex size-11 flex-none items-center justify-center rounded-[10px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 id="handbook-title" className="font-heading text-lg font-semibold leading-tight text-[#111827]">
            {s.workbook.title}
          </h1>
          <p className="truncate text-[13px] text-[#6B7280]">{businessName}</p>
        </div>
        {entry === "home" && (
          <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]" data-read-only="">
            {s.workbook.readOnly}
          </span>
        )}
      </header>
      {onBackToLift && (
        <button
          type="button"
          onClick={onBackToLift}
          className="-mt-2 mb-1 ml-4 flex h-8 items-center self-start text-[14px] font-semibold text-nga-ink"
          data-back-to-lift=""
        >
          {backLabel}
        </button>
      )}

      <div className="relative min-h-0 flex-1">
        {isLast && ghost && (
          <div
            aria-label={`${s.chrome.nextPageLocked} ${ghost.silverTitle}`}
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
        {(page || templatesOpen) && (
          <div
            className="absolute bottom-[108px] left-[11px] right-[11px] top-1 z-raised overflow-hidden rounded-2xl border border-[#EDE7DC]"
            style={{ background: PAPER_BACKGROUND }}
            data-paper-card=""
            onPointerDown={(e) => (swipeX.current = e.clientX)}
            onPointerUp={(e) => {
              if (templatesOpen || swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 60) go(at + (dx < 0 ? 1 : -1));
            }}
          >
            <SpiralBinding />
            {!templatesOpen && page && (page.number === 2 || page.number === 6) && <Washi page={page.number === 6 ? 6 : 2} />}
            <div ref={paperRef} className={`h-full overflow-x-hidden overflow-y-auto pb-2 pl-10 pr-4 pt-6 ${WORKBOOK_BODY}`} data-paper-scroll="">
              <LaunchpadAnswersProvider
                value={{ iconVentureId, answers: progress.answers ?? {}, setAnswer: setAnswer ?? READ_ONLY_SAVE, floors }}
              >
                <TemplateBlanks on={scopeLevel != null}>
                  {templatesOpen ? (
                    <TemplatesComingSoon />
                  ) : page ? (
                    <HandbookPage key={`${page.kind}-${page.silver.id}-${page.sheet ?? ""}`} page={page} editable={editable} iconVentureId={iconVentureId} onEditCosts={onEditCosts} />
                  ) : null}
                </TemplateBlanks>
              </LaunchpadAnswersProvider>
            </div>
            {!templatesOpen && page ? (
              <p className="pointer-events-none absolute bottom-3 right-[18px] text-[11px] text-[#9CA3AF]" aria-hidden="true">
                {paperLabel(page)}
              </p>
            ) : null}
          </div>
        )}

        <nav aria-label={s.workbook.floors} className="absolute bottom-[72px] left-3 z-raised grid w-[266px] grid-cols-8 gap-0.5" data-workbook-chrome="folder">
          {tabs.map((t) => {
            const label = `Level ${t.level}, ${t.name}`;
            const viewing = !templatesOpen && page?.level === t.level;
            const later = !!page && t.level > page.level;
            // The floor being viewed gets the app's orange ring (outline, so it sits outside
            // the 44px tab and stacks with any state styling) whatever the tab's state.
            const viewedRing = viewing ? "outline outline-2 outline-offset-2 outline-[#FFA503]" : "";
            const base = `flex h-[38px] w-full min-w-0 items-center justify-center rounded-b-[3px] rounded-t-none border px-0 font-sans text-[13px] font-semibold ${viewedRing}`;
            const fill = viewing
              ? "border-[#19347D] bg-white text-[#19347D]"
              : later
                ? "border-[#E5E7EB] bg-[#F7F5F1] text-[#C4C0B8]"
                : "border-[#E7E1D6] bg-[#F3EFE6] text-[#6B645C]";
            if (!t.tappable)
              return (
                <button
                  key={t.level}
                  type="button"
                  disabled
                  aria-label={`${label}${s.chrome.notEarnedYet}`}
                  aria-current={viewing ? "true" : undefined}
                  className={`${base} border-[#E5E7EB] bg-[#F7F5F1] text-[#9CA3AF]`}
                  data-tab-state={t.state}
                  data-viewed={viewing ? "" : undefined}
                >
                  L{t.level}
                </button>
              );
            return (
              <button
                key={t.level}
                type="button"
                aria-label={label}
                aria-current={viewing ? "true" : undefined}
                onClick={() => {
                  setTemplatesOpen(false);
                  go(handbookTabTarget(pages, t.level));
                }}
                className={`${base} ${fill}`}
                data-tab-state={t.state}
                data-viewed={viewing ? "" : undefined}
              >
                L{t.level}
              </button>
            );
          })}
          <button
            type="button"
            aria-label={s.templates.label}
            aria-current={templatesOpen ? "true" : undefined}
            data-templates-tab=""
            onClick={() => setTemplatesOpen(true)}
            className={`flex h-[38px] w-full min-w-0 items-center justify-center rounded-b-[3px] rounded-t-none border font-sans text-[#19347D] ${templatesOpen ? "border-[#19347D] bg-white outline outline-2 outline-offset-2 outline-[#FFA503]" : "border-[#E7E1D6] bg-[#F3EFE6]"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        </nav>

        <div className="sr-only">
          <div className="flex items-center gap-[7px]" aria-hidden="true" data-page-dots="">
            {pages.map((p, i) => (
              <span key={`${p.kind}-${p.silver.id}-${p.sheet ?? i}`} className={`h-1.5 rounded-full ${i === at ? "w-[18px] rounded-[3px] bg-[#111827]" : "w-1.5 bg-[#E5E7EB]"}`} />
            ))}
            {ghost && <span className="size-1.5 rounded-full shadow-[inset_0_0_0_1px_#9CA3AF]" />}
          </div>
        </div>
        <div className="absolute bottom-[72px] right-3 z-raised flex gap-1">
          <button type="button" aria-label={s.workbook.previous} disabled={templatesOpen || at === 0} onClick={() => go(at - 1)} className="flex size-11 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40">
            <Chevron dir="left" />
          </button>
          <button type="button" aria-label={s.workbook.next} disabled={templatesOpen || isLast} onClick={() => go(at + 1)} className="flex size-11 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40">
            <Chevron dir="right" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center">
          <button type="button" onClick={() => (templatesOpen || isLast ? onClose() : go(at + 1))} className="h-11 min-w-[148px] rounded-full bg-[#19347D] px-6 text-[15px] font-semibold text-white">
            Continue
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          Page {at + 1} of {pages.length}
        </span>
      </div>
    </div>
  );
}
