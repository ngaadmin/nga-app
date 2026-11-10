/** A reusable workbook page: headings, sentences with fill-in slots, lists, and one optional large scribble. */
export type ScriptedPart = string | { value: string | null };

export type ScriptedBlock =
  | { kind: "section"; text: string }
  | { kind: "sub"; text: string; /** Channel short name to underline inside the subhead. */ underline?: string }
  | { kind: "paragraph"; parts: readonly ScriptedPart[] }
  | { kind: "list"; items: readonly string[] }
  | { kind: "budget"; heading: string; earnedLabel: string };

export type ScriptedSheet = {
  id: string;
  blocks: readonly ScriptedBlock[];
  /** Approved scribble name, about 80px, right-aligned at the end. */
  largeScribble?: "kit" | "coins" | "growth" | "wallet" | "jar" | "pawtrail";
};
