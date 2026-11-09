"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import type { LaunchpadGettingReadyScreen } from "@/lib/launchpad/content/types";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import {
  AFTER_HOW,
  AGREE_ITEMS,
  AGREE_UNDERSTOOD_EMPTY,
  BEFORE_HOW,
  CHANNELS,
  FEEDBACK_HOW,
  PAYMENT_HOW,
  POLISH_QUESTIONS,
  PRACTICE_WHEN,
  PRACTICE_WHO,
  findReady,
  practiceLines,
  type PolishRow,
} from "@/lib/launchpad/content/getting-ready/copy";
import {
  agreeJobOf,
  deliverJobOf,
  findCustomersOf,
  polishServiceOf,
  practiceRunOf,
  wrapJobOf,
  type AgreeJobAnswer,
  type DeliverJobAnswer,
  type FindCustomersAnswer,
  type PolishServiceAnswer,
  type PracticeRunAnswer,
  type WrapJobAnswer,
} from "@/lib/launchpad/content/answers";
import { Chip, ReadTick } from "@/components/launchpad/venture/screens/lesson-controls";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { LESSON_BODY, LESSON_HINT, LESSON_PICK, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

type ReadyAnswer = FindCustomersAnswer | AgreeJobAnswer | DeliverJobAnswer | WrapJobAnswer | PracticeRunAnswer | PolishServiceAnswer;

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l5 5L19 7" />
    </svg>
  );
}

function Tick({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`mt-0.5 flex size-6 flex-none items-center justify-center rounded-[5px] ${on ? "bg-[#FFA503]" : "border-2 border-[#D1D5DB] bg-white"}`}
    >
      {on ? <Check /> : null}
    </button>
  );
}

function Aqua({ children }: { children: ReactNode }) {
  return <h2 className="font-heading text-[22px] font-semibold leading-tight text-[#3FB7DA] underline decoration-[#7ED4EA] decoration-[3px] underline-offset-[5px]">{children}</h2>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9AA3B5]">{children}</p>;
}

function Rule() {
  return <div className="my-2 border-b border-dashed border-[#E4D3B4]" />;
}

const OpenMenuContext = createContext<{ id: string | null; setId: (id: string | null) => void } | null>(null);

function MenuScope({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  return <OpenMenuContext.Provider value={{ id, setId }}>{children}</OpenMenuContext.Provider>;
}

function InlineMenu<T extends { id: string; label: string }>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value?: string;
  options: readonly T[];
  onPick: (id: string) => void;
}) {
  const menu = useContext(OpenMenuContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = menu ? menu.id === label : localOpen;
  const setOpen = (next: boolean) => {
    if (next && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lp-inline-menu", { detail: label }));
    if (menu) menu.setId(next ? label : null);
    else setLocalOpen(next);
  };
  useEffect(() => {
    const onOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== label) setLocalOpen(false);
    };
    window.addEventListener("lp-inline-menu", onOpen);
    return () => window.removeEventListener("lp-inline-menu", onOpen);
  }, [label]);
  const current = options.find((row) => row.id === value);
  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 border-b-2 border-[#3FB7DA] font-semibold text-[#19347D]"
      >
        {current?.label ?? "choose"}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" className="text-[#3FB7DA]">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open && (
        <ul className="absolute right-0 z-overlay mt-1 w-[168px] rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(25,52,125,0.16)]" data-open-menu="">
          {options.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-[#19347D]"
                onClick={() => {
                  onPick(row.id);
                  setOpen(false);
                }}
              >
                {row.label}
                {row.id === value ? <span aria-hidden="true">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

export function GettingReadyFlow({
  screen,
  answers,
  floors,
  businessName,
  onExit,
  onSave,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  floors: readonly LaunchpadFloor[];
  businessName: string;
  onExit: () => void;
  /** Save without completing the bronze. Used when Agree the job is left early. */
  onSave?: (answer: ReadyAnswer) => void;
  onFinish: (answer: ReadyAnswer) => void;
}) {
  const services = useMemo(() => {
    const chosen = chosenServices(floors, answers, "l1-offer");
    return chosen.length ? chosen : [{ id: "dog-walking", label: "Dog walking" }];
  }, [floors, answers]);

  if (screen.step === "find") return <FindStep screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
  if (screen.step === "agree") return <AgreeStep screen={screen} answers={answers} onExit={onExit} onSave={onSave} onFinish={onFinish} />;
  if (screen.step === "deliver") return <DeliverStep screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
  if (screen.step === "wrap-job") return <WrapJobStep screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
  if (screen.step === "practice") return <PracticeStep screen={screen} answers={answers} businessName={businessName} services={services} onExit={onExit} onFinish={onFinish} />;
  return <PolishStep screen={screen} answers={answers} businessName={businessName} services={services} onExit={onExit} onFinish={onFinish} />;
}

function FindStep({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: FindCustomersAnswer) => void;
}) {
  const saved = findCustomersOf(answers, screen.answerKey);
  const [channels, setChannels] = useState<string[]>(saved?.channels ? [...saved.channels] : []);
  const [extra, setExtra] = useState(saved?.channelsExtra ?? "");
  const [extraOpen, setExtraOpen] = useState(!!saved?.channelsExtra);
  const ready = findReady(channels, extra);
  const toggle = (id: string) => setChannels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <LessonSurface
      title={screen.title}
      onBack={onExit}
      footer={
        <LessonContinue
          disabled={!ready}
          onClick={() =>
            ready &&
            onFinish({
              kind: "find-customers",
              version: 1,
              channels,
              ...(extra.trim() ? { channelsExtra: extra.trim() } : {}),
            })
          }
        />
      }
    >
      <div data-task-screen="find-customers">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        <div className="mt-2">
          {(screen.channels ?? []).map((row) => (
            <Chip key={row.id} variant="lined" label={row.label} selected={channels.includes(row.id)} onClick={() => toggle(row.id)} />
          ))}
        </div>
        <button type="button" className={`mt-3 ${LESSON_BODY}`} onClick={() => setExtraOpen(true)}>
          {screen.alsoLabel}
        </button>
        {extraOpen ? (
          <input
            aria-label={screen.alsoLabel}
            maxLength={60}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            className="mt-1 w-full border-b border-dashed border-[#F4D5A7] bg-transparent py-1 text-[16px] text-[#19347D] outline-none"
          />
        ) : null}
      </div>
    </LessonSurface>
  );
}

const AGREE_ICON: Record<(typeof AGREE_ITEMS)[number]["id"], ReactNode> = {
  collect_info: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  ),
  confirm_dog: (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4.5" ry="3.8" fill="#0CC1E0" />
      <circle cx="6" cy="10" r="2" fill="#0CC1E0" />
      <circle cx="18" cy="10" r="2" fill="#0CC1E0" />
      <circle cx="9.5" cy="6" r="2" fill="#0CC1E0" />
      <circle cx="14.5" cy="6" r="2" fill="#0CC1E0" />
    </svg>
  ),
  when_where: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  ),
  cost_payment: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11" />
    </svg>
  ),
  plans_change: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 17.5 9 3 3 0 0 1 17 15z" />
      <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" />
    </svg>
  ),
};

function AgreeBullets({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {lines.map((line) => (
        <li key={line} className={`relative py-0.5 pl-4 before:absolute before:left-[3px] before:top-2 before:size-1.5 before:rounded-full before:bg-[#0CC1E0] before:content-[''] ${LESSON_BODY}`}>
          {line}
        </li>
      ))}
    </ul>
  );
}

function AgreeStep({
  screen,
  answers,
  onExit,
  onSave,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onSave?: (answer: AgreeJobAnswer) => void;
  onFinish: (answer: AgreeJobAnswer) => void;
}) {
  const saved = agreeJobOf(answers, screen.answerKey);
  const pages = screen.agreePages ?? [];
  const sections = screen.agreeSections ?? [];
  const [page, setPage] = useState(0);
  const [understood, setUnderstood] = useState<AgreeJobAnswer["understood"]>(() => ({ ...AGREE_UNDERSTOOD_EMPTY, ...(saved?.understood ?? {}) }));
  const current = pages[page];
  const pageSections = sections.filter((section) => current?.sectionIds.includes(section.id));
  const ticked = pageSections.length > 0 && pageSections.every((section) => understood[section.id]);
  const last = page === pages.length - 1;
  const answer = (): AgreeJobAnswer => ({ kind: "agree-job", version: 1, understood });
  const goBack = () => {
    if (page === 0) {
      onSave?.(answer());
      onExit();
      return;
    }
    setPage((n) => n - 1);
  };
  const toggleRead = () => {
    const next = !ticked;
    setUnderstood((prev) => {
      const copy = { ...prev };
      for (const id of current?.sectionIds ?? []) copy[id] = next;
      return copy;
    });
  };
  const note = screen.note?.split("{strong}") ?? [];
  return (
    <LessonSurface
      title={screen.title}
      onBack={goBack}
      progress={{ index: page + 1, total: pages.length || 4 }}
      footer={
        <LessonContinue
          disabled={!ticked}
          onClick={() => {
            if (!ticked) return;
            if (last) onFinish(answer());
            else setPage((n) => n + 1);
          }}
        />
      }
    >
      <div data-task-screen="agree-the-job" data-agree-page={page + 1} data-agree-section={current?.sectionIds.join(",")}>
        {current?.question ? <ScreenPrompt tone="question" flush>{current.question}</ScreenPrompt> : null}
        {current?.showNote && screen.note ? (
          <p className={`mt-3 ${LESSON_HINT}`}>
            {note.map((part, index) => (
              <span key={index}>
                {part}
                {index < note.length - 1 ? <span className="font-semibold text-[#19347D]">{screen.noteStrong}</span> : null}
              </span>
            ))}
          </p>
        ) : null}
        {pageSections.map((section) => (
          <article key={section.id} className="mt-6">
            <h2 className="flex items-center gap-2.5 font-heading text-[18px] font-bold leading-6 text-[#0CC1E0]">
              <span className="shrink-0">{AGREE_ICON[section.id]}</span>
              {section.title}
            </h2>
            <p className={`mb-1 mt-2 ${LESSON_BODY}`}>{section.lead}</p>
            <AgreeBullets lines={section.bullets} />
            {section.moreLead ? <ScreenPrompt tone="sub" flush gap>{section.moreLead}</ScreenPrompt> : null}
            {section.moreBullets ? <AgreeBullets lines={section.moreBullets} /> : null}
          </article>
        ))}
        <ReadTick pressed={ticked} label={screen.readLabel ?? "I've read this"} onClick={toggleRead} />
      </div>
    </LessonSurface>
  );
}

function slotSentence(lead: string, control: ReactNode) {
  const [before, after] = lead.split("{pick}");
  return (
    <p className={LESSON_BODY}>
      {before}
      {control}
      {after}
    </p>
  );
}

function DeliverStep({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: DeliverJobAnswer) => void;
}) {
  const saved = deliverJobOf(answers, screen.answerKey);
  const [beforeHow, setBefore] = useState(saved?.beforeHow);
  const [afterHow, setAfter] = useState(saved?.afterHow);
  const ready = !!beforeHow && !!afterHow;
  const valueFor = (slot: "before" | "after") => (slot === "before" ? beforeHow : afterHow);
  const setFor = (slot: "before" | "after", id: string) => (slot === "before" ? setBefore(id) : setAfter(id));
  const optionsFor = (slot: "before" | "after") => (slot === "before" ? screen.beforeOptions : screen.afterOptions) ?? [];
  return (
    <LessonSurface
      title={screen.title}
      onBack={onExit}
      footer={
        <LessonContinue
          disabled={!ready}
          onClick={() => ready && onFinish({ kind: "deliver-job", version: 1, beforeHow: beforeHow!, afterHow: afterHow! })}
        />
      }
    >
      <div data-task-screen="deliver-the-job">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        {(screen.deliverBlocks ?? []).map((block) => (
          <div key={block.slot} className="mt-7">
            <ScreenPrompt tone="section" flush>{block.heading}</ScreenPrompt>
            {slotSentence(
              block.lead,
              <FieldControl
                appearance="underline"
                idPrefix={`${screen.id}-${block.slot}`}
                field={{
                  name: block.slot,
                  label: block.heading,
                  input: "choice",
                  options: optionsFor(block.slot).map((option) => ({ id: option.id, label: option.label })),
                }}
                value={valueFor(block.slot)}
                onChange={(value) => typeof value === "string" && setFor(block.slot, value)}
              />,
            )}
          </div>
        ))}
      </div>
    </LessonSurface>
  );
}

function joinOr(ids: readonly string[], options: readonly { id: string; sentence?: string; label: string }[]): string {
  const phrases = ids.map((id) => options.find((option) => option.id === id)?.sentence ?? options.find((option) => option.id === id)?.label ?? id);
  if (phrases.length <= 1) return phrases[0] ?? "";
  if (phrases.length === 2) return `${phrases[0]} or ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, or ${phrases[phrases.length - 1]}`;
}

function WrapJobStep({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: WrapJobAnswer) => void;
}) {
  const saved = wrapJobOf(answers, screen.answerKey);
  const [paymentHow, setPayment] = useState<string[]>(saved?.paymentHow ? [...saved.paymentHow] : []);
  const [feedbackHow, setFeedback] = useState<string[]>(saved?.feedbackHow ? [...saved.feedbackHow] : []);
  const ready = paymentHow.length > 0 && feedbackHow.length > 0;
  const payment = joinOr(paymentHow, screen.payment?.options ?? []);
  const feedback = joinOr(feedbackHow, screen.feedback?.options ?? []);
  const summary = !payment && !feedback
    ? ""
    : !feedback
      ? (screen.summaryPayment ?? "").replace("{payment}", payment)
      : !payment
        ? (screen.summaryFeedback ?? "").replace("{feedback}", feedback)
        : (screen.summaryBoth ?? "").replace("{payment}", payment).replace("{feedback}", feedback);
  const toggle = (list: readonly string[], id: string, set: (next: string[]) => void) => {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={onExit}
      footer={
        <LessonContinue
          disabled={!ready}
          onClick={() => ready && onFinish({ kind: "wrap-job", version: 1, paymentHow, feedbackHow })}
        />
      }
    >
      <div data-task-screen="wrap-up">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        {screen.payment ? (
          <div className="mt-4">
            <ScreenPrompt tone="section" flush>{screen.payment.heading}</ScreenPrompt>
            {screen.payment.lead ? <p className={`mt-1 ${LESSON_BODY}`}>{screen.payment.lead}</p> : null}
            {screen.payment.options.map((option) => (
              <Chip key={option.id} variant="lined" label={option.label} selected={paymentHow.includes(option.id)} onClick={() => toggle(paymentHow, option.id, setPayment)} />
            ))}
          </div>
        ) : null}
        {screen.feedback ? (
          <div className="mt-4">
            <ScreenPrompt tone="section" flush>{screen.feedback.heading}</ScreenPrompt>
            <p className={`mt-1 ${LESSON_BODY}`}>{screen.feedback.lead}</p>
            {screen.feedback.options.map((option) => (
              <Chip key={option.id} variant="lined" label={option.label} selected={feedbackHow.includes(option.id)} onClick={() => toggle(feedbackHow, option.id, setFeedback)} />
            ))}
          </div>
        ) : null}
        {summary ? (
          <p className={`mt-4 ${LESSON_BODY}`}>
            {summary.split(new RegExp(`(${[payment, feedback].filter(Boolean).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g")).map((part, index) =>
              part === payment || part === feedback ? (
                <span key={index} className={LESSON_PICK}>{part}</span>
              ) : (
                <span key={index}>{part}</span>
              ),
            )}
          </p>
        ) : null}
      </div>
    </LessonSurface>
  );
}

function FlowPick({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value?: string;
  options: readonly { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((row) => row.id === value);
  return (
    <span className="inline">
      <button type="button" aria-expanded={open} aria-label={label} onClick={() => setOpen((next) => !next)} className={LESSON_PICK}>
        {current?.label ?? "choose"}
      </button>
      {open && (
        <span className="mt-1 block w-full max-w-full rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(25,52,125,0.16)]" data-open-menu="">
          {options.map((row) => (
            <button
              key={row.id}
              type="button"
              className="block w-full px-3 py-2 text-left font-sans text-[16px] leading-[22px] text-[#19347D]"
              onClick={() => {
                onPick(row.id);
                setOpen(false);
              }}
            >
              {row.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function PracticeStep({
  screen,
  answers,
  businessName,
  services,
  onExit,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  businessName: string;
  services: readonly { id: string; label: string }[];
  onExit: () => void;
  onFinish: (answer: PracticeRunAnswer) => void;
}) {
  const saved = practiceRunOf(answers, screen.answerKey);
  const [who, setWho] = useState(saved?.who);
  const [service, setService] = useState(saved?.service);
  const [when, setWhen] = useState(saved?.when);
  const ready = !!who && !!service && !!when;
  const stems = [
    { lead: screen.practiceWhoLead, label: "Who you will practice with", value: who, options: screen.practiceWho ?? [], onPick: setWho },
    { lead: screen.practiceServiceLead, label: "Which service", value: service, options: services.map((row) => ({ id: row.id, label: row.label })), onPick: setService },
    { lead: screen.practiceWhenLead, label: "When you will practice", value: when, options: screen.practiceWhen ?? [], onPick: setWhen },
  ];
  return (
    <LessonSurface
      title={screen.title}
      onBack={onExit}
      footer={<LessonContinue disabled={!ready} onClick={() => ready && onFinish({ kind: "practice-run", version: 1, who: who!, service: service!, when: when! })} />}
    >
      <div data-task-screen="practice-run">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        {stems.map((stem) => {
          const [before, after] = stem.lead?.split("{pick}") ?? ["", ""];
          return (
            <p key={stem.label} className={`mt-4 ${LESSON_BODY}`}>
              {before}
              <FlowPick label={stem.label} value={stem.value} options={stem.options} onPick={stem.onPick} />
              {after}
            </p>
          );
        })}
        <span className="sr-only">{businessName}</span>
      </div>
    </LessonSurface>
  );
}

function PolishStep({
  screen,
  answers,
  businessName,
  services,
  onExit,
  onFinish,
}: {
  screen: LaunchpadGettingReadyScreen;
  answers?: LaunchpadAnswers;
  businessName: string;
  services: readonly { id: string; label: string }[];
  onExit: () => void;
  onFinish: (answer: PolishServiceAnswer) => void;
}) {
  const saved = polishServiceOf(answers, screen.answerKey);
  const [rows, setRows] = useState<Record<string, { result?: "good" | "suggestions"; suggestion?: string }>>(saved?.rows ?? {});
  const questions = screen.polishQuestions ?? [];
  const setResult = (id: string, result: "good" | "suggestions") => setRows((prev) => ({ ...prev, [id]: { ...prev[id], result, suggestion: result === "good" ? undefined : prev[id]?.suggestion } }));
  const allReady = questions.every((question) => {
    const row = rows[question.id];
    if (row?.result === "good") return true;
    return row?.result === "suggestions" && !!row.suggestion?.trim();
  });
  const finish = () => {
    if (!allReady) return;
    const next: PolishServiceAnswer["rows"] = {};
    for (const question of questions) {
      const row = rows[question.id]!;
      next[question.id] = row.result === "suggestions" ? { result: "suggestions", suggestion: row.suggestion!.trim() } : { result: "good" };
    }
    onFinish({ kind: "polish-service", version: 1, rows: next });
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={onExit}
      footer={<LessonContinue disabled={!allReady} onClick={finish} />}
    >
      <div data-task-screen="polish-service">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        <ol className="mt-2 list-none p-0">
          {questions.map((question) => (
            <li key={question.id} className="mt-4">
              <p className={LESSON_BODY}>{question.prompt}</p>
              <p className={`mt-1 ${LESSON_BODY}`}>
                <FlowPick label={question.prompt} value={rows[question.id]?.result} options={screen.polishResults ?? []} onPick={(id) => setResult(question.id, id as "good" | "suggestions")} />
              </p>
              {rows[question.id]?.result === "suggestions" && (
                <label className={`mt-2 block ${LESSON_BODY}`}>
                  {screen.polishSuggestion}
                  <textarea
                    aria-label={screen.polishSuggestion}
                    value={rows[question.id]?.suggestion ?? ""}
                    onChange={(event) => setRows((prev) => ({ ...prev, [question.id]: { ...prev[question.id], result: "suggestions", suggestion: event.target.value } }))}
                    className="mt-1 w-full border-b border-[#D5DAE3] bg-transparent py-1 font-sans text-[16px] text-[#19347D] outline-none"
                  />
                </label>
              )}
            </li>
          ))}
        </ol>
        <span className="sr-only">{businessName}{services.length}</span>
      </div>
    </LessonSurface>
  );
}
