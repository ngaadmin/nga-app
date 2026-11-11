"use client";

import { useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, selectionOf, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import {
  DO_NOW_LABEL,
  GROW_CALENDAR_NOTE,
  GROW_CLOSER_CONTEXT,
  GROW_CLOSER_HEADLINE,
  GROW_CONTEXT,
  GROW_COPY_HINT,
  GROW_COPY_LABEL,
  GROW_GUIDANCE,
  GROW_IDEAS,
  GROW_QUESTION,
  GROW_SALES_LABEL,
  GROW_SERVICE_LABEL,
  GROW_START_OPTIONS,
  GROW_SUCCESS,
  IMPROVE_ALL_LATER_QUESTION,
  IMPROVE_ALL_NOW_QUESTION,
  IMPROVE_CONTEXT,
  IMPROVE_GUIDANCE,
  IMPROVE_PLAN_CONTEXT,
  IMPROVE_PLAN_GUIDANCE,
  IMPROVE_QUESTION,
  IMPROVE_WHEN_CONTEXT,
  IMPROVE_WHEN_QUESTION,
  NAILED_TITLE,
  REFLECT_CONTEXT,
  REFLECT_GUIDANCE,
  REFLECT_QUESTION,
  SECTION_PAGES,
  SHOW_IMPROVE_TIMING,
  START_OPTIONS,
  THREE_MONTHS_LABEL,
  addMonths,
  checkInClipboard,
  commitLine,
  expandJobsFor,
  formatCheckInDate,
  growIdea,
  nailedLine,
  sectionLabel,
  statementsIn,
  type LevelCohort,
  type LevelSectionId,
  type LevelStatement,
  type StartId,
} from "@/lib/launchpad/content/level-up/model";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

const IMPROVE_PICK_PAGES = SECTION_PAGES.length;
const IMPROVE_TOTAL = IMPROVE_PICK_PAGES + (SHOW_IMPROVE_TIMING ? 2 : 1);

function blankAnswer(): LevelUpAnswer {
  return { kind: "level-up", version: 1, selected: [], picks: {}, starts: {}, idea: "", option: "", success: "", start: "" };
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function StartPick({ value, options, onChange }: { value: string; options: readonly { id: string; label: string }[]; onChange: (id: string) => void }) {
  const field: LaunchpadTextField = {
    name: "start",
    input: "choice",
    label: "Start date",
    defaultValue: value,
    options: options.map((option) => ({ id: option.id, label: option.label })),
  };
  return <FieldControl field={field} value={value} onChange={(next) => onChange(String(next))} appearance="underline" idPrefix="level-up" />;
}

function Lined({ item, selected, muted, tag, onClick }: { item: { id: string; label: string }; selected: boolean; muted?: boolean; tag?: string; onClick: () => void }) {
  return <Chip variant="lined" label={item.label} selected={selected} muted={muted} tag={tag} onClick={onClick} />;
}

function SectionBlock({ id, children }: { id: LevelSectionId; children: ReactNode }) {
  return (
    <div className="mt-[21px]" data-level-section={id}>
      <ScreenPrompt tone="section" flush className="!mt-0">{sectionLabel(id)}</ScreenPrompt>
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
  const saved = levelUpOf(answers, screen.answerKey) ?? blankAnswer();
  const wins = new Set(levelUpOf(answers, "l7-reflect")?.selected ?? []);
  const offered = new Set(selectionOf(answers, "l1-offer")?.selected ?? []);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<LevelUpAnswer>(saved);
  const total = screen.step === "improve" ? IMPROVE_TOTAL : screen.step === "reflect" ? SECTION_PAGES.length : 3;
  const whenPage = SHOW_IMPROVE_TIMING ? IMPROVE_PICK_PAGES : -1;
  const planPage = IMPROVE_TOTAL - 1;
  const checkIn = addMonths(today, 3);
  const checkInLabel = formatCheckInDate(checkIn);

  const save = (next: LevelUpAnswer, done: boolean) => {
    setDraft(next);
    if (done) onFinish(next);
    else {
      onSave(next);
      setPage((current) => current + 1);
    }
  };

  const reflectReady = true;
  const improvePicksReady = (sections: readonly LevelSectionId[]) =>
    sections.every((section) => statementsIn(section).every((item) => wins.has(item.id)) || Boolean(draft.picks[section]));
  const chosen = Object.values(draft.picks);
  const chosenItems = chosen.map((id) => statementsIn("customers").concat(statementsIn("ready"), statementsIn("job"), statementsIn("happy")).find((item) => item.id === id)).filter((item): item is LevelStatement => Boolean(item));
  const nowItems = chosenItems.filter((item) => item.tag === "do-now");
  const laterItems = chosenItems.filter((item) => item.tag === "three-months");
  const whenMode = nowItems.length && laterItems.length ? "mixed" : laterItems.length ? "later" : "now";
  const planItems = !SHOW_IMPROVE_TIMING
    ? chosenItems
    : whenMode === "mixed"
      ? chosenItems.filter((item) => item.id === draft.picks.now || item.id === draft.picks.later)
      : whenMode === "later"
        ? chosenItems.filter((item) => item.id === draft.picks.later)
        : nowItems;
  const whenReady = whenMode === "now" ? true : whenMode === "later" ? Boolean(draft.picks.later) : Boolean(draft.picks.now && draft.picks.later);
  const idea = growIdea(draft.idea);
  const growReady = Boolean(draft.option && draft.success);

  let ready = true;
  if (screen.step === "improve" && page < IMPROVE_PICK_PAGES) ready = improvePicksReady([SECTION_PAGES[page]!]);
  if (screen.step === "improve" && page === whenPage) ready = whenReady;
  if (screen.step === "grow" && page === 0) ready = Boolean(draft.idea);
  if (screen.step === "grow" && page === 1) ready = growReady;

  const go = () => {
    if (!ready) return;
    const next = { ...draft };
    if (screen.step === "improve" && page === IMPROVE_PICK_PAGES - 1 && !SHOW_IMPROVE_TIMING) {
      next.starts = Object.fromEntries(chosenItems.map((item) => [item.id, next.starts[item.id] ?? "this-week"]));
    }
    if (screen.step === "improve" && page === whenPage && whenMode === "now") {
      next.starts = Object.fromEntries(nowItems.map((item) => [item.id, next.starts[item.id] ?? "this-week"]));
    }
    if (screen.step === "improve" && page === whenPage && whenMode !== "now") {
      const rows = whenMode === "later" ? laterItems.filter((item) => item.id === next.picks.later) : chosenItems.filter((item) => item.id === next.picks.now || item.id === next.picks.later);
      next.starts = Object.fromEntries(rows.map((item) => [item.id, next.starts[item.id] ?? (item.tag === "do-now" ? "this-week" : "in-three-months")]));
    }
    if (screen.step === "grow" && page === 0 && idea) next.start = next.start || idea.start;
    save(next, page >= total - 1);
  };

  const reflectSection = (section: LevelSectionId) => (
    <SectionBlock key={section} id={section}>
      {statementsIn(section).map((item) => (
        <Lined key={item.id} item={{ id: item.id, label: item.label }} selected={draft.selected.includes(item.id)} onClick={() => setDraft({ ...draft, selected: toggle(draft.selected, item.id) })} />
      ))}
    </SectionBlock>
  );

  const improveSection = (section: LevelSectionId) => {
    const rows = statementsIn(section);
    const live = rows.filter((item) => !wins.has(item.id));
    return (
      <SectionBlock key={section} id={section}>
        {live.length === 0 ? (
          <div data-nailed={section}>
            <ScreenPrompt tone="section" flush className="!mt-[21px]">{NAILED_TITLE}</ScreenPrompt>
            <p className={LESSON_BODY}>{nailedLine(section)}</p>
          </div>
        ) : (
          live.map((item) => (
            <Lined
              key={item.id}
              item={{ id: item.id, label: item.label }}
              tag={SHOW_IMPROVE_TIMING ? (item.tag === "do-now" ? DO_NOW_LABEL : THREE_MONTHS_LABEL) : undefined}
              selected={draft.picks[section] === item.id}
              onClick={() => setDraft({ ...draft, picks: { ...draft.picks, [section]: item.id } })}
            />
          ))
        )}
      </SectionBlock>
    );
  };

  const group = (label: string, items: readonly LevelStatement[], picked: string | undefined, onPick: (id: string) => void, lock: boolean) => (
    <div className="mt-[21px]">
      <ScreenPrompt tone="section" flush className="!mt-0">{label}</ScreenPrompt>
      {items.map((item) => (
        <Lined key={item.id} item={{ id: item.id, label: item.label }} selected={lock || picked === item.id} onClick={() => { if (!lock) onPick(item.id); }} />
      ))}
    </div>
  );

  let body: React.ReactNode = null;
  if (screen.step === "reflect") {
    body = (
      <>
        {page === 0 ? (
          <>
            <p className={`mt-3 ${LESSON_BODY}`}>{REFLECT_CONTEXT}</p>
            <ScreenGuidance flush>{REFLECT_GUIDANCE}</ScreenGuidance>
            <ScreenPrompt tone="question" flush>{REFLECT_QUESTION}</ScreenPrompt>
          </>
        ) : null}
        {SECTION_PAGES[page] ? reflectSection(SECTION_PAGES[page]) : null}
      </>
    );
  } else if (screen.step === "improve" && page < IMPROVE_PICK_PAGES) {
    body = (
      <>
        {page === 0 ? (
          <>
            <p className={`mt-3 ${LESSON_BODY}`}>{IMPROVE_CONTEXT}</p>
            <ScreenGuidance flush>{IMPROVE_GUIDANCE}</ScreenGuidance>
            <ScreenPrompt tone="question" flush>{IMPROVE_QUESTION}</ScreenPrompt>
          </>
        ) : null}
        {SECTION_PAGES[page] ? improveSection(SECTION_PAGES[page]) : null}
      </>
    );
  } else if (screen.step === "improve" && page === whenPage) {
    body = whenMode === "now" ? (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{IMPROVE_ALL_NOW_QUESTION}</ScreenPrompt>
        {group(DO_NOW_LABEL, nowItems, undefined, () => {}, true)}
      </>
    ) : whenMode === "later" ? (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{IMPROVE_ALL_LATER_QUESTION}</ScreenPrompt>
        {group(THREE_MONTHS_LABEL, laterItems, draft.picks.later, (id) => setDraft({ ...draft, picks: { ...draft.picks, later: id } }), false)}
      </>
    ) : (
      <>
        <p className={`mt-3 ${LESSON_BODY}`}>{IMPROVE_WHEN_CONTEXT}</p>
        <ScreenPrompt tone="question" flush>{IMPROVE_WHEN_QUESTION}</ScreenPrompt>
        {group(DO_NOW_LABEL, nowItems, draft.picks.now, (id) => setDraft({ ...draft, picks: { ...draft.picks, now: id } }), false)}
        {group(THREE_MONTHS_LABEL, laterItems, draft.picks.later, (id) => setDraft({ ...draft, picks: { ...draft.picks, later: id } }), false)}
      </>
    );
  } else if (screen.step === "improve") {
    body = (
      <>
        <p className={`mt-3 ${LESSON_BODY}`}>{IMPROVE_PLAN_CONTEXT}</p>
        <ScreenGuidance flush>{IMPROVE_PLAN_GUIDANCE}</ScreenGuidance>
        {planItems.map((item) => (
          <p key={item.id} className={`mt-4 ${LESSON_BODY}`}>
            {SHOW_IMPROVE_TIMING ? `${commitLine(item.label)}, starting` : `${item.label}, starting`}{" "}
            <StartPick
              value={draft.starts[item.id] ?? (SHOW_IMPROVE_TIMING && item.tag === "three-months" ? "in-three-months" : "this-week")}
              options={START_OPTIONS}
              onChange={(id) => setDraft({ ...draft, starts: { ...draft.starts, [item.id]: id as StartId } })}
            />
            .
          </p>
        ))}
      </>
    );
  } else if (page === 0) {
    body = (
      <>
        <p className={`mt-3 ${LESSON_BODY}`}>{GROW_CONTEXT}</p>
        <ScreenGuidance flush>{GROW_GUIDANCE}</ScreenGuidance>
        <ScreenPrompt tone="question" flush>{GROW_QUESTION}</ScreenPrompt>
        <div className="mt-[21px]">
          <ScreenPrompt tone="section" flush className="!mt-0">{GROW_SALES_LABEL}</ScreenPrompt>
          {GROW_IDEAS.filter((row) => row.group === "sales").map((row) => (
            <Lined key={row.id} item={row} selected={draft.idea === row.id} onClick={() => setDraft({ ...draft, idea: row.id, option: "", success: "", start: row.start })} />
          ))}
        </div>
        <div className="mt-[21px]">
          <ScreenPrompt tone="section" flush className="!mt-0">{GROW_SERVICE_LABEL}</ScreenPrompt>
          {GROW_IDEAS.filter((row) => row.group === "service").map((row) => (
            <Lined key={row.id} item={row} selected={draft.idea === row.id} onClick={() => setDraft({ ...draft, idea: row.id, option: "", success: "", start: row.start })} />
          ))}
        </div>
      </>
    );
  } else if (page === 1 && idea) {
    const options = idea.id === "expand" ? expandJobsFor(cohort) : idea.options;
    body = (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{idea.label}</ScreenPrompt>
        <p className={`mt-[21px] ${LESSON_BODY}`}>{idea.context}</p>
        <ScreenPrompt tone="section" flush className="!mt-[21px]">{idea.question}</ScreenPrompt>
        {options.map((option) => (
          <Lined
            key={option.id}
            item={option}
            muted={idea.id === "new-service" && offered.has(option.id)}
            selected={draft.option === option.id}
            onClick={() => setDraft({ ...draft, option: option.id })}
          />
        ))}
        <p className={`mt-4 ${LESSON_BODY}`}>
          I will try it starting <StartPick value={draft.start || idea.start} options={GROW_START_OPTIONS} onChange={(id) => setDraft({ ...draft, start: id as StartId })} />.
        </p>
        <ScreenPrompt tone="section" flush className="!mt-2">{GROW_SUCCESS}</ScreenPrompt>
        {idea.success.map((option) => (
          <Lined key={option.id} item={option} selected={draft.success === option.id} onClick={() => setDraft({ ...draft, success: option.id })} />
        ))}
      </>
    );
  } else {
    body = (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{GROW_CLOSER_HEADLINE}</ScreenPrompt>
        <p className={`mt-[21px] ${LESSON_BODY}`}>{GROW_CLOSER_CONTEXT}</p>
        <p className={`mt-4 ${LESSON_BODY}`} data-check-in-date="">Your next check-in: {checkInLabel}</p>
        <p className={`mt-4 ${LESSON_BODY}`}>{GROW_CALENDAR_NOTE}</p>
        <button
          type="button"
          className="mt-4 h-11 rounded-xl border border-[#D5DAE3] bg-white px-4 font-sans text-[16px] font-semibold leading-[23px] text-[#19347D]"
          onClick={() => void navigator.clipboard?.writeText(checkInClipboard(checkInLabel))}
        >
          {GROW_COPY_LABEL}
        </button>
        <p className={`mt-3 ${LESSON_HINT}`}>{GROW_COPY_HINT}</p>
      </>
    );
  }

  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={go} />}
    >
      <div data-task-screen="level-up" data-level-step={screen.step} data-level-page={page + 1}>{body}</div>
    </LessonSurface>
  );
}

