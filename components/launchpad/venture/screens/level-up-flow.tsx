"use client";

import { useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, selectionOf, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen } from "@/lib/launchpad/content/types";
import {
  addMonths,
  checkInClipboard,
  expandJobsFor,
  fillToken,
  formatCheckInDate,
  paceFor,
  pickedStatements,
  sectionLabel,
  statementsIn,
  type LevelCohort,
  type LevelSectionId,
  type LevelUpIdea,
} from "@/lib/launchpad/content/level-up/model";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { OrderedSlots } from "@/components/launchpad/venture/screens/rank-order-screen";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

function blankAnswer(): LevelUpAnswer {
  return { kind: "level-up", version: 1, selected: [], picks: {}, pace: {}, improvePlan: [], ideas: [] };
}

function planFor(ids: readonly string[]): { statementId: string; week: number }[] {
  return ids.map((statementId, index) => ({ statementId, week: index + 1 }));
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

type GrowRow = { id: string; label: string; offered: boolean };

/** Options the learner can tick: cohort-gated expand jobs, with services they already offer marked. */
function growGroups(ideas: readonly LevelUpIdea[], cohort: LevelCohort, offered: ReadonlySet<string>): { id: string; label: string; options: GrowRow[] }[] {
  return ideas
    .map((idea) => {
      const rows = idea.id === "expand" ? expandJobsFor(idea.options ?? [], cohort) : (idea.options ?? []);
      return {
        id: idea.id,
        label: idea.label,
        options: rows.map((option) => ({ id: option.id, label: option.label, offered: idea.id === "new-service" && offered.has(option.id) })),
      };
    })
    .filter((group) => group.options.length > 0);
}

/** Known option ids only, skipping services already offered. At most three, in tick order. */
function keptGrowPicks(groups: readonly { options: readonly GrowRow[] }[], selected: readonly string[]): string[] {
  const allowed = new Set(groups.flatMap((group) => group.options.filter((option) => !option.offered).map((option) => option.id)));
  const out: string[] = [];
  for (const id of selected) {
    if (!allowed.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * One dropdown of every Grow option, grouped under the idea headings.
 * A native select cannot tick several rows or gray the rest at three,
 * so this uses the box styling from FieldControl and the lined Chip checkbox.
 */
function GroupedTickMenu({
  groups,
  selected,
  onToggle,
}: {
  groups: readonly { id: string; label: string; options: readonly GrowRow[] }[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const summary = groups
    .flatMap((group) => group.options)
    .filter((option) => selected.includes(option.id))
    .map((option) => option.label)
    .join(", ");
  const full = selected.length >= 3;
  return (
    <div className="mt-2" data-grow-menu="" data-open={open ? "true" : "false"}>
      <button
        type="button"
        aria-labelledby={summary ? "grow-question grow-picks" : "grow-question"}
        aria-expanded={open}
        aria-controls="grow-options"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[42px] w-full items-center gap-2 rounded-xl bg-white px-3 py-2 text-left font-sans text-[18px] font-medium leading-[26px] text-[#19347D] shadow-[inset_0_0_0_1.5px_#C5D4EA] outline-none focus-visible:shadow-[inset_0_0_0_2px_#3FB7DA]"
      >
        <span id={summary ? "grow-picks" : undefined} className="min-w-0 flex-1 font-normal">{summary}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="shrink-0">
          <path d="M1 1l4 4 4-4" fill="none" stroke="#19347D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div id="grow-options" className="mt-2 rounded-xl bg-white px-3 py-1 shadow-[inset_0_0_0_1.5px_#C5D4EA]">
          {groups.map((group) => (
            <div key={group.id}>
              <ScreenPrompt tone="section" flush className="!mt-3">{group.label}</ScreenPrompt>
              {group.options.map((option) => {
                const on = selected.includes(option.id);
                return (
                  <Chip
                    key={option.id}
                    variant="lined"
                    label={option.label}
                    selected={on}
                    muted={option.offered || (!on && full)}
                    onClick={() => onToggle(option.id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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
  const total = screen.step === "improve" ? pickPages + (planAvailable ? 1 : 0) : screen.step === "reflect" ? pickPages : 2;
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
  const groups = growGroups(content.grow.ideas ?? [], cohort, offered);
  const kept = keptGrowPicks(groups, draft.ideas);

  let ready = true;
  if (screen.step === "improve" && page < pickPages) ready = improvePicksReady([sections[page]!.id]);
  if (screen.step === "improve" && page === pickPages) ready = chosenItems.length > 0 && chosenItems.every((item) => draft.improvePlan.some((row) => row.statementId === item.id)) && draft.improvePlan.length === chosenItems.length;
  if (screen.step === "grow" && page === 0) ready = kept.length > 0;

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
    if (screen.step === "grow") next.ideas = kept;
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
        <ScreenPrompt id="grow-question" tone="question" flush className="!mt-3">{content.grow.question}</ScreenPrompt>
        <div className="mt-[21px]">
          <ScreenGuidance flush>{content.grow.guidance}</ScreenGuidance>
          <GroupedTickMenu
            groups={groups}
            selected={kept}
            onToggle={(id) => {
              if (kept.includes(id)) setDraft({ ...draft, ideas: kept.filter((item) => item !== id) });
              else if (kept.length < 3) setDraft({ ...draft, ideas: [...kept, id] });
            }}
          />
        </div>
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
