/**
 * Splits a tracker Question cell (column H) into fixed text and slots.
 *
 *   "___ [hint]"   a blank with a square-bracket hint ("___ [number]")
 *   "___"          a blank with no hint (the last field of a sentence)
 *   "[word]"       a bracket field ("[amount]", "[free text]")
 *   "[a/b]"        a bracket choice ("[weeks/months]", "[Yes/No]")
 *   "{token}"      a skin token filled from the venture ("{product}")
 *
 * "Your paragraph:" and "Starter:" prefixes become the prompt line; any
 * sentence before "Starter:" is the prompt.
 */

export type SentenceSlot =
  | { kind: "blank"; hint?: string; raw: string }
  | { kind: "bracket"; label: string; choices?: string[]; raw: string }
  | { kind: "token"; token: string; raw: string };

export type SentenceToken = { kind: "text"; text: string } | { kind: "slot"; index: number; slot: SentenceSlot };

export type ParsedSentence = {
  /** Line above the sentence ("Your paragraph", or the text before "Starter:"). */
  prompt?: string;
  tokens: SentenceToken[];
  slots: SentenceSlot[];
};

const SLOT_RE = /___(?:\s*\[([^\]]+)\])?|\[([^\]]+)\]|\{([a-z][a-z-]*)\}/g;

export function parseSentence(cell: string): ParsedSentence {
  let body = cell.trim();
  let prompt: string | undefined;
  const starter = /^([\s\S]*?)\s*Starter:\s*([\s\S]*)$/.exec(body);
  if (starter) {
    prompt = starter[1]!.trim() || undefined;
    body = starter[2]!.trim();
  }
  const para = /^Your paragraph:\s*([\s\S]*)$/.exec(body);
  if (para) {
    prompt = "Your paragraph";
    body = para[1]!.trim();
  }
  const tokens: SentenceToken[] = [];
  const slots: SentenceSlot[] = [];
  let last = 0;
  for (const m of body.matchAll(SLOT_RE)) {
    if (m.index! > last) tokens.push({ kind: "text", text: body.slice(last, m.index) });
    let slot: SentenceSlot;
    if (m[0].startsWith("___")) slot = { kind: "blank", raw: m[0], ...(m[1] ? { hint: m[1].replace(/^e\.g\.\s*/, "").trim() } : {}) };
    else if (m[2] !== undefined) {
      const label = m[2].trim();
      const parts = label.split("/").map((p) => p.trim()).filter(Boolean);
      slot = { kind: "bracket", label, raw: m[0], ...(parts.length > 1 ? { choices: parts } : {}) };
    } else slot = { kind: "token", token: m[3]!, raw: m[0] };
    tokens.push({ kind: "slot", index: slots.length, slot });
    slots.push(slot);
    last = m.index! + m[0].length;
  }
  if (last < body.length) tokens.push({ kind: "text", text: body.slice(last) });
  return { ...(prompt ? { prompt } : {}), tokens, slots };
}

/** "Manage bookings for others" -> "manage-bookings-for-others". */
export function kebab(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "dog walking" -> "Dog walking". */
export function sentenceCase(label: string): string {
  const t = label.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/**
 * The option list in a Data Input cell, e.g. "Options: a, b, c." or
 * "Single select: a, b, c." or "...not the payload: a, b, c." Items split on
 * commas or semicolons; the list ends at the first full stop that is followed
 * by a space and a capital (the next sentence).
 */
export function optionsAfter(cell: string, marker: RegExp): string[] {
  const m = marker.exec(cell);
  if (!m) return [];
  const rest = cell.slice(m.index + m[0].length);
  const end = /\.(\s+[A-Z]|\s*$)/.exec(rest);
  const listText = end ? rest.slice(0, end.index) : rest;
  return listText
    .split(/[;,]/)
    .map((s) => s.trim().replace(/^and\s+/, ""))
    .filter(Boolean);
}
