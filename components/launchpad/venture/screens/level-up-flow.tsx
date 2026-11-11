"use client";

import { useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, selectionOf, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import {
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
  IMPROVE_CONTEXT,
  IMPROVE_GUIDANCE,
  IMPROVE_PLAN_CONTEXT,
  IMPROVE_PLAN_GUIDANCE,
  IMPROVE_QUESTION,
  IMPROVE_START_OPTIONS,
  NAILED_TITLE,
  REFLECT_CONTEXT,
  REFLECT_GUIDANCE,
  REFLECT_QUESTION,
  SECTION_PAGES,
  addMonths,
  checkInClipboard,
  expandJobsFor,
  formatCheckInDate,
  growIdea,
  mapImproveStart,
  nailedLine,
  sectionLabel,
  statementsIn,
  type ImproveStartId,
  type LevelCohort,
  type LevelPace,
  type LevelSectionId,
  type StartId,
} from "@/lib/launchpad/content/level-up/model";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

const IMPROVE_PICK_PAGES = SECTION_PAGES.length;
/** Four section screens, then the timeline. The counter on every Improve step is of 5. */
const IMPROVE_TOTAL = IMPROVE_PICK_PAGES + 1;

function blankAnswer(): LevelUpAnswer {
  return { kind: "level-up", version: 1, selected: [], picks: {}, pace: {}, starts: {}, ideas: [], idea: "", option: "", success: "", start: "" };
}

function pickedStatements(picks: LevelUpAnswer["picks"]) {
  return SECTION_PAGES.flatMap((section) => {
    const id = picks[section];
    const item = id ? statementsIn(section).find((row) => row.id === id) : undefined;
    return item ? [item] : [];
  });
}

function paceFor(picks: LevelUpAnswer["picks"]): Record<string, LevelPace> {
  return Object.fromEntries(pickedStatements(picks).map((item) => [item.id, item.pace]));
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

function orderedIdeas(ids: readonly string[]): string[] {
  return GROW_IDEAS.map((idea) => idea.id).filter((id) => ids.includes(id));
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
  const chosenItems = pickedStatements(draft.picks);
  const idea = growIdea(draft.idea);
  const growReady = Boolean(draft.option && draft.success);

  let ready = true;
  if (screen.step === "improve" && page < IMPROVE_PICK_PAGES) ready = improvePicksReady([SECTION_PAGES[page]!]);
  if (screen.step === "grow" && page === 0) ready = orderedIdeas(draft.ideas).length > 0;
  if (screen.step === "grow" && page === 1) ready = growReady;

  const go = () => {
    if (!ready) return;
    const next = { ...draft };
    if (screen.step === "improve" && page === IMPROVE_PICK_PAGES - 1) {
      const rows = pickedStatements(next.picks);
      next.pace = paceFor(next.picks);
      if (rows.length === 0) {
        save(next, true);
        return;
      }
      next.starts = Object.fromEntries(rows.map((item) => [item.id, mapImproveStart(next.starts[item.id])]));
    }
    if (screen.step === "grow" && page === 0) {
      const ideas = orderedIdeas(next.ideas);
      const first = growIdea(ideas[0] ?? "");
      next.ideas = ideas;
      next.idea = ideas[0] ?? "";
      next.option = "";
      next.success = "";
      next.start = first?.start ?? "";
    }
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
          rows.map((item) => {
            const won = wins.has(item.id);
            return (
              <Lined
                key={item.id}
                item={{ id: item.id, label: item.label }}
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
            <p className={`mt-3 ${LESSON_BODY}`}>{REFLECT_CONTEXT}</p>
            <ScreenGuidance flush>{REFLECT_GUIDANCE}</ScreenGuidance>
          </>
        ) : null}
        <ScreenPrompt tone="question" flush>{REFLECT_QUESTION}</ScreenPrompt>
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
  } else if (screen.step === "improve") {
    body = (
      <>
        <p className={`mt-3 ${LESSON_BODY}`}>{IMPROVE_PLAN_CONTEXT}</p>
        <ScreenGuidance flush>{IMPROVE_PLAN_GUIDANCE}</ScreenGuidance>
        {chosenItems.map((item) => (
          <p key={item.id} className={`mt-4 ${LESSON_BODY}`} data-level-section={item.section}>
            {item.label}, starting{" "}
            <StartPick
              value={mapImproveStart(draft.starts[item.id])}
              options={IMPROVE_START_OPTIONS}
              onChange={(id) => setDraft({ ...draft, starts: { ...draft.starts, [item.id]: id as ImproveStartId } })}
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
          {GROW_IDEAS.filter((row) => row.group === "sales").map((row) => {
            const on = draft.ideas.includes(row.id);
            const full = !on && orderedIdeas(draft.ideas).length >= 3;
            return <Lined key={row.id} item={row} selected={on} muted={full} onClick={() => setDraft({ ...draft, ideas: on ? draft.ideas.filter((id) => id !== row.id) : [...draft.ideas, row.id] })} />;
          })}
        </div>
        <div className="mt-[21px]">
          <ScreenPrompt tone="section" flush className="!mt-0">{GROW_SERVICE_LABEL}</ScreenPrompt>
          {GROW_IDEAS.filter((row) => row.group === "service").map((row) => {
            const on = draft.ideas.includes(row.id);
            const full = !on && orderedIdeas(draft.ideas).length >= 3;
            return <Lined key={row.id} item={row} selected={on} muted={full} onClick={() => setDraft({ ...draft, ideas: on ? draft.ideas.filter((id) => id !== row.id) : [...draft.ideas, row.id] })} />;
          })}
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

