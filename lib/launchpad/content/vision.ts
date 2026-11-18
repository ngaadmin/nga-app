import { parseSentence, type ParsedSentence } from "@/lib/launchpad/load/sentence";
import { fieldsOf, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { filledSentence, filledSentencePieces, rankedLabels, selectionLabels, type SummaryCatalog } from "@/lib/launchpad/content/summary";
import { goalLoopGoals } from "@/lib/launchpad/content/task-pages";
import type { LaunchpadVisionSpec } from "@/lib/launchpad/content/types";

/**
 * The compiled vision sentence (tracker H19/I19). Reads saved answers only.
 * A required token left empty means the whole sentence is not ready (null);
 * an optional "[[ ]]" clause is dropped whole when any token inside is empty.
 */

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** "a", "a and b", "a, b and c". */
export function naturalList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Every token's value for one learner ("" when empty). */
export function visionTokens(spec: LaunchpadVisionSpec, answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog): Record<string, string> {
  const percent = fieldsOf(answers, spec.causeGoalKey)?.values[spec.causePercentField];
  const pct = typeof percent === "number" ? percent : Number(String(percent ?? "").trim());
  const loop = catalog.loops.find((l) => l.loop.id === spec.goalLoopId);
  const goals = loop
    ? goalLoopGoals(loop.loop, answers, loop.items)
        .filter((g) => g.screen.answerKey !== spec.causeGoalKey)
        .map((g) => (g.screen.type === "short-text" ? filledSentence(g.screen, answers, catalog) : null))
        .filter((s): s is string => !!s)
    : [];
  return {
    "business-type": spec.businessType.trim().toLowerCase(),
    "offer-list": naturalList(selectionLabels(catalog, answers, spec.offerKey).map(lowerFirst)),
    "why-list": naturalList(rankedLabels(catalog, answers, spec.whyKey).map(lowerFirst)),
    cause: lowerFirst(selectionLabels(catalog, answers, spec.causeKey)[0] ?? ""),
    "cause-percent": Number.isFinite(pct) && pct > 0 ? String(pct) : "",
    "goal-list": goals.join(" "),
  };
}

/** Fills a parsed template; null when a token in it is empty. */
function fill(parsed: ParsedSentence, tokens: Record<string, string>): string | null {
  let out = "";
  for (const t of parsed.tokens) {
    if (t.kind === "text") out += t.text;
    else if (t.slot.kind === "optional") out += fill(t.slot.inner, tokens) ?? "";
    else if (t.slot.kind === "token") {
      const v = tokens[t.slot.token];
      if (!v) return null;
      out += v;
    } else out += t.slot.raw;
  }
  return out;
}

export function compileVisionTemplate(template: string, tokens: Record<string, string>): string | null {
  const s = fill(parseSentence(template), tokens);
  return s ? s.replace(/\s+/g, " ").trim() : null;
}

export function compileVision(spec: LaunchpadVisionSpec, answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog): string | null {
  return compileVisionTemplate(spec.template, visionTokens(spec, answers, catalog));
}

export type VisionPiece = { text: string; chosen: boolean };

function listPieces(items: readonly string[]): VisionPiece[] | null {
  if (items.length === 0) return null;
  const pieces: VisionPiece[] = [];
  items.forEach((item, index) => {
    if (index > 0) pieces.push({ text: index === items.length - 1 ? " and " : ", ", chosen: false });
    pieces.push({ text: item, chosen: true });
  });
  return pieces;
}

function goalPieces(spec: LaunchpadVisionSpec, answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog): VisionPiece[] | null {
  const loop = catalog.loops.find((item) => item.loop.id === spec.goalLoopId);
  if (!loop) return null;
  const pieces: VisionPiece[] = [];
  for (const goal of goalLoopGoals(loop.loop, answers, loop.items)) {
    if (goal.screen.answerKey === spec.causeGoalKey || goal.screen.type !== "short-text") continue;
    const bits = filledSentencePieces(goal.screen, answers, catalog);
    if (!bits) continue;
    if (pieces.length) pieces.push({ text: " ", chosen: false });
    pieces.push(...bits);
  }
  return pieces.length ? pieces : null;
}

function fillPieces(parsed: ParsedSentence, slots: Record<string, VisionPiece[] | null>): VisionPiece[] | null {
  const out: VisionPiece[] = [];
  for (const token of parsed.tokens) {
    if (token.kind === "text") {
      out.push({ text: token.text, chosen: false });
      continue;
    }
    if (token.slot.kind === "optional") {
      const inner = fillPieces(token.slot.inner, slots);
      if (inner) out.push(...inner);
      continue;
    }
    if (token.slot.kind !== "token") return null;
    const piece = slots[token.slot.token];
    if (!piece) return null;
    out.push(...piece);
  }
  return out;
}

/**
 * The vision sentence as plain words plus the filled-in slots.
 * Joining the pieces matches compileVision. Null until every required slot is filled.
 */
export function visionPieces(spec: LaunchpadVisionSpec, answers: LaunchpadAnswers | undefined, catalog: SummaryCatalog): VisionPiece[] | null {
  const percent = fieldsOf(answers, spec.causeGoalKey)?.values[spec.causePercentField];
  const pct = typeof percent === "number" ? percent : Number(String(percent ?? "").trim());
  const slots: Record<string, VisionPiece[] | null> = {
    "business-type": spec.businessType.trim() ? [{ text: spec.businessType.trim().toLowerCase(), chosen: true }] : null,
    "offer-list": listPieces(selectionLabels(catalog, answers, spec.offerKey).map(lowerFirst)),
    "why-list": listPieces(rankedLabels(catalog, answers, spec.whyKey).map(lowerFirst)),
    cause: selectionLabels(catalog, answers, spec.causeKey)[0] ? [{ text: lowerFirst(selectionLabels(catalog, answers, spec.causeKey)[0]!), chosen: true }] : null,
    "cause-percent": Number.isFinite(pct) && pct > 0 ? [{ text: String(pct), chosen: true }] : null,
    "goal-list": goalPieces(spec, answers, catalog),
  };
  const pieces = fillPieces(parseSentence(spec.template), slots);
  if (!pieces) return null;
  const tightened = tightenPieces(pieces);
  if (!tightened.length) return null;
  return tightened;
}

/** One space where an omitted clause used to sit, and no leading or trailing space. */
function tightenPieces(pieces: readonly VisionPiece[]): VisionPiece[] {
  const out: VisionPiece[] = [];
  for (const piece of pieces) {
    const prev = out[out.length - 1];
    let text = piece.text;
    if (prev && /\s$/.test(prev.text) && /^\s/.test(text)) text = text.replace(/^\s+/, "");
    if (!text) continue;
    out.push({ text, chosen: piece.chosen });
  }
  if (out[0]) out[0] = { ...out[0], text: out[0].text.replace(/^\s+/, "") };
  const last = out.length - 1;
  if (last >= 0 && out[last]) out[last] = { ...out[last], text: out[last].text.replace(/\s+$/, "") };
  return out.filter((piece) => piece.text.length > 0);
}
