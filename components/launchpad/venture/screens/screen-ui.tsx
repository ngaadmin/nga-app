"use client";

import { useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { StoryCreditSlotContext } from "@/components/academy/lesson/academy-lesson-shell";
import { MasterMuteButton } from "@/components/academy/lesson/master-mute-button";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { SCRIBBLE_SRC, type ScribbleName } from "@/components/launchpad/venture/handbook/scribble-mark";
import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";

/** Navy Inter 400, 18px, line-height 1.44. Body, context, statements, and playback. */
export const LESSON_BODY = "font-sans text-[18px] font-normal leading-[26px] text-[#19347D]";
/** Hints, notes, links, and progress text. 16px, never smaller. */
export const LESSON_HINT = "font-sans text-[16px] font-normal leading-[23px] text-[#4A5568]";
/** A picked answer: navy Inter 600, 18px, 1.5px aqua underline. */
export const LESSON_PICK = "font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] underline decoration-[#0CC1E0] decoration-[1.5px] underline-offset-[3px]";
/** Tick and option labels. */
export const LESSON_TICK_LABEL = "font-sans text-[18px] font-normal leading-[26px] text-[#19347D]";

const TITLE = `${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] tracking-[-0.4px] text-[#19347D]`;

const PROMPT = {
  question: `${FREDOKA_CLASS} text-[21px] font-semibold leading-[30px] text-[#0CC1E0]`,
  section: `${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#0CC1E0]`,
  sub: `${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#0CC1E0]`,
} as const;

/**
 * White lesson top bar: back chevron and the screen title.
 * 34px above the title, 20px at the sides. An optional progress row sits under the title.
 */
export function LessonTopBar({
  title,
  onBack,
  progress,
  trailing,
  progressClassName = "mt-3.5",
}: {
  title: string;
  onBack: () => void;
  /** 1-based page index. Filled dots run through the current page. */
  progress?: { index: number; total: number };
  /** Extra title-row content that is not the shared progress row. */
  trailing?: ReactNode;
  /** Gap under the title. Only a screen that needs more air passes this. */
  progressClassName?: string;
}) {
  const s = useSurfaceCopy();
  return (
    <div className="px-5 pt-[34px]" data-lesson-top-bar="">
      <div className="flex items-center gap-3.5">
        <button type="button" onClick={onBack} aria-label={s.chrome.back} className="-ml-3 flex size-11 shrink-0 items-center justify-center text-[#19347D]">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
            <path d="M10 2 3 10l7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={`min-w-0 flex-1 ${TITLE}`}>{title}</h1>
        {trailing}
      </div>
      {progress && (
        <div className={`${progressClassName} flex items-center gap-2`} data-lesson-progress="">
          {Array.from({ length: progress.total }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`size-2.5 rounded-full border-2 border-[#19347D] ${index < progress.index ? "bg-[#19347D]" : "bg-white"}`}
            />
          ))}
          <p className={`ml-auto ${LESSON_HINT}`}>
            Section {progress.index} of {progress.total}
          </p>
        </div>
      )}
    </div>
  );
}

/** Question, section heading, or subheading. `flush` drops the side margin for a padded lesson. */
export function ScreenPrompt({
  children,
  id,
  tone = "question",
  flush = false,
  gap = false,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: keyof typeof PROMPT;
  flush?: boolean;
  /** 16px above a subheading that follows a bullet or body line. */
  gap?: boolean;
  /** Extra classes. Use an important margin when a screen needs a set gap. */
  className?: string;
}) {
  return (
    <p id={id} className={`${flush ? "" : "mx-5"} ${gap ? "mt-4" : "mt-1"} ${PROMPT[tone]} ${className}`}>
      {children}
    </p>
  );
}

/** How-to line under the prompt. 12px under the line above it. */
export function ScreenGuidance({ children, flush = false, className = "" }: { children: ReactNode; flush?: boolean; className?: string }) {
  return <p className={`${flush ? "" : "mx-5"} mt-3 ${LESSON_HINT} ${className}`}>{children}</p>;
}

/** Corner illustration. Bottom 100px, right 28px, clear of the Continue pill. */
export function AnchorDoodle({ name, size }: { name: ScribbleName; size: number }) {
  return (
    <img
      src={SCRIBBLE_SRC[name]}
      alt=""
      width={size}
      height={size}
      draggable={false}
      data-scribble-large={name}
      className="pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto mix-blend-multiply"
      style={{ width: size }}
    />
  );
}

/**
 * Opening of a bronze's first screen. The usual order is aqua question, navy
 * context, gray guidance. Find the why and Know your impact use
 * `context-first`: navy context, gray guidance, aqua question, with the
 * interaction directly under the question. Spacing stays 4px above the
 * question, 12px above the context, and 12px above the guidance. A
 * question-first screen leaves 20px under the guidance before the
 * interaction. `flush` drops the side margin inside an already padded lesson.
 */
export function BronzeFirstLead({
  question,
  context,
  guidance,
  questionId,
  flush = false,
  questionClassName = "",
  order = "question-first",
}: {
  question?: string;
  context?: string;
  guidance?: string;
  questionId?: string;
  flush?: boolean;
  questionClassName?: string;
  order?: "question-first" | "context-first";
}) {
  const questionNode = question ? (
    <ScreenPrompt id={questionId} tone="question" flush={flush} className={`${order === "context-first" ? "mb-5" : ""} ${questionClassName}`.trim()}>
      {question}
    </ScreenPrompt>
  ) : null;
  const contextNode = context ? <p className={`${flush ? "" : "mx-5"} mt-3 ${LESSON_BODY}`}>{context}</p> : null;
  const guidanceNode = guidance ? <ScreenGuidance flush={flush} className={order === "question-first" ? "mb-5" : ""}>{guidance}</ScreenGuidance> : null;
  if (order === "context-first") {
    return (
      <>
        {contextNode}
        {guidanceNode}
        {questionNode}
      </>
    );
  }
  return (
    <>
      {questionNode}
      {contextNode}
      {guidanceNode}
    </>
  );
}

/** Progress text such as "Goal 2 of 5". Same color and size as a hint. */
export function ScreenEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={`mx-5 mt-2 ${LESSON_HINT}`} data-screen-eyebrow="">
      {children}
    </p>
  );
}

/**
 * Top of a one-screen capture page (load D21): the "why it matters" line, then
 * the how-to line on the light accent panel, as on the context page.
 */
export function ScreenIntro({ context, guidance }: { context: string; guidance?: string }) {
  return (
    <div className="mx-5 mb-4 mt-2 flex flex-col gap-3 short:mb-2.5 short:mt-1 short:gap-2" data-screen-intro="">
      <p className={LESSON_BODY}>{context}</p>
      {guidance && (
        <p className="rounded-r-2xl border-l-4 border-nga-secondary bg-[#F7FAFD] px-4 py-3 text-[16px] leading-[23px] text-[#4A5568] short:py-2" data-guidance="">
          {guidance}
        </p>
      )}
    </div>
  );
}

/**
 * Footer credit, portalled above Continue. Same slot as Academy's story credit,
 * at the 16px floor. Medium weight, #5A6A99.
 */
export function LessonCredit({ credit }: { credit: string }) {
  const slot = useContext(StoryCreditSlotContext);
  if (!slot) return null;
  return createPortal(
    <p className="pb-1 text-center font-sans text-[16px] font-medium leading-[23px] text-[#5A6A99]" data-lesson-credit="">
      {credit}
    </p>,
    slot,
  );
}

/** White lesson frame: title bar, scroll, and the centered Continue. */
export function LessonSurface({
  title,
  onBack,
  progress,
  footer,
  children,
  showMute = false,
  creditSlot = false,
  aboveFooter,
  progressClassName,
  decoration,
  air = "standard",
}: {
  title: string;
  onBack: () => void;
  progress?: { index: number; total: number };
  footer: ReactNode;
  children: ReactNode;
  /** Shared Academy mute control. Off unless this screen asks for it. */
  showMute?: boolean;
  /** Mount the footer slot a story credit can portal into. */
  creditSlot?: boolean;
  /** Sits above the credit and Continue, in the footer flow. */
  aboveFooter?: ReactNode;
  /** Gap under the title, before the progress row. */
  progressClassName?: string;
  /** Art pinned to the lesson frame, outside the scrolling copy. */
  decoration?: ReactNode;
  /** 20px under the progress row. Light screens use 40px. A full screen can drop the top air so it still fits. */
  air?: "standard" | "roomy" | "fitted" | "plain";
}) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const frame = (
    <section className="relative flex min-h-0 flex-1 flex-col bg-white" data-lesson-surface="">
      {showMute ? <MasterMuteButton /> : null}
      <LessonTopBar title={title} onBack={onBack} progress={progress} progressClassName={progressClassName} />
      <div className={`min-h-0 flex-1 overflow-y-auto px-5 [&>:first-child]:mt-0 [&>:first-child>:first-child]:mt-0 ${air === "roomy" ? "pt-10 pb-4" : air === "fitted" ? "pt-0 pb-[30px]" : air === "plain" ? "pt-0 pb-2" : "pt-5 pb-4"}`} data-lesson-air={air}>{children}</div>
      <div className="px-5 pb-[18px]">
        {aboveFooter}
        {creditSlot ? <div ref={setSlot} className="w-full" data-lesson-credit-slot="" /> : null}
        {footer}
      </div>
      {decoration}
    </section>
  );
  if (!creditSlot) return frame;
  return <StoryCreditSlotContext.Provider value={slot}>{frame}</StoryCreditSlotContext.Provider>;
}

/** Navy Continue pill, 140 by 44. Disabled is the same pill at 35% opacity. */
export function LessonContinue({ disabled, onClick, children = "Continue" }: { disabled?: boolean; onClick: () => void; children?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mx-auto flex h-11 w-[140px] items-center justify-center rounded-full bg-[#19347D] font-heading text-[16px] font-semibold leading-none text-white disabled:cursor-not-allowed disabled:opacity-[0.35]"
    >
      {children}
    </button>
  );
}
