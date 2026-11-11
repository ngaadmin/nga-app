"use client";

import { useState } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { orderSystemOf, type OrderSystemAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadSalesScreen, OrderSystemCopy } from "@/lib/launchpad/content/types";
import { BronzeFirstLead, LESSON_BODY, LessonContinue, LessonSurface, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";

function Chevron({ stroke }: { stroke: string }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="mt-2.5 shrink-0">
      <path d="M1 1l4 4 4-4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StackedSelect({
  lead,
  value,
  emptyLabel,
  options,
  onChange,
}: {
  lead: string;
  value: string;
  emptyLabel: string;
  options: readonly { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const picked = options.find((option) => option.id === value);
  const filled = Boolean(picked);
  return (
    <div className="mt-[21px]">
      <p className={`mb-1 ${LESSON_BODY}`}>{lead}</p>
      <div className="relative">
        <div className={`flex w-full min-h-8 items-start justify-between gap-2 border-b-[1.5px] py-1 text-left ${filled ? "border-[#0CC1E0]" : "border-[#8A94A8]"}`}>
          <span className={`min-w-0 flex-1 text-left font-sans text-[18px] font-semibold leading-[26px] ${filled ? "text-[#0CC1E0]" : "text-[#8A94A8]"}`}>
            {picked?.label || emptyLabel}
          </span>
          <Chevron stroke={filled ? "#0CC1E0" : "#8A94A8"} />
        </div>
        <select
          aria-label={lead}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">{emptyLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function OrderSystemFlow({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: OrderSystemAnswer) => void;
}) {
  const copy = screen.order;
  if (!copy) return null;
  return <OrderSystemScreens screen={screen} copy={copy} answers={answers} onExit={onExit} onFinish={onFinish} />;
}

function OrderSystemScreens({
  screen,
  copy,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  copy: OrderSystemCopy;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: OrderSystemAnswer) => void;
}) {
  const saved = orderSystemOf(answers, screen.answerKey);
  const [page, setPage] = useState(0);
  const [tracker, setTracker] = useState(saved?.tracker ?? "");
  const [extra, setExtra] = useState(saved?.trackerExtra ?? "");
  const [reminder, setReminder] = useState(saved?.reminder ?? copy.reminderDefault);
  const trackerOk = copy.trackerOptions.some((option) => option.id === tracker);
  const reminderOk = copy.reminderOptions.some((option) => option.id === reminder);
  const ready = page === 0 ? trackerOk : reminderOk;
  const finish = () => {
    if (!ready) return;
    if (page === 0) {
      setPage(1);
      return;
    }
    const typed = extra.trim().slice(0, copy.extraMax);
    onFinish({
      kind: "order-system",
      version: 1,
      tracker,
      reminder,
      ...(typed ? { trackerExtra: typed } : {}),
    });
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(0))}
      progress={{ index: page + 1, total: 2 }}
      footer={<LessonContinue disabled={!ready} onClick={finish} />}
      decoration={
        <img
          src={page === 0 ? SCRIBBLE_SRC.calendar : SCRIBBLE_SRC.star}
          alt=""
          width={page === 0 ? 80 : 64}
          height={page === 0 ? 80 : 64}
          draggable={false}
          data-scribble-large={page === 0 ? "calendar" : "star"}
          className={`pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto mix-blend-multiply ${page === 0 ? "w-20" : "w-16"}`}
        />
      }
    >
      <div data-task-screen="order-system" data-order-page={page + 1}>
        {page === 0 ? (
          <>
            <BronzeFirstLead flush question={copy.question} context={copy.context} guidance={copy.guidance} />
            <StackedSelect lead={copy.trackerLead} value={tracker} emptyLabel={copy.emptyLabel} options={copy.trackerOptions} onChange={setTracker} />
            <label className={`mt-4 block ${LESSON_BODY}`}>
              {copy.extraLabel}
              <input
                aria-label={copy.extraLabel}
                maxLength={copy.extraMax}
                value={extra}
                onChange={(event) => setExtra(event.target.value.slice(0, copy.extraMax))}
                className="mt-1 w-full border-b border-dashed border-[#F4D5A7] bg-transparent py-1 font-sans text-[18px] leading-[26px] text-[#19347D] outline-none"
              />
            </label>
          </>
        ) : (
          <>
            <ScreenPrompt tone="question" flush>{copy.playbackTitle}</ScreenPrompt>
            <p className={`mt-[21px] ${LESSON_BODY}`}>
              {copy.templateBefore}
              <span className="font-semibold">{copy.templateStrong}</span>
              {copy.templateAfter}
            </p>
            <p className={`mt-4 ${LESSON_BODY}`}>{copy.repeatLine}</p>
            <StackedSelect lead={copy.reminderLead} value={reminder} emptyLabel={copy.emptyLabel} options={copy.reminderOptions} onChange={setReminder} />
            <p className={`mt-[22px] ${LESSON_BODY}`}>{copy.checkLine}</p>
          </>
        )}
      </div>
    </LessonSurface>
  );
}
