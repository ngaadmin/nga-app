"use client";

import { useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, selectionOf, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadTextField } from "@/lib/launchpad/content/types";
import type { LaunchpadLevelUpScreen } from "@/lib/launchpad/content/types";
import {
  addMonths,
  checkInClipboard,
  expandJobsFor,
  fillToken,
  formatCheckInDate,
  growIdea,
  paceFor,
  pickedStatements,
  sectionLabel,
  statementsIn,
  type LevelCohort,
  type LevelSectionId,
  type LevelUpIdea,
  type StartId,
} from "@/lib/launchpad/content/level-up/model";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { OrderedSlots } from "@/components/launchpad/venture/screens/rank-order-screen";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

function blankAnswer(): LevelUpAnswer {
  return { kind: "level-up", version: 1, selected: [], picks: {}, pace: {}, improvePlan: [], ideas: [], idea: "", option: "", success: "", start: "" };
}

function planFor(ids: readonly string[]): { statementId: string; week: number }[] {
  return ids.map((statementId, index) => ({ statementId, week: index + 1 }));
}

function orderedIdeas(ideas: readonly { id: string }[], ids: readonly string[]): string[] {
  return ideas.map((idea) => idea.id).filter((id) => ids.includes(id));
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function StartPick({ value, label, options, onChange }: { value: string; label: string; options: readonly { id: string; label: string }[]; onChange: (id: string) => void }) {
  const field: LaunchpadTextField = {
    name: "start",
    input: "choice",
    label,
    defaultValue: value,
    options: options.map((option) => ({ id: option.id, label: option.label })),
  };
  return <FieldControl field={field} value={value} onChange={(next) => onChange(String(next))} appearance="underline" idPrefix="level-up" />;
}

function Lined({ item, selected, muted, onClick }: { item: { id: string; label: string }; selected: boolean; muted?: boolean; onClick: () => void }) {
  return <Chip variant="lined" label={item.label} selected={selected} muted={muted} onClick={onClick} />;
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
  const offered = new Set(selectionOf(answers, "l1-offer")?.selected ?? []);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<LevelUpAnswer>(saved);
  const pickPages = sections.length;
  const weekLabels = content.improve.weekLabels ?? [];
  const planAvailable = Boolean(content.improve.planHeader && weekLabels.length > 0);
  const total = screen.step === "improve" ? pickPages + (planAvailable ? 1 : 0) : screen.step === "reflect" ? pickPages : 3;
  const checkIn = addMonths(today, 3);
  const checkInLabel = formatCheckInDate(checkIn);
  const checkInLine = fillToken(content.grow.checkIn, "date", checkInLabel);

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
  const idea: LevelUpIdea | undefined = growIdea(content.grow.ideas, draft.idea);
  const growReady = Boolean(draft.option && draft.success);

  let ready = true;
  if (screen.step === "improve" && page < pickPages) ready = improvePicksReady([sections[page]!.id]);
  if (screen.step === "improve" && page === pickPages) ready = chosenItems.length > 0 && chosenItems.every((item) => draft.improvePlan.some((row) => row.statementId === item.id)) && draft.improvePlan.length === chosenItems.length;
  if (screen.step === "grow" && page === 0) ready = orderedIdeas(content.grow.ideas, draft.ideas).length > 0;
  if (screen.step === "grow" && page === 1) ready = growReady;

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
      const ideas = orderedIdeas(content.grow.ideas, next.ideas);
      const first = growIdea(content.grow.ideas, ideas[0] ?? "");
      next.ideas = ideas;
      next.idea = ideas[0] ?? "";
      next.option = "";
      next.success = "";
      next.start = first?.start ?? "";
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
    body = (
      <>
        <p className={`mt-3 ${LESSON_BODY}`}>{content.grow.context}</p>
        <ScreenGuidance flush>{content.grow.guidance}</ScreenGuidance>
        <ScreenPrompt tone="question" flush>{content.grow.question}</ScreenPrompt>
        <div className="mt-[21px]">
          <ScreenPrompt tone="section" flush className="!mt-0">{content.grow.salesLabel}</ScreenPrompt>
          {content.grow.ideas.filter((row) => row.group === "sales").map((row) => {
            const on = draft.ideas.includes(row.id);
            const full = !on && orderedIdeas(content.grow.ideas, draft.ideas).length >= 3;
            return <Lined key={row.id} item={row} selected={on} muted={full} onClick={() => setDraft({ ...draft, ideas: on ? draft.ideas.filter((id) => id !== row.id) : [...draft.ideas, row.id] })} />;
          })}
        </div>
        <div className="mt-[21px]">
          <ScreenPrompt tone="section" flush className="!mt-0">{content.grow.serviceLabel}</ScreenPrompt>
          {content.grow.ideas.filter((row) => row.group === "service").map((row) => {
            const on = draft.ideas.includes(row.id);
            const full = !on && orderedIdeas(content.grow.ideas, draft.ideas).length >= 3;
            return <Lined key={row.id} item={row} selected={on} muted={full} onClick={() => setDraft({ ...draft, ideas: on ? draft.ideas.filter((id) => id !== row.id) : [...draft.ideas, row.id] })} />;
          })}
        </div>
      </>
    );
  } else if (page === 1 && idea) {
    const options = idea.id === "expand" ? expandJobsFor(idea.options, cohort) : idea.options;
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
          {content.grow.tryStarting}{" "}
          <StartPick
            value={draft.start || idea.start}
            label={content.grow.startFieldLabel}
            options={content.grow.startOptions}
            onChange={(id) => setDraft({ ...draft, start: id as StartId })}
          />
          {content.grow.period}
        </p>
        <ScreenPrompt tone="section" flush className="!mt-2">{content.grow.success}</ScreenPrompt>
        {idea.success.map((option) => (
          <Lined key={option.id} item={option} selected={draft.success === option.id} onClick={() => setDraft({ ...draft, success: option.id })} />
        ))}
      </>
    );
  } else {
    body = (
      <>
        <ScreenPrompt tone="question" flush className="!mt-3">{content.grow.closerHeadline}</ScreenPrompt>
        <p className={`mt-[21px] ${LESSON_BODY}`}>{content.grow.closerContext}</p>
        <p className={`mt-4 ${LESSON_BODY}`} data-check-in-date="">{checkInLine}</p>
        <p className={`mt-4 ${LESSON_BODY}`}>{content.grow.calendarNote}</p>
        <button
          type="button"
          className="mt-4 h-11 rounded-xl border border-[#D5DAE3] bg-white px-4 font-sans text-[16px] font-semibold leading-[23px] text-[#19347D]"
          onClick={() => void navigator.clipboard?.writeText(checkInClipboard(content.grow.calendarNote, checkInLine))}
        >
          {content.grow.copyLabel}
        </button>
        <p className={`mt-3 ${LESSON_HINT}`}>{content.grow.copyHint}</p>
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
