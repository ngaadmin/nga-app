"use client";

import { useState } from "react";
import type { LaunchpadFloor, LaunchpadSummarySection, LaunchpadSummarySource, LaunchpadSummaryWrapUp } from "@/lib/launchpad/content/types";
import { fieldsAnswer, fieldsOf, selectionAnswer, selectionOf, type LaunchpadAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import {
  isSummaryDraftValid,
  orderedSources,
  sourceLinesOf,
  summaryCatalog,
  summaryEdit,
  type SummaryCatalog,
  type SummaryEdit,
} from "@/lib/launchpad/content/summary";
import { AccentLabel, BinderCard, HandRule, PAPER_ACCENT, TagChip } from "@/components/launchpad/venture/handbook/paper-art";
import { BTN_CYAN, BTN_PRIMARY, PRIMARY_LABEL, continueCopy, BTN_WHITE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { toggleChoice } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { applyFieldChange } from "@/lib/launchpad/content/fields";
import { OpenSteps, OpenStepsHint, type OpenStep } from "@/components/launchpad/venture/open-steps";

function Pencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}

type Draft = { selected?: string[]; values?: Record<string, string | number> };

function draftFor(edit: SummaryEdit, answers: LaunchpadAnswers, answerKey: string): Draft {
  if (edit.kind === "selection") return { selected: [...(selectionOf(answers, answerKey)?.selected ?? [])] };
  return { values: { ...(fieldsOf(answers, answerKey)?.values ?? {}) } };
}

/** The inline editor for one source: the same choices or blanks as its screen, with Save and Cancel. */
function InlineEditor({
  edit,
  source,
  caption,
  answers,
  onSave,
  onCancel,
}: {
  edit: SummaryEdit;
  source: LaunchpadSummarySource;
  caption?: string;
  answers: LaunchpadAnswers;
  onSave: (answer: LaunchpadAnswer) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFor(edit, answers, source.answerKey));
  const valid = isSummaryDraftValid(edit, draft);
  return (
    <div className="mt-2 flex flex-col gap-2.5 rounded-2xl bg-[#F7FAFD] p-3" data-inline-editor={source.answerKey}>
      {caption && <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">{caption}</p>}
      {edit.kind === "selection" ? (
        <div role="group" aria-label={edit.screen.prompt} className="flex flex-col gap-2">
          {edit.screen.options.map((o) => (
            <LessonChoiceButton
              key={o.id}
              selected={(draft.selected ?? []).includes(o.id)}
              onClick={() => setDraft({ selected: toggleChoice(edit.screen.mode, draft.selected ?? [], o.id) })}
              className="!min-h-[46px] !text-[15px]"
            >
              {o.label}
            </LessonChoiceButton>
          ))}
        </div>
      ) : (
        edit.fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1 text-[13px] font-semibold text-nga-slate">
            {f.label}
            <FieldControl
              field={f}
              value={draft.values?.[f.name]}
              onChange={(v) => setDraft({ values: applyFieldChange(edit.fields, draft.values ?? {}, f.name, v) })}
              block
              idPrefix={`edit-${source.answerKey}`}
            />
          </label>
        ))
      )}
      {!valid && (
        <p className="text-[12.5px] text-nga-slate" data-edit-hint="">
          {edit.kind === "selection" ? (edit.screen.mode === "single" ? "Pick one to save." : "Pick at least one to save.") : "Fill in each box to save."}
        </p>
      )}
      <div className="flex gap-2.5">
        <button type="button" onClick={onCancel} className={`${BTN_WHITE} flex-1 !py-2 !text-[15px]`}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            if (edit.kind === "selection") onSave(selectionAnswer(draft.selected ?? []));
            else onSave(fieldsAnswer({ ...(fieldsOf(answers, source.answerKey)?.values ?? {}), ...(draft.values ?? {}) }));
          }}
          className={`${BTN_CYAN} flex-1 !py-2 !text-[15px] disabled:opacity-50`}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function PencilButton({ label, onClick, expanded }: { label: string; onClick: () => void; expanded?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className="-mr-2 flex size-9 flex-none items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3EEE4]"
      data-pencil=""
    >
      <Pencil />
    </button>
  );
}

/** Caption over a goal's editor: the goal title from the loop. */
function goalTitle(catalog: SummaryCatalog, answerKey: string): string | undefined {
  for (const { loop } of catalog.loops) {
    const g = loop.goals.find((x) => x.screen.answerKey === answerKey);
    if (g) return g.title;
  }
  return undefined;
}

/** A section's lines on the binder page (wrapup-binder-r1 screen B): chips, accent numbers, a big line, or plain sentences. */
function PaperLines({ display, lines }: { display: LaunchpadSummarySection["display"]; lines: readonly string[] }) {
  if (display === "list") {
    const sentence = lines.length < 2 ? (lines[0] ?? "") : lines.length === 2 ? `${lines[0]} and ${lines[1]}` : `${lines.slice(0, -1).join(", ")}, and ${lines[lines.length - 1]}`;
    return <p className="mt-2.5 text-[15px] leading-snug text-[#19347D]">{sentence}</p>;
  }
  if (display === "ranked")
    return (
      <ol className="mt-2 text-[14px] leading-[1.75]">
        {lines.map((l, i) => (
          <li key={i} className="flex">
            <span className="w-[18px] flex-none font-semibold" style={{ color: PAPER_ACCENT }}>
              {i + 1}
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    );
  if (display === "text")
    return (
      <div className="mt-2 font-heading text-[15px] font-medium leading-[1.4]">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    );
  return (
    <div className="text-[14px] leading-[1.45]">
      {lines.map((l, i) => (
        <p key={i} className="mt-2">
          {l}
        </p>
      ))}
    </div>
  );
}

/**
 * One section on the binder page: swash label, one pencil, the content, and
 * a hand-drawn divider before the next section. No boxes. Also drawn on an
 * editable handbook page (AC14 removed the wrap-ups, so the handbook is
 * where AA's inline edits live).
 */
export function BinderSection({
  section,
  first,
  answers,
  catalog,
  editing,
  setEditing,
  setAnswer,
}: {
  section: LaunchpadSummarySection;
  first: boolean;
  answers: LaunchpadAnswers;
  catalog: SummaryCatalog;
  editing: string | null;
  setEditing: (key: string | null) => void;
  setAnswer: (answerKey: string, answer: LaunchpadAnswer) => void;
}) {
  const sources = orderedSources(section.sources, answers, catalog);
  const rows = sources.map((src) => ({ src, lines: sourceLinesOf(section, src, answers, catalog), edit: summaryEdit(src, catalog) }));
  const empty = rows.every((r) => !r.lines.length);
  const editor = (src: LaunchpadSummarySource, edit: SummaryEdit, caption?: string) => (
    <InlineEditor
      key={`${section.id}-${src.answerKey}`}
      edit={edit}
      source={src}
      caption={caption}
      answers={answers}
      onCancel={() => setEditing(null)}
      onSave={(a) => {
        setAnswer(src.answerKey, a);
        setEditing(null);
      }}
    />
  );
  const editKey = (src: LaunchpadSummarySource) => `${section.id}:${src.answerKey}:${src.field ?? ""}`;
  // A sentences section (the goals) edits line by line: its one pencil opens a pick of which line to change.
  // The others edit as one block from the section's pencil.
  const perLine = section.display === "sentences";
  const pickKey = `pick:${section.id}`;
  const lineEdits = perLine ? rows.filter((r) => r.edit && r.lines.length) : [];
  const sectionEdit = !perLine ? rows.find((r) => r.edit && r.lines.length) : undefined;
  const picking = editing === pickKey;
  const lineOpen = perLine && rows.some((r) => editing === editKey(r.src));
  return (
    <div data-summary-section={section.id}>
      {!first && <HandRule className="mb-2.5 mt-3.5" />}
      <div className="flex items-center justify-between gap-2">
        <AccentLabel>{section.label}</AccentLabel>
        {sectionEdit && editing !== editKey(sectionEdit.src) && (
          <PencilButton label={`Edit ${section.label}`} onClick={() => setEditing(editKey(sectionEdit.src))} />
        )}
        {lineEdits.length > 0 && !lineOpen && (
          <PencilButton label={`Edit ${section.label}`} expanded={picking} onClick={() => setEditing(picking ? null : pickKey)} />
        )}
      </div>
      {empty && <p className="mt-2 text-[14px] italic text-[#9CA3AF]">Not answered yet</p>}
      {perLine ? (
        <ul className="flex flex-col">
          {rows.flatMap((r) =>
            r.lines.map((line, i) => {
              const open = editing === editKey(r.src);
              const caption = goalTitle(catalog, r.src.answerKey);
              return (
                <li key={`${r.src.answerKey}-${i}`} className="mt-2 flex flex-col" data-summary-line={r.src.answerKey}>
                  <div className="flex items-start gap-2">
                    <span className="flex-1 text-[14px] leading-[1.45]">{line}</span>
                    {picking && r.edit && i === 0 && (
                      <button
                        type="button"
                        onClick={() => setEditing(editKey(r.src))}
                        aria-label={`Edit ${caption ?? section.label}`}
                        className="-my-1 flex h-8 flex-none items-center gap-1 rounded-lg px-2 text-[12.5px] font-semibold text-nga-secondary-shadow shadow-[inset_0_0_0_1px_#E5E7EB]"
                        data-pencil=""
                      >
                        <Pencil />
                        Edit
                      </button>
                    )}
                  </div>
                  {open && r.edit && editor(r.src, r.edit, caption)}
                </li>
              );
            }),
          )}
        </ul>
      ) : (
        <>
          <PaperLines display={section.display} lines={rows.flatMap((r) => r.lines)} />
          {sectionEdit && editing === editKey(sectionEdit.src) && sectionEdit.edit && editor(sectionEdit.src, sectionEdit.edit)}
        </>
      )}
    </div>
  );
}

/**
 * Silver wrap-up "workbook-summary": the silver's answers as one workbook
 * page on the shared binder card (wrapup-binder-r1 screen B): each section is a
 * swash label, its content and a hand-drawn divider, with one pencil per section
 * that edits a value in place on the page
 * (no navigating back) when the content marks it editable; values whose
 * edit would rewire another screen (the why ranking, the cause, the
 * currency) stay read-only. Continue goes on.
 */
export function SummaryWrapUp({
  level,
  silverTitle,
  wrapUp,
  floors,
  answers,
  setAnswer,
  onBuilding,
  onCorridor,
  onFinalize,
  openSteps = [],
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadSummaryWrapUp;
  /** Steps left open ("Come back to this later"): listed, and the confirm button stays off until they are done. */
  openSteps?: readonly OpenStep[];
  floors: readonly LaunchpadFloor[];
  answers: LaunchpadAnswers;
  setAnswer: (answerKey: string, answer: LaunchpadAnswer) => void;
  onBuilding: () => void;
  onCorridor: () => void;
  onFinalize: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const catalog = summaryCatalog(floors);
  return (
    <section className="flex flex-1 flex-col" data-wrap-up="workbook-summary">
      <TrailCrumb level={level} current={silverTitle} onBuilding={onBuilding} onCorridor={onCorridor} />
      <Heading>{wrapUp.heading}</Heading>
      {wrapUp.body && <SubLine className="mb-3">{continueCopy(wrapUp.body)}</SubLine>}
      <BinderCard className="mt-1" data-workbook-binder="">
        {wrapUp.sections.map((section, i) => (
          <BinderSection
            key={section.id}
            section={section}
            first={i === 0}
            answers={answers}
            catalog={catalog}
            editing={editing}
            setEditing={setEditing}
            setAnswer={setAnswer}
          />
        ))}
      </BinderCard>
      <OpenSteps steps={openSteps} />
      <div className="mx-5 mt-auto pb-4 pt-5">
        <OpenStepsHint count={openSteps.length} id="wrap-up-open-hint" />
        <button
          type="button"
          className={`${BTN_PRIMARY} disabled:opacity-50`}
          onClick={onFinalize}
          disabled={openSteps.length > 0}
          aria-describedby={openSteps.length > 0 ? "wrap-up-open-hint" : undefined}
        >
          {PRIMARY_LABEL}
        </button>
      </div>
    </section>
  );
}
