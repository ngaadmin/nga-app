"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import type { LaunchpadGettingReadyScreen } from "@/lib/launchpad/content/types";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import {
  AFTER_HOW,
  AGREE_ITEMS,
  AGREE_PROMPT,
  AGREE_UNDERSTOOD_EMPTY,
  BEFORE_HOW,
  CHANNELS,
  DELIVER_HINT,
  FEEDBACK_HOW,
  FIND_CONFIRM,
  FIND_HINT,
  PAYMENT_HOW,
  POLISH_LEAD,
  POLISH_QUESTIONS,
  POLISH_RESULTS,
  PRACTICE_TIP,
  PRACTICE_WHEN,
  PRACTICE_WHO,
  SUGGESTION_PROMPT,
  WRAP_JOB_HINT,
  WRAP_JOB_PLAYBACK,
  agreeTitles,
  feedbackWrap,
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
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { ART, ContinueButton, Sticker, WorkbookFrame } from "@/components/launchpad/venture/handbook/workbook-frame";
import { FlatSticker } from "@/components/launchpad/venture/handbook/flat-stickers";

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

/** Deliver and Wrap-up title: Fredoka 600 at 22px, with room under the eyebrow. */
function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className={`${FREDOKA_CLASS} mt-[21px] text-[22px] font-semibold leading-tight text-[#3FB7DA] underline decoration-[#7ED4EA] decoration-[3px] underline-offset-[5px]`}>
      {children}
    </h2>
  );
}

function SheetQuestion({ children }: { children: ReactNode }) {
  return <h3 className="mt-[9px] font-heading text-[18px] font-bold leading-tight text-[#19347D]">{children}</h3>;
}

function SheetSubhead({ children }: { children: ReactNode }) {
  return <p className={`${FREDOKA_CLASS} text-[15px] font-semibold text-[#0CC1E0]`}>{children}</p>;
}

/** White lesson chrome for a Getting Ready bronze. The spiral workbook is the record, not this task. */
function LessonSurface({ title, onBack, footer, children }: { title: string; onBack: () => void; footer: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white text-[#111827]" data-lesson-surface="">
      <header className="flex items-center gap-2 px-3 pt-4">
        <button type="button" aria-label="Back" onClick={onBack} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-heading text-[19px] font-bold text-[#19347D]">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">{children}</div>
      <div className="px-6 pb-6">{footer}</div>
    </section>
  );
}

function LessonContinue({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="h-12 w-full rounded-[14px] bg-[#19347D] text-[17px] font-semibold text-white disabled:opacity-40">
      Continue
    </button>
  );
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
  const [confirming, setConfirming] = useState(false);
  const ready = findReady(channels, extra);
  const toggle = (id: string) => setChannels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <LessonSurface
      title="Attract the customer"
      onBack={confirming ? () => setConfirming(false) : onExit}
      footer={
        confirming ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="h-12 flex-1 rounded-[14px] border-2 border-[#19347D] text-[17px] font-semibold text-[#19347D]">
              Change
            </button>
            <button
              type="button"
              onClick={() =>
                onFinish({
                  kind: "find-customers",
                  version: 1,
                  channels,
                  ...(extra.trim() ? { channelsExtra: extra.trim() } : {}),
                })
              }
              className="h-12 flex-1 rounded-[14px] bg-[#19347D] text-[17px] font-semibold text-white"
            >
              That&apos;s mine
            </button>
          </div>
        ) : (
          <LessonContinue disabled={!ready} onClick={() => setConfirming(true)} />
        )
      }
    >
      {confirming ? (
        <>
          <Eyebrow>Learn the customer journey</Eyebrow>
          <Aqua>How I&apos;ll find customers</Aqua>
          <p className="mt-3 text-[15px] leading-snug text-[#19347D]">{FIND_CONFIRM}</p>
          <ul className="mt-3">
            {channels.map((id) => (
              <li key={id}>
                <Rule />
                <span className="flex items-center gap-2 py-1 text-[15px] text-[#19347D]">
                  <span className="flex size-6 items-center justify-center rounded-[5px] bg-[#FFA503]"><Check /></span>
                  <ChosenValue>{CHANNELS.find((row) => row.id === id)?.label}</ChosenValue>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <Eyebrow>Learn the customer journey</Eyebrow>
          <Aqua>Attract the customer</Aqua>
          <h3 className="mt-3 font-heading text-[20px] font-semibold leading-tight text-[#19347D]">How will you find your customers?</h3>
          <p className="mt-2 text-[14px] leading-snug text-[#4B5563]">{FIND_HINT}</p>
          <ul className="mt-1">
            {CHANNELS.map((row) => (
              <li key={row.id} className="border-b border-dashed border-[#E4D3B4] py-0.5">
                <span className="flex items-start gap-2">
                  <Tick on={channels.includes(row.id)} label={row.label} onClick={() => toggle(row.id)} />
                  <span className="text-[14px] font-semibold leading-tight text-[#19347D]">{row.label}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-end justify-between gap-2">
            <label className="min-w-0 flex-1 text-[14px] text-[#6B7280]">
              Also: Add your own (optional)
              <input
                aria-label="Add your own channel"
                maxLength={60}
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                className="mt-1 w-full border-b border-dashed border-[#E4D3B4] bg-transparent py-1 text-[15px] text-[#19347D] outline-none"
              />
            </label>
          </div>
        </>
      )}
    </LessonSurface>
  );
}

const AGREE_ICON: Record<(typeof AGREE_ITEMS)[number]["id"], ReactNode> = {
  collect_info: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="5" width="16" height="20" rx="2" />
      <path d="M10 5V3h8v2" />
      <circle cx="14" cy="12" r="2.5" />
      <path d="M9.5 20c.8-2.6 2.5-3.8 4.5-3.8s3.7 1.2 4.5 3.8" />
    </svg>
  ),
  confirm_dog: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="14" cy="19" rx="5" ry="4" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="11" cy="7.5" r="2" />
      <circle cx="17" cy="7.5" r="2" />
      <circle cx="21" cy="12" r="2" />
    </svg>
  ),
  when_where: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 25s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
      <circle cx="14" cy="13" r="2.5" />
    </svg>
  ),
  cost_payment: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="14" cy="14" r="10" />
      <path d="M17 10.5c-.7-1-1.8-1.5-3-1.5-1.7 0-3 .9-3 2.3 0 3.2 6 1.8 6 4.8 0 1.4-1.3 2.4-3 2.4-1.3 0-2.5-.6-3.2-1.6M14 7v2M14 19v2" />
    </svg>
  ),
  plans_change: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#0CC1E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 9a10 10 0 0 0-17.5 1M5 19a10 10 0 0 0 17.5-1" />
      <path d="M23 4v5h-5M5 24v-5h5" />
    </svg>
  ),
};

function AgreeNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" stroke="#19347D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
      <rect x="6" y="5" width="16" height="20" rx="2" />
      <path d="M10 5V3h8v2" />
      <circle cx="14" cy="12" r="2.5" />
      <path d="M9.5 20c.8-2.6 2.5-3.8 4.5-3.8s3.7 1.2 4.5 3.8" />
    </svg>
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
  const [page, setPage] = useState(0);
  const [understood, setUnderstood] = useState<AgreeJobAnswer["understood"]>(() => ({ ...AGREE_UNDERSTOOD_EMPTY, ...(saved?.understood ?? {}) }));
  const section = AGREE_ITEMS[page]!;
  const last = page === AGREE_ITEMS.length - 1;
  const answer = (): AgreeJobAnswer => ({ kind: "agree-job", version: 1, understood });
  const goBack = () => {
    if (page === 0) {
      onSave?.(answer());
      onExit();
      return;
    }
    setPage((n) => n - 1);
  };
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white text-[#19347D]" data-task-screen="agree-the-job" data-agree-section={section.id} data-agree-page={page + 1}>
      <header className="flex items-center gap-2 px-4 pt-4">
        <button type="button" aria-label="Back" onClick={goBack} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-heading text-[19px] font-bold">Agree the job</h1>
      </header>
      <div className="flex items-center gap-2 px-6 pt-4" data-agree-progress="">
        {AGREE_ITEMS.map((item, index) => (
          <span key={item.id} aria-hidden="true" className={`size-[11px] rounded-full border-2 border-[#19347D] ${index <= page ? "bg-[#19347D]" : "bg-white"}`} />
        ))}
        <p className="ml-auto text-[15px] text-[#6B7A9E]">Section {page + 1} of 5</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
        <h2 className="font-heading text-[21px] font-bold leading-tight">{AGREE_PROMPT}</h2>
        <div className="mt-4 flex gap-2 rounded-[10px] bg-[#F5F7FB] px-3 py-2.5 text-[15px] leading-snug text-[#4A5A82]">
          <AgreeNoteIcon />
          <p>
            When a booking comes in, write these on the <b>Taking a customer order</b> template in your workbook.
          </p>
        </div>
        <article className="mt-6 rounded-2xl border-[1.5px] border-[#0CC1E0] bg-[#F2FBFD] px-3.5 py-4">
          <div className="flex items-center gap-3">
            <span className="shrink-0">{AGREE_ICON[section.id]}</span>
            <h3 className="min-w-0 flex-1 font-heading text-[17px] font-semibold leading-snug">{section.title}</h3>
            <button
              type="button"
              aria-pressed={understood[section.id]}
              aria-label={`I understand ${section.title}`}
              onClick={() => setUnderstood((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
              className={`flex size-[30px] shrink-0 items-center justify-center rounded-[7px] border-2 border-[#FFA503] ${understood[section.id] ? "bg-[#FFA503]" : "bg-white"}`}
            >
              {understood[section.id] ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 7.5l2.6 2.6L11 4.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          </div>
          <div className="pl-10 pr-1">
            <p className="mb-1 mt-2 text-[15px] leading-snug">{section.lead}</p>
            <ul className="m-0 list-none p-0">
              {section.bullets.map((line) => (
                <li key={line} className="relative py-0.5 pl-4 text-[15px] leading-snug before:absolute before:left-[3px] before:top-2 before:size-1.5 before:rounded-full before:bg-[#0CC1E0] before:content-['']">
                  {line}
                </li>
              ))}
            </ul>
            {section.moreLead && (
              <>
                <p className="mb-1 mt-3 text-[15px] leading-snug">{section.moreLead}</p>
                <ul className="m-0 list-none p-0">
                  {section.moreBullets?.map((line) => (
                    <li key={line} className="relative py-0.5 pl-4 text-[15px] leading-snug before:absolute before:left-[3px] before:top-2 before:size-1.5 before:rounded-full before:bg-[#0CC1E0] before:content-['']">
                      {line}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </article>
      </div>
      <div className="px-6 pb-6 pt-3">
        <button
          type="button"
          onClick={() => (last ? onFinish(answer()) : setPage((n) => n + 1))}
          className="h-12 w-full rounded-[14px] bg-[#19347D] text-[17px] font-semibold text-white"
        >
          Continue
        </button>
      </div>
    </section>
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
  return (
    <LessonSurface title="Deliver the job" onBack={onExit} footer={<LessonContinue disabled={!ready} onClick={() => ready && onFinish({ kind: "deliver-job", version: 1, beforeHow: beforeHow!, afterHow: afterHow! })} />}>
      <Eyebrow>Learn the customer journey</Eyebrow>
      <SheetTitle>Deliver the job</SheetTitle>
      <SheetQuestion>How will you deliver a good job?</SheetQuestion>
      <p className="mt-2 text-[14px] leading-snug text-[#4B5563]">{DELIVER_HINT}</p>
      <div className="mt-[30px]">
        <SheetSubhead>One day before the job</SheetSubhead>
        <p className="mt-1 text-[16px] leading-snug text-[#19347D]">
          I will contact the owner to confirm the agreed details of the job by <InlineMenu label="How you will confirm" value={beforeHow} options={BEFORE_HOW} onPick={setBefore} />.
        </p>
      </div>
      <div className="mt-[30px]">
        <SheetSubhead>Straight after I&apos;ve delivered the service</SheetSubhead>
        <p className="mt-1 text-[16px] leading-snug text-[#19347D]">
          I will show proof by sending <InlineMenu label="How you will show proof" value={afterHow} options={AFTER_HOW} onPick={setAfter} />.
        </p>
      </div>
    </LessonSurface>
  );
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
  const [paymentHow, setPayment] = useState(saved?.paymentHow);
  const [feedbackHow, setFeedback] = useState(saved?.feedbackHow);
  const ready = !!paymentHow && !!feedbackHow;
  return (
    <LessonSurface title="Wrap-up" onBack={onExit} footer={<LessonContinue disabled={!ready} onClick={() => ready && onFinish({ kind: "wrap-job", version: 1, paymentHow: paymentHow!, feedbackHow: feedbackHow! })} />}>
      <Eyebrow>Learn the customer journey</Eyebrow>
      <SheetTitle>Wrap-up</SheetTitle>
      <SheetQuestion>How will you wrap up a job?</SheetQuestion>
      <p className="mt-2 text-[14px] leading-snug text-[#4B5563]">{WRAP_JOB_HINT}</p>
      <div className="mt-[30px]">
        <SheetSubhead>Taking payment</SheetSubhead>
        <p className="mt-1 text-[16px] leading-snug text-[#19347D]">
          I will collect payment by <InlineMenu label="How you will collect payment" value={paymentHow} options={PAYMENT_HOW} onPick={setPayment} />.
        </p>
      </div>
      <div className="mt-[30px]">
        <SheetSubhead>Getting feedback</SheetSubhead>
        <p className="mt-1 text-[16px] leading-snug text-[#19347D]">
          I will ask the owner for feedback or a short review by <InlineMenu label="How you will ask for feedback" value={feedbackHow} options={FEEDBACK_HOW} onPick={setFeedback} />.
        </p>
      </div>
      {ready && <p className="mt-[18px] text-[15px] font-semibold text-[#3FB7DA]">{WRAP_JOB_PLAYBACK}</p>}
    </LessonSurface>
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
  const label = services.find((row) => row.id === service)?.label ?? "Dog walking";
  return (
    <WorkbookFrame businessName={businessName} level={3} canBack canForward={false} onBack={onExit} onForward={() => {}} footer={<ContinueButton disabled={!ready} onClick={() => ready && onFinish({ kind: "practice-run", version: 1, who: who!, service: service!, when: when! })} />}>
      <Eyebrow>Test &amp; Tweak</Eyebrow>
      <Aqua>Do the practice run</Aqua>
      <h3 className="mt-3 font-heading text-[20px] font-semibold leading-tight text-[#19347D]">How will you practice before your first paid job?</h3>
      <p className="mt-3 text-[16px] leading-snug text-[#19347D]">
        I will do a practice run for <InlineMenu label="Who you will practice with" value={who} options={PRACTICE_WHO} onPick={setWho} />.
      </p>
      <p className="mt-3 text-[16px] leading-snug text-[#19347D]">
        I will do the following service for them <InlineMenu label="Which service" value={service} options={services.map((row) => ({ id: row.id, label: row.label }))} onPick={setService} />.
      </p>
      <p className="mt-3 text-[16px] leading-snug text-[#19347D]">
        I will do it <InlineMenu label="When you will practice" value={when} options={PRACTICE_WHEN} onPick={setWhen} />.
      </p>
      <p className="mt-3 text-[13px] leading-snug text-[#6B7280]">{PRACTICE_TIP}</p>
      {ready && (
        <div className="mt-3">
          <p className="font-heading text-[15px] font-semibold text-[#3FB7DA]">Your practice run</p>
          {practiceLines(who!, label, when!).map((line) => (
            <p key={line} className="mt-1 text-[14px] text-[#19347D]">{line}</p>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-end justify-between">
        <Sticker src={ART.ticket} alt="" />
        <FlatSticker kind="ball_leash" />
        <img src={ART.pennyJourney} alt="" width={46} height={46} className="h-[46px] w-auto" />
      </div>
    </WorkbookFrame>
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
  const [page, setPage] = useState(0);
  const groups = [POLISH_QUESTIONS.slice(0, 3), POLISH_QUESTIONS.slice(3)];
  const setResult = (id: string, result: "good" | "suggestions") => setRows((prev) => ({ ...prev, [id]: { ...prev[id], result, suggestion: result === "good" ? undefined : prev[id]?.suggestion } }));
  const pageReady = groups[page]!.every((q) => rows[q.id]?.result);
  const allReady = POLISH_QUESTIONS.every((q) => rows[q.id]?.result);
  const finish = () => {
    if (!allReady) return;
    const next: PolishServiceAnswer["rows"] = {};
    for (const q of POLISH_QUESTIONS) {
      const row = rows[q.id]!;
      next[q.id] = row.result === "suggestions" ? { result: "suggestions", ...(row.suggestion?.trim() ? { suggestion: row.suggestion.trim() } : {}) } : { result: "good" };
    }
    onFinish({ kind: "polish-service", version: 1, rows: next });
  };
  return (
    <WorkbookFrame
      businessName={businessName}
      level={3}
      marker={`${page + 1} of 2`}
      canBack
      canForward={page === 0 && pageReady}
      onBack={page === 0 ? onExit : () => setPage(0)}
      onForward={() => pageReady && setPage(1)}
      footer={<ContinueButton disabled={!pageReady} onClick={page === 0 ? () => setPage(1) : finish} />}
    >
      <Eyebrow>Test &amp; Tweak</Eyebrow>
      <Aqua>Polish your service</Aqua>
      <h3 className="mt-3 font-heading text-[20px] font-semibold leading-tight text-[#19347D]">What feedback did your trial customer give you?</h3>
      <p className="mt-2 text-[14px] leading-snug text-[#4B5563]">{POLISH_LEAD}</p>
      <ol className="mt-2">
        {groups[page]!.map((q, i) => (
          <li key={q.id} className="mt-3">
            <p className="text-[15px] font-semibold text-[#19347D]">{page === 0 ? i + 1 : i + 4}. {q.prompt}</p>
            <p className="mt-1 text-[15px] text-[#19347D]">
              <InlineMenu label={q.prompt} value={rows[q.id]?.result} options={POLISH_RESULTS} onPick={(id) => setResult(q.id, id as "good" | "suggestions")} />
            </p>
            {rows[q.id]?.result === "suggestions" && (
              <label className="mt-2 block text-[13px] text-[#6B7280]">
                {SUGGESTION_PROMPT}
                <textarea
                  aria-label={SUGGESTION_PROMPT}
                  value={rows[q.id]?.suggestion ?? ""}
                  onChange={(event) => setRows((prev) => ({ ...prev, [q.id]: { ...prev[q.id], result: "suggestions", suggestion: event.target.value } }))}
                  className="mt-1 w-full border-b border-dashed border-[#E4D3B4] bg-transparent py-1 text-[15px] text-[#19347D] outline-none"
                />
              </label>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex justify-end">{page === 0 ? <FlatSticker kind="notepad_pencil" /> : <FlatSticker kind="bulb" />}</div>
      <span className="sr-only">{services.length}</span>
    </WorkbookFrame>
  );
}

/** Three workbook pages for the empty row 34, built from the six saved sections. */
export function ReadyWrap({
  page,
  answers,
  serviceLabel,
}: {
  page: "a" | "b" | "c";
  answers: LaunchpadAnswers | undefined;
  serviceLabel: string;
}) {
  const find = findCustomersOf(answers, "find_customers");
  const agree = agreeJobOf(answers, "agree_the_job");
  const deliver = deliverJobOf(answers, "deliver_the_job");
  const wrap = wrapJobOf(answers, "wrap_up");
  const practice = practiceRunOf(answers, "practice_run");
  const polish = polishServiceOf(answers, "polish_service");
  if (page === "a") {
    const titles = agreeTitles(AGREE_ITEMS.filter((item) => agree?.understood[item.id]).map((item) => item.id));
    return (
      <div data-ready-wrap="a">
        <Aqua>Getting Ready</Aqua>
        <h3 className="mt-4 font-heading text-[16px] font-semibold text-[#3FB7DA]">How I&apos;ll find customers</h3>
        {find && find.channels.length > 0 ? (
          <ul className="mt-2 list-none p-0 text-[15px] leading-snug text-[#19347D]">
            {find.channels.map((id) => (
              <li key={id} className="relative py-1 pl-4 before:absolute before:left-0 before:top-[11px] before:size-1.5 before:rounded-full before:bg-[#3FB7DA] before:content-['']">
                <ChosenValue>{CHANNELS.find((row) => row.id === id)?.label}</ChosenValue>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[15px] leading-snug text-[#19347D]">Not answered yet</p>
        )}
        {find?.channelsExtra?.trim() ? (
          <p className="mt-2 text-[15px] leading-snug text-[#19347D]">
            Also: <ChosenValue>{find.channelsExtra.trim()}</ChosenValue>
          </p>
        ) : null}
        <h3 className="mt-4 font-heading text-[16px] font-semibold text-[#3FB7DA]">What I&apos;ll agree before a job</h3>
        <ul className="mt-1 list-disc pl-5 text-[15px] leading-snug text-[#19347D]">
          {titles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
        <div className="mt-4 flex items-end justify-end gap-2">
          <FlatSticker kind="paw" doodle />
          <Sticker src={ART.kit} alt="" />
        </div>
      </div>
    );
  }
  if (page === "b") {
    const before = deliver ? BEFORE_HOW.find((row) => row.id === deliver.beforeHow)?.sentence : undefined;
    const after = deliver ? AFTER_HOW.find((row) => row.id === deliver.afterHow)?.sentence : undefined;
    const payment = wrap ? PAYMENT_HOW.find((row) => row.id === wrap.paymentHow)?.sentence : undefined;
    const feedback = wrap ? FEEDBACK_HOW.find((row) => row.id === wrap.feedbackHow)?.sentence : undefined;
    return (
      <div data-ready-wrap="b">
        <div className="mt-3">
          <h3 className="font-heading text-[16px] font-semibold text-[#3FB7DA]">How I&apos;ll deliver the job</h3>
          {before && (
            <>
              <p className="mt-3 font-heading text-[15px] font-semibold text-[#3FB7DA]">One day before the job</p>
              <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
                I will contact the owner to confirm the agreed details of the job by <ChosenValue>{BEFORE_HOW.find((row) => row.id === deliver?.beforeHow)?.label ?? before}</ChosenValue>.
              </p>
            </>
          )}
          {after && (
            <>
              <p className="mt-3 font-heading text-[15px] font-semibold text-[#3FB7DA]">Straight after I&apos;ve delivered the service</p>
              <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
                I will show proof by sending <ChosenValue>{AFTER_HOW.find((row) => row.id === deliver?.afterHow)?.label ?? after}</ChosenValue>.
              </p>
            </>
          )}
        </div>
        <div className="mt-4">
          <h3 className="font-heading text-[16px] font-semibold text-[#3FB7DA]">How I&apos;ll wrap up a job</h3>
          {payment && (
            <>
              <p className="mt-3 font-heading text-[15px] font-semibold text-[#3FB7DA]">Taking payment</p>
              <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
                I will collect payment by <ChosenValue>{PAYMENT_HOW.find((row) => row.id === wrap?.paymentHow)?.label ?? payment}</ChosenValue>.
              </p>
            </>
          )}
          {feedback && (
            <>
              <p className="mt-3 font-heading text-[15px] font-semibold text-[#3FB7DA]">Getting feedback</p>
              <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
                I will ask the owner for feedback or a short review by <ChosenValue>{FEEDBACK_HOW.find((row) => row.id === wrap?.feedbackHow)?.label ?? feedback}</ChosenValue>.
              </p>
            </>
          )}
        </div>
        <div className="mt-6 flex items-end justify-between px-4">
          <FlatSticker kind="star" doodle />
          <FlatSticker kind="sparkle" doodle />
          <FlatSticker kind="heart" doodle />
        </div>
      </div>
    );
  }
  const whoLabel = practice ? (PRACTICE_WHO.find((row) => row.id === practice.who)?.label ?? practice.who) : "";
  const whenLabel = practice ? (PRACTICE_WHEN.find((row) => row.id === practice.when)?.label ?? practice.when) : "";
  const serviceWord = serviceLabel.trim().charAt(0).toLowerCase() + serviceLabel.trim().slice(1);
  const feedback = polish
    ? feedbackWrap(
        POLISH_QUESTIONS.map((q): PolishRow => ({
          id: q.id,
          result: polish.rows[q.id]?.result ?? "good",
          suggestion: polish.rows[q.id]?.suggestion,
        })),
      )
    : null;
  return (
    <div data-ready-wrap="c">
      <h3 className="font-heading text-[16px] font-semibold text-[#3FB7DA]">Your practice run</h3>
      {practice && (
        <>
          <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
            I will do a practice run for <ChosenValue>{whoLabel}</ChosenValue>.
          </p>
          <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
            I will do <ChosenValue>{serviceWord}</ChosenValue> for them.
          </p>
          <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
            I will do it <ChosenValue>{whenLabel}</ChosenValue>.
          </p>
        </>
      )}
      <h3 className="mt-4 font-heading text-[16px] font-semibold text-[#3FB7DA]">Feedback from my trial run</h3>
      {feedback?.notes.map((note) => (
        <p key={note.question} className="mt-1 text-[15px] leading-snug text-[#19347D]">
          {note.question} <ChosenValue>{note.note}</ChosenValue>
        </p>
      ))}
      {feedback && <p className="mt-2 text-[15px] leading-snug text-[#19347D]">{feedback.other}</p>}
      <div className="mt-4 flex items-end justify-between gap-2">
        <FlatSticker kind="rosette" />
        <FlatSticker kind="bone" doodle />
        <FlatSticker kind="star" doodle />
        <img src={ART.pennyMaster} alt="" width={46} height={46} className="h-[46px] w-auto" />
      </div>
    </div>
  );
}
