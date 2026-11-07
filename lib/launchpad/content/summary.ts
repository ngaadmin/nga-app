import type {
  LaunchpadChoiceCaptureScreen,
  LaunchpadTextField,
  LaunchpadFloor,
  LaunchpadGoalLoopScreen,
  LaunchpadShortTextScreen,
  LaunchpadSummarySection,
  LaunchpadSummarySource,
} from "@/lib/launchpad/content/types";
import { fieldsOf, rankingOf, selectionOf, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { displayFieldValue, fieldByName, isFieldValueValid } from "@/lib/launchpad/content/fields";
import { captureScreens, goalLoopGoals, rankItemsFor, type CaptureScreen } from "@/lib/launchpad/content/task-pages";

/**
 * Turns saved answers into the read-only lines a workbook-summary wrap-up and
 * the handbook show. Every section reads only answer keys (no copy of its
 * own), so the wrap-up, the handbook and a future DB read agree.
 */

export type SummaryCatalog = {
  get: (answerKey: string) => CaptureScreen | undefined;
  /** Goal loops with their rank items' authored order. */
  loops: readonly { loop: LaunchpadGoalLoopScreen; items: readonly string[] }[];
};

export function summaryCatalog(floors: readonly LaunchpadFloor[]): SummaryCatalog {
  const screens = captureScreens(floors);
  const loops: { loop: LaunchpadGoalLoopScreen; items: string[] }[] = [];
  for (const f of floors)
    for (const s of f.silvers)
      for (const b of s.bronzes)
        for (const t of b.tasks)
          for (const sc of t.screens) if (sc.type === "goal-loop") loops.push({ loop: sc, items: rankItemsFor(floors, sc.orderFrom) });
  return { get: (k) => screens.get(k), loops };
}

/**
 * Sources that belong to a goal loop follow the learner's goal order, and a
 * goal whose reason is now struck out (or skipped) is left off.
 */
export function orderedSources(sources: readonly LaunchpadSummarySource[], answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog) {
  let out = [...sources];
  for (const { loop, items } of catalog.loops) {
    const all = loop.goals.map((g) => g.screen.answerKey);
    if (!out.some((s) => all.includes(s.answerKey))) continue;
    const shown = goalLoopGoals(loop, answers, items).map((g) => g.screen.answerKey);
    out = out.filter((s) => !all.includes(s.answerKey) || shown.includes(s.answerKey));
    out.sort((a, b) => {
      const ia = shown.indexOf(a.answerKey);
      const ib = shown.indexOf(b.answerKey);
      return ia === -1 || ib === -1 ? 0 : ia - ib;
    });
  }
  return out;
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function optionLabel(catalog: SummaryCatalog, answerKey: string, id: string): string | undefined {
  const screen = catalog.get(answerKey);
  if (screen?.type === "choice-capture") return screen.options.find((o) => o.id === id)?.label;
  if (screen?.type === "rank-order") return screen.items.find((o) => o.id === id)?.label;
  return undefined;
}

/** The chosen option label(s) of a selection, in pick order. */
export function selectionLabels(catalog: SummaryCatalog, answers: LaunchpadAnswers | undefined, answerKey: string): string[] {
  const sel = selectionOf(answers, answerKey);
  return (sel?.selected ?? []).map((id) => optionLabel(catalog, answerKey, id)).filter((l): l is string => !!l);
}

/** Ranked item labels, most important first, not-applicable items left off. */
export function rankedLabels(catalog: SummaryCatalog, answers: LaunchpadAnswers | undefined, answerKey: string): string[] {
  const r = rankingOf(answers, answerKey);
  if (!r) return [];
  return r.order
    .filter((id) => !r.notApplicable.includes(id))
    .map((id) => optionLabel(catalog, answerKey, id))
    .filter((l): l is string => !!l);
}

/**
 * A short-text answer as one sentence ("I want to earn 500 USD by 6 months.").
 * Null when it is marked not applicable, when a required blank is empty, or
 * when every blank is empty. An empty optional blank drops with its connector
 * ("My goal is to save up." when the optional duration is left out).
 * Extra fields follow in brackets when filled.
 */
export type SentencePiece = { text: string; chosen: boolean };

/** A goal sentence split into fixed words and the filled-in blanks. */
export function filledSentencePieces(
  screen: LaunchpadShortTextScreen,
  answers: LaunchpadAnswers | undefined,
  catalog: SummaryCatalog,
): SentencePiece[] | null {
  const answer = fieldsOf(answers, screen.answerKey);
  if (!answer || (answer.notApplicable && screen.notApplicableLabel)) return null;
  const pieces: SentencePiece[] = [];
  const push = (text: string, chosen: boolean) => {
    if (!text) return;
    const prev = pieces[pieces.length - 1];
    if (prev && prev.chosen === chosen) prev.text += text;
    else pieces.push({ text, chosen });
  };
  // Text before an empty optional blank is its connector ("in"), so it is dropped with it.
  let pending = "";
  let any = false;
  let skipped = false;
  // Short joins (" in ") stay with the filled-in words. "to" before the next blank stays plain.
  const flush = () => {
    if (!pending) return;
    if (!any || /[.!?]/.test(pending)) push(pending, false);
    else {
      const split = /^(.*\S)(\s+to\s+)$/.exec(pending);
      if (split) {
        push(split[1]!, true);
        push(split[2]!, false);
      } else push(pending, true);
    }
    pending = "";
  };
  for (const part of screen.parts) {
    if (part.kind === "text") pending += part.text;
    else if (part.kind === "carried") {
      const label = selectionLabels(catalog, answers, part.answerKey)[0];
      if (!label) return null;
      flush();
      push(lowerFirst(label), true);
      any = true;
      skipped = false;
    } else {
      const field = fieldByName(screen, part.field);
      const raw = answer.values[part.field];
      // A defaulted unit (weeks) reads as its default; it drops with an empty number before it.
      const unitAfterSkip = skipped && part.field.endsWith("Unit");
      const shown = field && !unitAfterSkip ? displayFieldValue(field, raw === undefined || raw === "" ? field.defaultValue : raw) : "";
      if (!shown) {
        // A required blank, or the leading blank (the goal itself), left empty: nothing to show.
        if ((!field?.optional && !unitAfterSkip) || !any) return null;
        pending = "";
        skipped = true;
        continue;
      }
      flush();
      push(shown, true);
      any = true;
      skipped = false;
    }
  }
  push(pending, false);
  const extras: string[] = [];
  for (const name of screen.extraFields ?? []) {
    const field = fieldByName(screen, name);
    const shown = field ? displayFieldValue(field, answer.values[name]) : "";
    if (!field || !shown) continue;
    // A unit dropdown reads with the number before it ("3 months").
    if (field.input === "choice" && extras.length && name.endsWith("Unit")) extras[extras.length - 1] += ` ${lowerFirst(shown)}`;
    else extras.push(field.input === "choice" ? shown : `${field.label}: ${shown}`);
  }
  if (extras.length) push(` (${extras.join("; ")})`, true);
  return pieces.length ? pieces : null;
}

export function filledSentence(
  screen: LaunchpadShortTextScreen,
  answers: LaunchpadAnswers | undefined,
  catalog: SummaryCatalog,
): string | null {
  const pieces = filledSentencePieces(screen, answers, catalog);
  if (!pieces) return null;
  const out = pieces
    .map((piece) => piece.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return out || null;
}

function sourceLines(source: LaunchpadSummarySource, section: LaunchpadSummarySection, answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog): string[] {
  const screen = catalog.get(source.answerKey);
  if (!screen) return [];
  switch (section.display) {
    case "list":
    case "choice":
      return selectionLabels(catalog, answers, source.answerKey);
    case "ranked":
      return rankedLabels(catalog, answers, source.answerKey);
    case "text": {
      if (screen.type !== "short-text" || !source.field) return [];
      const answer = fieldsOf(answers, source.answerKey);
      const field = fieldByName(screen, source.field);
      const shown = field && answer && !(answer.notApplicable && screen.notApplicableLabel) ? displayFieldValue(field, answer.values[source.field]) : "";
      return shown ? [shown] : [];
    }
    case "sentences": {
      if (screen.type === "short-text") {
        const line = filledSentence(screen, answers, catalog);
        return line ? [line] : [];
      }
      if (screen.type === "choice-capture") {
        const label = selectionLabels(catalog, answers, source.answerKey)[0];
        return label ? [screen.summaryLabel ? `${screen.summaryLabel}: ${lowerFirst(label)}.` : label] : [];
      }
      return [];
    }
  }
}

/** The lines one section shows (empty when nothing is answered yet). */
export function sectionLines(
  section: LaunchpadSummarySection,
  answers: LaunchpadAnswers | undefined,
  catalog: SummaryCatalog,
): string[] {
  return orderedSources(section.sources, answers, catalog).flatMap((src) => sourceLines(src, section, answers, catalog));
}

/** The lines one source adds to its section. */
export function sourceLinesOf(
  section: LaunchpadSummarySection,
  source: LaunchpadSummarySource,
  answers: LaunchpadAnswers | undefined,
  catalog: SummaryCatalog,
): string[] {
  return sourceLines(source, section, answers, catalog);
}

/** What the wrap-up pencil may change for one source, or null when it is read-only. */
export type SummaryEdit =
  | { kind: "selection"; screen: LaunchpadChoiceCaptureScreen }
  | { kind: "fields"; screen: LaunchpadShortTextScreen; fields: LaunchpadTextField[] };

export function summaryEdit(source: LaunchpadSummarySource, catalog: SummaryCatalog): SummaryEdit | null {
  const screen = catalog.get(source.answerKey);
  if (source.editSelection && screen?.type === "choice-capture") return { kind: "selection", screen };
  if (source.editFields?.length && screen?.type === "short-text") {
    const fields = source.editFields.map((n) => fieldByName(screen, n)).filter((f): f is LaunchpadTextField => !!f);
    return fields.length ? { kind: "fields", screen, fields } : null;
  }
  return null;
}

/** True when an inline edit draft may be saved (same rules as the screen it came from). */
export function isSummaryDraftValid(edit: SummaryEdit, draft: { selected?: readonly string[]; values?: Readonly<Record<string, string | number>> }): boolean {
  if (edit.kind === "selection") {
    const picked = (draft.selected ?? []).filter((id) => edit.screen.options.some((o) => o.id === id));
    return edit.screen.mode === "single" ? picked.length === 1 : picked.length > 0;
  }
  const values = draft.values ?? {};
  return edit.fields.every((f) => {
    const v = values[f.name];
    if (v === undefined || v === "") return !!(edit.screen.optional || f.optional);
    return isFieldValueValid(f, v);
  });
}
