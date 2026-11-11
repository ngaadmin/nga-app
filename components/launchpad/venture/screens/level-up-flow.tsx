"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, offerOf, selectionOf, type GrowPlan, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import {
  addMonths,
  checkInClipboard,
  expandJobsFor,
  fillToken,
  formatCheckInDate,
  joinList,
  soonestGrowCheckIn,
  paceFor,
  pickedStatements,
  sectionLabel,
  statementsIn,
  type LevelCohort,
  type LevelSectionId,
  type LevelUpIdea,
  type LevelUpOption,
} from "@/lib/launchpad/content/level-up/model";
import { LargeScribble, SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { OrderedSlots } from "@/components/launchpad/venture/screens/rank-order-screen";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

function blankAnswer(): LevelUpAnswer {
  return { kind: "level-up", version: 1, selected: [], picks: {}, pace: {}, improvePlan: [], ideas: [], growPlans: [] };
}

function planFor(ids: readonly string[]): { statementId: string; week: number }[] {
  return ids.map((statementId, index) => ({ statementId, week: index + 1 }));
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function orderedIdeas(ideas: readonly LevelUpIdea[], ids: readonly string[]): LevelUpIdea[] {
  const chosen = new Set(ids);
  return ideas.filter((idea) => chosen.has(idea.id)).slice(0, 3);
}

function blankPlan(idea: string): GrowPlan {
  return { idea, options: [], when: "", successCount: 0, checkIn: "", checkInDate: "" };
}

function planForIdea(plans: readonly GrowPlan[], idea: string): GrowPlan {
  return plans.find((row) => row.idea === idea) ?? blankPlan(idea);
}

function writePlan(plans: readonly GrowPlan[], next: GrowPlan): GrowPlan[] {
  const rest = plans.filter((row) => row.idea !== next.idea);
  return [...rest, next];
}

function Lined({ item, selected, muted, onClick }: { item: { id: string; label: string }; selected: boolean; muted?: boolean; onClick: () => void }) {
  return <Chip variant="lined" label={item.label} selected={selected} muted={muted} onClick={onClick} />;
}

function PickChevron({ stroke = "#0CC1E0" }: { stroke?: string }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="ml-1 inline-block align-middle">
      <path d="M1 1l4 4 4-4" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATEMENT_SLOT = /\{(offer|start|count|checkIn)\}/g;

function statementParts(template: string): { text: string; slot?: "offer" | "start" | "count" | "checkIn" }[] {
  const parts: { text: string; slot?: "offer" | "start" | "count" | "checkIn" }[] = [];
  let last = 0;
  for (const match of template.matchAll(STATEMENT_SLOT)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: template.slice(last, index) });
    const slot = match[1];
    if (slot === "offer" || slot === "start" || slot === "count" || slot === "checkIn") parts.push({ text: "", slot });
    last = index + match[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last) });
  return parts;
}

function offerWords(option: LevelUpOption): string {
  return option.sentence?.trim() ? option.sentence : option.label;
}

/** Clipboard first. A missing API or a rejection falls back to a hidden textarea. */
async function copyPlainText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission or a missing secure context. The textarea path is next.
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.tabIndex = -1;
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  let ok = false;
  try {
    ok = typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function visibleOptions(idea: LevelUpIdea, cohort: LevelCohort): LevelUpOption[] {
  if (idea.id !== "expand") return [...idea.options];
  const allowed = new Set(expandJobsFor(idea.options, cohort).map((row) => row.id));
  return idea.options.filter((option) => allowed.has(option.id));
}

function blockedOptions(idea: LevelUpIdea, offered: ReadonlySet<string>): Set<string> {
  return idea.id === "new-service" ? new Set(offered) : new Set();
}

function SectionBlock({ label, id, children }: { label: string; id: LevelSectionId; children: ReactNode }) {
  return (
    <div className="mt-[21px]" data-level-section={id}>
      <ScreenPrompt tone="section" flush className="!mt-0">{label}</ScreenPrompt>
      {children}
    </div>
  );
}

export function LevelUpFlow({
  screen,
  answers,
  cohort = "pathfinder",
  today = new Date(),
  onExit,
  onSave,
  onFinish,
}: {
  screen: LaunchpadLevelUpScreen;
  answers?: LaunchpadAnswers;
  cohort?: LevelCohort;
  today?: Date;
  onExit: () => void;
  onSave: (answer: LevelUpAnswer) => void;
  onFinish: (answer: LevelUpAnswer) => void;
}) {
  const content = screen.content;
  const sections = content.sections;
  const saved = levelUpOf(answers, screen.answerKey) ?? blankAnswer();
  const wins = new Set(levelUpOf(answers, "l7-reflect")?.selected ?? []);
  const offered = new Set([
    ...(selectionOf(answers, "l1-offer")?.selected ?? []),
    ...(offerOf(answers, "l2-offer")?.offerings.map((row) => row.serviceId) ?? []),
  ]);
  const [page, setPage] = useState(0);
  const [copyNote, setCopyNote] = useState<{ kind: "idle" | "copied" | "failed"; at: number }>({ kind: "idle", at: 0 });
  const [openSlot, setOpenSlot] = useState<"offer" | "start" | "checkIn" | null>(null);
  useEffect(() => {
    if (copyNote.kind !== "copied") return;
    const at = copyNote.at;
    const timer = window.setTimeout(() => {
      setCopyNote((current) => (current.at === at ? { kind: "idle", at } : current));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [copyNote]);
  const [slotPage, setSlotPage] = useState(0);
  const [draft, setDraft] = useState<LevelUpAnswer>(saved);
  if (slotPage !== page) {
    setSlotPage(page);
    setOpenSlot(null);
  }
  const writtenDates = useRef(new Map(saved.growPlans.filter((row) => row.checkIn && row.checkInDate).map((row) => [row.idea, { checkIn: row.checkIn, checkInDate: row.checkInDate }])));
  const pickPages = sections.length;
  const weekLabels = content.improve.weekLabels ?? [];
  const planAvailable = Boolean(content.improve.planHeader && weekLabels.length > 0);
  const growIdeas = orderedIdeas(content.grow.ideas ?? [], draft.ideas);
  const statementMode = Boolean(
    content.grow.joinWord &&
      content.grow.dateLine?.includes("{date}") &&
      content.grow.startOptions?.length &&
      content.grow.checkInOptions?.length &&
      growIdeas.every((idea) => idea.statement),
  );
  const growDetail = statementMode || Boolean(content.grow.startOptions?.length && content.grow.checkInOptions?.length && growIdeas.every((idea) => idea.successLine));
  const growTotal = 1 + (growDetail ? growIdeas.length : 0) + 1;
  const total = screen.step === "improve" ? pickPages + (planAvailable ? 1 : 0) : screen.step === "reflect" ? pickPages : growTotal;
  const soonest = soonestGrowCheckIn(draft.growPlans, content.grow.startOptions, content.grow.checkInOptions, today);
  const checkInLabel = formatCheckInDate(soonest.date);
  const checkInLine = fillToken(content.grow.checkIn, "date", checkInLabel);
  const closerHeadline = content.grow.closerHeadline.includes("{period}")
    ? fillToken(content.grow.closerHeadline, "period", soonest.period)
    : content.grow.closerHeadline;

  const save = (next: LevelUpAnswer, done: boolean) => {
    setDraft(next);
    if (done) onFinish(next);
    else {
      onSave(next);
      setPage((current) => current + 1);
    }
  };

  const improvePicksReady = (ids: readonly LevelSectionId[]) =>
    ids.every((section) => statementsIn(content.statements, section).every((item) => wins.has(item.id)) || Boolean(draft.picks[section]));
  const chosenItems = pickedStatements(content, draft.picks);
  const currentIdea = growDetail && page > 0 && page <= growIdeas.length ? growIdeas[page - 1] : undefined;
  const currentPlan = currentIdea ? planForIdea(draft.growPlans, currentIdea.id) : undefined;

  let ready = true;
  if (screen.step === "improve" && page < pickPages) ready = improvePicksReady([sections[page]!.id]);
  if (screen.step === "improve" && page === pickPages) ready = chosenItems.length > 0 && chosenItems.every((item) => draft.improvePlan.some((row) => row.statementId === item.id)) && draft.improvePlan.length === chosenItems.length;
  if (screen.step === "grow" && page === 0) ready = growIdeas.length > 0;
  if (currentIdea && currentPlan) {
    const visible = new Set(visibleOptions(currentIdea, cohort).map((option) => option.id));
    const blocked = blockedOptions(currentIdea, offered);
    const picked = currentPlan.options.filter((id) => visible.has(id) && !blocked.has(id));
    const starts = new Set((content.grow.startOptions ?? []).map((option) => option.id));
    const periods = new Set((content.grow.checkInOptions ?? []).map((option) => option.id));
    ready = picked.length > 0 && starts.has(currentPlan.when) && currentPlan.successCount >= 1 && periods.has(currentPlan.checkIn);
  }

  const go = () => {
    if (!ready) return;
    const next = { ...draft };
    if (screen.step === "improve" && page === pickPages - 1) {
      const rows = pickedStatements(content, next.picks);
      next.pace = paceFor(content, next.picks);
      const covered = rows.every((item) => next.improvePlan.some((row) => row.statementId === item.id)) && next.improvePlan.length === rows.length;
      if (rows.length === 0 || !planAvailable) {
        save(next, true);
        return;
      }
      if (!covered) next.improvePlan = planFor(rows.map((item) => item.id));
    }
    if (screen.step === "grow" && page === 0) {
      next.ideas = growIdeas.map((idea) => idea.id);
      next.growPlans = next.growPlans.filter((row) => next.ideas.includes(row.idea));
    }
    if (currentIdea && currentPlan) {
      const committed = writtenDates.current.get(currentIdea.id);
      const period = (content.grow.checkInOptions ?? []).find((option) => option.id === currentPlan.checkIn);
      const checkInDate = committed && committed.checkIn === currentPlan.checkIn
        ? committed.checkInDate
        : period?.months
          ? formatCheckInDate(addMonths(today, period.months))
          : "";
      if (checkInDate) writtenDates.current.set(currentIdea.id, { checkIn: currentPlan.checkIn, checkInDate });
      next.growPlans = writePlan(next.growPlans, { ...currentPlan, checkInDate });
    }
    save(next, page >= total - 1);
  };

  const reflectSection = (section: LevelSectionId) => (
    <SectionBlock key={section} id={section} label={sectionLabel(sections, section)}>
      {statementsIn(content.statements, section).map((item) => (
        <Lined key={item.id} item={item} selected={draft.selected.includes(item.id)} onClick={() => setDraft({ ...draft, selected: toggle(draft.selected, item.id) })} />
      ))}
    </SectionBlock>
  );

  const improveSection = (section: LevelSectionId) => {
    const rows = statementsIn(content.statements, section);
    const live = rows.filter((item) => !wins.has(item.id));
    return (
      <SectionBlock key={section} id={section} label={sectionLabel(sections, section)}>
        {live.length === 0 ? (
          <div data-nailed={section}>
            <ScreenPrompt tone="section" flush className="!mt-[21px]">{content.improve.nailedTitle}</ScreenPrompt>
            <p className={LESSON_BODY}>{fillToken(content.improve.nailedLine, "section", sectionLabel(sections, section))}</p>
          </div>
        ) : (
          rows.map((item) => {
            const won = wins.has(item.id);
            return (
              <Lined
                key={item.id}
                item={item}
                muted={won}
                selected={!won && draft.picks[section] === item.id}
                onClick={() => {
                  if (!won) setDraft({ ...draft, picks: { ...draft.picks, [section]: item.id } });
                }}
              />
            );
          })
        )}
      </SectionBlock>
    );
  };

  let body: React.ReactNode = null;
  if (screen.step === "reflect") {
    body = (
      <>
        {page === 0 ? (
          <>
            <p className={`mt-3 ${LESSON_BODY}`}>{content.reflect.context}</p>
            <ScreenGuidance flush>{content.reflect.guidance}</ScreenGuidance>
          </>
        ) : null}
        <ScreenPrompt tone="question" flush>{content.reflect.question}</ScreenPrompt>
        {sections[page] ? reflectSection(sections[page].id) : null}
      </>
    );
  } else if (screen.step === "improve" && page < pickPages) {
    body = (
      <>
        {page === 0 ? (
          <>
            <p className={`mt-3 ${LESSON_BODY}`}>{content.improve.context}</p>
            <ScreenGuidance flush>{content.improve.guidance}</ScreenGuidance>
            <ScreenPrompt tone="question" flush>{content.improve.question}</ScreenPrompt>
          </>
        ) : null}
        {sections[page] ? improveSection(sections[page].id) : null}
      </>
    );
  } else if (screen.step === "improve") {
    const slots = weekLabels.slice(0, chosenItems.length);
    body = (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{content.improve.planHeader}</ScreenPrompt>
        <p className={`mt-[21px] ${LESSON_BODY}`}>{content.improve.planContext}</p>
        <OrderedSlots
          items={chosenItems}
          order={draft.improvePlan.map((row) => row.statementId)}
          slotLabels={slots}
          onOrder={(next) => setDraft({ ...draft, improvePlan: planFor(next) })}
        />
      </>
    );
  } else if (page === 0) {
    const full = growIdeas.length >= 3;
    body = (
      <>
        {content.grow.context ? <p className={`mt-3 ${LESSON_HINT}`} data-grow-intro="">{content.grow.context}</p> : null}
        <ScreenPrompt id="grow-question" tone="question" flush className="!mt-[21px]">{content.grow.question}</ScreenPrompt>
        <ScreenGuidance flush>{content.grow.guidance}</ScreenGuidance>
        <div className="mt-[21px]">
          {(content.grow.ideas ?? []).map((idea) => {
            const on = growIdeas.some((row) => row.id === idea.id);
            return (
              <Lined
                key={idea.id}
                item={idea}
                selected={on}
                muted={!on && full}
                onClick={() => {
                  if (on) setDraft({ ...draft, ideas: draft.ideas.filter((id) => id !== idea.id) });
                  else if (!full) setDraft({ ...draft, ideas: [...draft.ideas, idea.id] });
                }}
              />
            );
          })}
        </div>
      </>
    );
  } else if (statementMode && currentIdea?.layout === "stacked" && currentIdea.stacked && currentPlan) {
    const slots = currentIdea.stacked;
    const visible = visibleOptions(currentIdea, cohort);
    const blocked = blockedOptions(currentIdea, offered);
    const chosen = visible.filter((option) => currentPlan.options.includes(option.id) && !blocked.has(option.id));
    const joined = joinList(chosen.map(offerWords), content.grow.joinWord ?? "");
    const start = (content.grow.startOptions ?? []).find((option) => option.id === currentPlan.when);
    const period = (content.grow.checkInOptions ?? []).find((option) => option.id === currentPlan.checkIn);
    const committed = writtenDates.current.get(currentIdea.id);
    const experimentDate = period
      ? committed && committed.checkIn === currentPlan.checkIn
        ? committed.checkInDate
        : period.months
          ? formatCheckInDate(addMonths(today, period.months))
          : ""
      : "";
    const patch = (plan: GrowPlan) => setDraft({ ...draft, growPlans: writePlan(draft.growPlans, plan) });
    const fieldClass = (filled: boolean) =>
      `flex w-full min-h-8 items-start justify-between gap-2 border-b-[1.5px] py-1 text-left ${filled ? "border-[#0CC1E0]" : "border-[#8A94A8]"}`;
    const valueClass = (filled: boolean) =>
      `min-w-0 flex-1 text-left font-sans text-[18px] font-semibold leading-[26px] ${filled ? "text-[#0CC1E0]" : "text-[#8A94A8]"}`;
    body = (
      <div data-grow-statement={currentIdea.id} data-grow-layout="stacked">
        <ScreenPrompt tone="question" flush className="!mt-3">{currentIdea.label}</ScreenPrompt>
        {currentIdea.context ? <p className={`mt-3 ${LESSON_HINT}`}>{currentIdea.context}</p> : null}
        <div className="mt-[21px]">
          <div className="mb-4">
            <p className={`mb-1 ${LESSON_BODY}`}>{slots.offerLead}</p>
            <div className="relative">
              <div className={fieldClass(joined.length > 0)}>
                <span className={valueClass(joined.length > 0)}>{joined || slots.emptyLabel}</span>
                <PickChevron stroke={joined ? "#0CC1E0" : "#8A94A8"} />
              </div>
              <select
                aria-label={slots.offerLead}
                value=""
                onChange={(event) => {
                  const id = event.target.value;
                  if (!id || blocked.has(id)) return;
                  const on = currentPlan.options.includes(id);
                  patch({ ...currentPlan, options: on ? currentPlan.options.filter((item) => item !== id) : [...currentPlan.options, id] });
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">{slots.emptyLabel}</option>
                {visible.map((option) => (
                  <option key={option.id} value={option.id} disabled={blocked.has(option.id)}>{option.label}</option>
                ))}
              </select>
            </div>
            {slots.offerNote ? <p className={`mt-1 ${LESSON_BODY}`}>{slots.offerNote}</p> : null}
          </div>
          <div className="mb-4">
            <p className={`mb-1 ${LESSON_BODY}`}>{slots.startLead}</p>
            <div className="relative">
              <div className={fieldClass(Boolean(start))}>
                <span className={valueClass(Boolean(start))}>{start?.label || slots.emptyLabel}</span>
                <PickChevron stroke={start ? "#0CC1E0" : "#8A94A8"} />
              </div>
              <select
                aria-label={slots.startLead}
                value={currentPlan.when}
                onChange={(event) => patch({ ...currentPlan, when: event.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">{slots.emptyLabel}</option>
                {(content.grow.startOptions ?? []).map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            {slots.startNote ? <p className={`mt-1 ${LESSON_BODY}`}>{slots.startNote}</p> : null}
          </div>
          <div className="mb-4">
            <p className={`mb-1 ${LESSON_BODY}`}>{slots.countLead}</p>
            <div className="flex items-end gap-2">
              <input
                aria-label={slots.countLead}
                inputMode="numeric"
                value={currentPlan.successCount ? String(currentPlan.successCount) : ""}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                  patch({ ...currentPlan, successCount: digits ? Number(digits) : 0 });
                }}
                className={`w-[90px] border-b-[1.5px] bg-transparent py-1 text-left font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] outline-none ${currentPlan.successCount ? "border-[#0CC1E0]" : "border-[#8A94A8]"}`}
              />
              <span className={LESSON_BODY}>{slots.countAfter}</span>
            </div>
          </div>
          <div>
            <p className={`mb-1 ${LESSON_BODY}`}>{slots.checkInLead}</p>
            <div className="relative">
              <div className={fieldClass(Boolean(period))}>
                <span className={valueClass(Boolean(period))}>{period?.label || slots.emptyLabel}</span>
                <PickChevron stroke={period ? "#0CC1E0" : "#8A94A8"} />
              </div>
              <select
                aria-label={slots.checkInLead}
                value={currentPlan.checkIn}
                onChange={(event) => patch({ ...currentPlan, checkIn: event.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">{slots.emptyLabel}</option>
                {(content.grow.checkInOptions ?? []).map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {experimentDate && content.grow.dateLine ? <p className={`mt-3 ${LESSON_HINT}`} data-experiment-date="">{fillToken(content.grow.dateLine, "date", experimentDate)}</p> : null}
      </div>
    );
  } else if (statementMode && currentIdea && currentPlan && currentIdea.statement) {
    const visible = visibleOptions(currentIdea, cohort);
    const blocked = blockedOptions(currentIdea, offered);
    const chosen = visible.filter((option) => currentPlan.options.includes(option.id) && !blocked.has(option.id));
    const joined = joinList(chosen.map(offerWords), content.grow.joinWord ?? "");
    const start = (content.grow.startOptions ?? []).find((option) => option.id === currentPlan.when);
    const period = (content.grow.checkInOptions ?? []).find((option) => option.id === currentPlan.checkIn);
    const committed = writtenDates.current.get(currentIdea.id);
    const experimentDate = period
      ? committed && committed.checkIn === currentPlan.checkIn
        ? committed.checkInDate
        : period.months
          ? formatCheckInDate(addMonths(today, period.months))
          : ""
      : "";
    const patch = (plan: GrowPlan) => setDraft({ ...draft, growPlans: writePlan(draft.growPlans, plan) });
    const toggleSlot = (slot: "offer" | "start" | "checkIn") => setOpenSlot((current) => (current === slot ? null : slot));
    const pickClass = "mx-0.5 inline border-b-[1.5px] border-[#0CC1E0] align-baseline font-sans text-[18px] font-semibold leading-[26px] text-[#0CC1E0]";
    const list = openSlot === "offer"
      ? visible.map((option) => ({ ...option, blocked: blocked.has(option.id), selected: !blocked.has(option.id) && currentPlan.options.includes(option.id) }))
      : openSlot === "start"
        ? (content.grow.startOptions ?? []).map((option) => ({ ...option, blocked: false, selected: currentPlan.when === option.id }))
        : openSlot === "checkIn"
          ? (content.grow.checkInOptions ?? []).map((option) => ({ ...option, blocked: false, selected: currentPlan.checkIn === option.id }))
          : [];
    body = (
      <div data-grow-statement={currentIdea.id}>
        <ScreenPrompt tone="question" flush className="!mt-3">{currentIdea.label}</ScreenPrompt>
        {currentIdea.context ? <p className={`mt-3 ${LESSON_HINT}`}>{currentIdea.context}</p> : null}
        <p className={`mt-[21px] ${LESSON_BODY}`}>
          {statementParts(currentIdea.statement).map((part, index) => {
            if (part.slot === "offer") {
              return (
                <button key={index} type="button" aria-expanded={openSlot === "offer"} aria-label={joined ? undefined : content.grow.optionPrompt} onClick={() => toggleSlot("offer")} className={`${pickClass} ${joined ? "" : "min-w-8"}`}>
                  {joined || "\u00a0"}
                  <PickChevron />
                </button>
              );
            }
            if (part.slot === "start") {
              return (
                <button key={index} type="button" aria-expanded={openSlot === "start"} aria-label={start ? undefined : content.grow.startLabel} onClick={() => toggleSlot("start")} className={`${pickClass} ${start ? "" : "min-w-8"}`}>
                  {start?.label || "\u00a0"}
                  <PickChevron />
                </button>
              );
            }
            if (part.slot === "checkIn") {
              return (
                <button key={index} type="button" aria-expanded={openSlot === "checkIn"} aria-label={period ? undefined : content.grow.checkInLabel} onClick={() => toggleSlot("checkIn")} className={`${pickClass} ${period ? "" : "min-w-8"}`}>
                  {period?.label || "\u00a0"}
                  <PickChevron />
                </button>
              );
            }
            if (part.slot === "count") {
              return (
                <input
                  key={index}
                  aria-label={content.grow.successFieldLabel}
                  inputMode="numeric"
                  value={currentPlan.successCount ? String(currentPlan.successCount) : ""}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                    patch({ ...currentPlan, successCount: digits ? Number(digits) : 0 });
                  }}
                  className="mx-1 inline-block w-10 border-b-[1.5px] border-[#0CC1E0] bg-transparent text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] outline-none"
                />
              );
            }
            return <span key={index}>{part.text}</span>;
          })}
        </p>
        {openSlot ? (
          <div className="mt-2" data-grow-options={openSlot}>
            {list.map((option) => (
              <Lined
                key={option.id}
                item={option}
                selected={option.selected}
                muted={option.blocked}
                onClick={() => {
                  if (option.blocked) return;
                  if (openSlot === "offer") {
                    patch({
                      ...currentPlan,
                      options: option.selected ? currentPlan.options.filter((id) => id !== option.id) : [...currentPlan.options, option.id],
                    });
                    return;
                  }
                  if (openSlot === "start") patch({ ...currentPlan, when: option.id });
                  if (openSlot === "checkIn") patch({ ...currentPlan, checkIn: option.id });
                  setOpenSlot(null);
                }}
              />
            ))}
          </div>
        ) : null}
        {experimentDate && content.grow.dateLine ? <p className={`mt-3 ${LESSON_HINT}`} data-experiment-date="">{fillToken(content.grow.dateLine, "date", experimentDate)}</p> : null}
        <LargeScribble name="growth" />
      </div>
    );
  } else if (currentIdea && currentPlan) {
    const visible = visibleOptions(currentIdea, cohort);
    const blockedIds = blockedOptions(currentIdea, offered);
    const [before, after] = (currentIdea.successLine ?? "").split("{count}");
    const field: LaunchpadTextField = { name: "success", input: "integer", label: content.grow.successFieldLabel ?? "", min: 1, max: 999 };
    const patch = (plan: GrowPlan) => setDraft({ ...draft, growPlans: writePlan(draft.growPlans, plan) });
    body = (
      <>
        <ScreenPrompt tone="section" flush className="!mt-3">{currentIdea.label}</ScreenPrompt>
        {content.grow.optionPrompt ? <ScreenGuidance flush>{content.grow.optionPrompt}</ScreenGuidance> : null}
        {visible.map((option) => {
          const blocked = blockedIds.has(option.id);
          const on = !blocked && currentPlan.options.includes(option.id);
          return (
            <Lined
              key={option.id}
              item={option}
              selected={on}
              muted={blocked}
              onClick={() => {
                if (blocked) return;
                patch({ ...currentPlan, options: on ? currentPlan.options.filter((id) => id !== option.id) : [...currentPlan.options, option.id] });
              }}
            />
          );
        })}
        {content.grow.startLabel ? <ScreenPrompt tone="section" flush className="!mt-[21px]">{content.grow.startLabel}</ScreenPrompt> : null}
        {(content.grow.startOptions ?? []).map((option) => (
          <Lined key={option.id} item={option} selected={currentPlan.when === option.id} onClick={() => patch({ ...currentPlan, when: option.id })} />
        ))}
        {currentIdea.successLine ? (
          <p className={`mt-4 ${LESSON_BODY}`}>
            {before}
            <FieldControl
              field={field}
              value={currentPlan.successCount || ""}
              onChange={(value) => patch({ ...currentPlan, successCount: typeof value === "number" ? value : 0 })}
              appearance="inline"
              idPrefix="grow"
            />
            {after}
          </p>
        ) : null}
        {content.grow.checkInLabel ? <ScreenPrompt tone="section" flush className="!mt-[21px]">{content.grow.checkInLabel}</ScreenPrompt> : null}
        {(content.grow.checkInOptions ?? []).map((option) => (
          <Lined key={option.id} item={option} selected={currentPlan.checkIn === option.id} onClick={() => patch({ ...currentPlan, checkIn: option.id })} />
        ))}
      </>
    );
  } else {
    body = (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{closerHeadline}</ScreenPrompt>
        <p className={`mt-[21px] ${LESSON_BODY}`}>{content.grow.closerContext}</p>
        <p className={`mt-4 select-text ${LESSON_BODY}`} data-check-in-date="">{checkInLine}</p>
        <p className={`mt-4 select-text ${LESSON_BODY}`}>{content.grow.calendarNote}</p>
        <button
          type="button"
          className="mt-4 h-11 rounded-xl border border-[#D5DAE3] bg-white px-4 font-sans text-[16px] font-semibold leading-[23px] text-[#19347D]"
          onClick={() => {
            const text = checkInClipboard(content.grow.calendarNote, checkInLine);
            void copyPlainText(text).then((ok) => setCopyNote({ kind: ok ? "copied" : "failed", at: Date.now() }));
          }}
        >
          {copyNote.kind === "copied" && content.grow.copiedLabel ? content.grow.copiedLabel : content.grow.copyLabel}
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {copyNote.kind === "copied" ? content.grow.copiedLabel : copyNote.kind === "failed" ? content.grow.copyFailedHint : ""}
        </p>
        {copyNote.kind === "failed" && content.grow.copyFailedHint ? (
          <p className={`mt-3 ${LESSON_HINT}`} data-copy-failed="">{content.grow.copyFailedHint}</p>
        ) : (
          <p className={`mt-3 ${LESSON_HINT}`}>{content.grow.copyHint}</p>
        )}
      </>
    );
  }

  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={go} />}
      decoration={screen.step === "grow" && page === 0 ? (
        <img src={SCRIBBLE_SRC.bulb} alt="" width={64} height={64} draggable={false} data-scribble="bulb" className="pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto w-16 mix-blend-multiply" />
      ) : screen.step === "grow" && currentIdea?.layout === "stacked" ? (
        <img src={SCRIBBLE_SRC.growth} alt="" width={80} height={80} draggable={false} data-scribble-large="growth" className="pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto w-20 mix-blend-multiply" />
      ) : screen.step === "grow" && !currentIdea ? (
        <img src={SCRIBBLE_SRC.calendar} alt="" width={80} height={80} draggable={false} data-scribble-large="calendar" className="pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto w-20 mix-blend-multiply" />
      ) : null}
    >
      <div data-task-screen="level-up" data-level-step={screen.step} data-level-page={page + 1}>{body}</div>
    </LessonSurface>
  );
}
