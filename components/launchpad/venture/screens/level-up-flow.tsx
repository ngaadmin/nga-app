"use client";

import { useRef, useState, type ReactNode } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { levelUpOf, offerOf, selectionOf, type GrowPlan, type LevelUpAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
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
  const [draft, setDraft] = useState<LevelUpAnswer>(saved);
  const writtenDates = useRef(new Map(saved.growPlans.filter((row) => row.checkIn && row.checkInDate).map((row) => [row.idea, { checkIn: row.checkIn, checkInDate: row.checkInDate }])));
  const pickPages = sections.length;
  const weekLabels = content.improve.weekLabels ?? [];
  const planAvailable = Boolean(content.improve.planHeader && weekLabels.length > 0);
  const growIdeas = orderedIdeas(content.grow.ideas ?? [], draft.ideas);
  const growDetail = Boolean(content.grow.startOptions?.length && content.grow.checkInOptions?.length && growIdeas.every((idea) => idea.successLine));
  const growTotal = 1 + (growDetail ? growIdeas.length : 0) + 1;
  const total = screen.step === "improve" ? pickPages + (planAvailable ? 1 : 0) : screen.step === "reflect" ? pickPages : growTotal;
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
  const currentIdea = growDetail && page > 0 && page <= growIdeas.length ? growIdeas[page - 1] : undefined;
  const currentPlan = currentIdea ? planForIdea(draft.growPlans, currentIdea.id) : undefined;

  let ready = true;
  if (screen.step === "improve" && page < pickPages) ready = improvePicksReady([sections[page]!.id]);
  if (screen.step === "improve" && page === pickPages) ready = chosenItems.length > 0 && chosenItems.every((item) => draft.improvePlan.some((row) => row.statementId === item.id)) && draft.improvePlan.length === chosenItems.length;
  if (screen.step === "grow" && page === 0) ready = growIdeas.length > 0;
  if (currentIdea && currentPlan) {
    const visible = new Set((currentIdea.id === "expand" ? expandJobsFor(currentIdea.options, cohort) : currentIdea.options).map((option) => option.id));
    const blocked = currentIdea.id === "new-service" ? offered : new Set<string>();
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
        <ScreenPrompt id="grow-question" tone="question" flush className="!mt-3">{content.grow.question}</ScreenPrompt>
        {content.grow.context ? <p className={`mt-[21px] ${LESSON_BODY}`}>{content.grow.context}</p> : null}
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
  } else if (currentIdea && currentPlan) {
    const visible = currentIdea.id === "expand" ? expandJobsFor(currentIdea.options, cohort) : currentIdea.options;
    const [before, after] = (currentIdea.successLine ?? "").split("{count}");
    const field: LaunchpadTextField = { name: "success", input: "integer", label: content.grow.successFieldLabel ?? "", min: 1, max: 999 };
    const patch = (plan: GrowPlan) => setDraft({ ...draft, growPlans: writePlan(draft.growPlans, plan) });
    body = (
      <>
        <ScreenPrompt tone="section" flush className="!mt-3">{currentIdea.label}</ScreenPrompt>
        {content.grow.optionPrompt ? <ScreenGuidance flush>{content.grow.optionPrompt}</ScreenGuidance> : null}
        {visible.map((option) => {
          const blocked = currentIdea.id === "new-service" && offered.has(option.id);
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
