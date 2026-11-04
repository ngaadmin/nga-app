import { parseSentence, type ParsedSentence } from "@/lib/launchpad/load/sentence";
import { fieldsOf, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { filledSentence, rankedLabels, selectionLabels, type SummaryCatalog } from "@/lib/launchpad/content/summary";
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
