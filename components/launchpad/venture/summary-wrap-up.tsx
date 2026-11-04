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
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { BTN_CYAN, BTN_ORANGE, BTN_WHITE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { toggleChoice } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { SummaryLines } from "@/components/launchpad/venture/summary-lines";

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
              onChange={(v) => setDraft({ values: { ...(draft.values ?? {}), [f.name]: v } })}
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

function PencilButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 flex-none items-center justify-center rounded-full text-nga-secondary-shadow hover:bg-[#EEF7FB]"
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

function SectionCard({
  section,
  answers,
  catalog,
  editing,
  setEditing,
  setAnswer,
}: {
  section: LaunchpadSummarySection;
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
  // A sentences section edits line by line; the others edit as one block.
  const perLine = section.display === "sentences";
  const sectionEdit = !perLine ? rows.find((r) => r.edit && r.lines.length) : undefined;
  return (
    <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white px-4 py-3" data-summary-section={section.id}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-[13px] font-bold uppercase tracking-[0.06em] text-nga-secondary-shadow">{section.label}</h3>
        {sectionEdit && editing !== editKey(sectionEdit.src) && (
          <PencilButton label={`Edit ${section.label}`} onClick={() => setEditing(editKey(sectionEdit.src))} />
        )}
      </div>
      {empty && <p className="mt-1 text-[15px] italic text-nga-slate">Not answered yet</p>}
      {perLine ? (
        <ul className="mt-1 flex flex-col gap-1.5">
          {rows.flatMap((r) =>
            r.lines.map((line, i) => {
              const open = editing === editKey(r.src);
              const caption = goalTitle(catalog, r.src.answerKey);
              return (
                <li key={`${r.src.answerKey}-${i}`} className="flex flex-col" data-summary-line={r.src.answerKey}>
                  <div className="flex items-start gap-2">
                    <span className="mt-[10px] size-1.5 flex-none rounded-full bg-nga-secondary" aria-hidden="true" />
                    <span className="flex-1 text-[15.5px] leading-[1.45] text-nga-ink">{line}</span>
                    {r.edit && i === 0 && !open && <PencilButton label={`Edit ${caption ?? section.label}`} onClick={() => setEditing(editKey(r.src))} />}
                  </div>
                  {open && r.edit && editor(r.src, r.edit, caption)}
                </li>
              );
            }),
          )}
        </ul>
      ) : (
        <>
          <SummaryLines display={section.display} lines={rows.flatMap((r) => r.lines)} className="mt-1 text-[15.5px] leading-[1.45] text-nga-ink" />
          {sectionEdit && editing === editKey(sectionEdit.src) && sectionEdit.edit && editor(sectionEdit.src, sectionEdit.edit)}
        </>
      )}
    </div>
  );
}

/**
 * Silver wrap-up "workbook-summary": the silver's answers as one workbook
 * page, one card per section. A pencil edits a value in place on the card
 * (no navigating back) when the content marks it editable; values whose
 * edit would rewire another screen (the why ranking, the cause, the
 * currency) stay read-only. Finalize goes on.
 * The frame is a PLACEHOLDER pending wrap-up art.
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
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadSummaryWrapUp;
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
      {wrapUp.body && <SubLine className="mb-3">{wrapUp.body}</SubLine>}
      <div
        className="relative mx-5 mt-1 flex flex-col gap-3 rounded-3xl bg-[#F9FAFB] px-3 pb-3 pt-7"
        style={wrapUp.placeholder ? { border: `2px dashed ${VT.panel}` } : undefined}
        data-placeholder-frame={wrapUp.placeholder ? "" : undefined}
      >
        {wrapUp.placeholder && <span className="absolute right-3 top-2 font-heading text-[11px] font-semibold text-nga-slate">Frame art TBC</span>}
        {wrapUp.sections.map((section) => (
          <SectionCard key={section.id} section={section} answers={answers} catalog={catalog} editing={editing} setEditing={setEditing} setAnswer={setAnswer} />
        ))}
      </div>
      <div className="mx-5 mt-auto pb-4 pt-5">
        <button type="button" className={`${BTN_ORANGE} w-full`} onClick={onFinalize}>
          {wrapUp.finalizeLabel}
        </button>
      </div>
    </section>
  );
}
