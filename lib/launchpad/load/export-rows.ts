import type { LaunchpadLoadFile, LoadRowMeta } from "@/lib/launchpad/load/types";

/** One row per screen, for the review spreadsheet. */
export const LOAD_EXPORT_COLUMNS = [
  "level",
  "silver id",
  "silver title",
  "bronze id",
  "bronze title",
  "task id",
  "screen index",
  "screen id",
  "template",
  "context",
  "guidance",
  "question",
  "options (id: label)",
  "answer key",
  "answer fields (name: type)",
  "validation (limits, caps)",
  "feeds (reads from)",
  "feeds into",
  "source row",
  "flags",
] as const;

export type LoadExportRow = Record<(typeof LOAD_EXPORT_COLUMNS)[number], string | number>;

function cells(
  level: number,
  silver: { id: string; title: string },
  bronze: { id: string; title: string } | null,
  taskId: string,
  m: LoadRowMeta,
): LoadExportRow {
  return {
    level,
    "silver id": silver.id,
    "silver title": silver.title,
    "bronze id": bronze?.id ?? "",
    "bronze title": bronze?.title ?? "",
    "task id": taskId,
    "screen index": m.index,
    "screen id": m.screenId,
    template: m.template,
    context: m.context ?? "",
    guidance: m.guidance ?? "",
    question: m.question ?? "",
    "options (id: label)": (m.options ?? []).map((o) => `${o.id}: ${o.label}`).join("\n"),
    "answer key": m.answer?.answerKey ?? "",
    "answer fields (name: type)": (m.answer?.fields ?? [])
      .map((f) => `${f.name}: ${f.type}${f.required ? "" : " (optional)"}`)
      .join("\n"),
    "validation (limits, caps)": m.validation.join("\n"),
    "feeds (reads from)": m.feeds.map((f) => `${f.answerKey} (${f.use})`).join("\n"),
    "feeds into": m.feedsInto.join("\n"),
    "source row": m.sourceRow,
    flags: m.flags.join(", "),
  };
}

export function loadExportRows(load: LaunchpadLoadFile): LoadExportRow[] {
  const out: LoadExportRow[] = [];
  for (const l of load.levels) {
    for (const s of l.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) for (const sc of t.screens) out.push(cells(l.level, s, b, t.id, sc));
      for (const r of s.lockedRows ?? []) out.push(cells(l.level, s, null, r.screenId, r));
      if (s.wrapUp) out.push(cells(l.level, s, null, "", s.wrapUp));
    }
    if (l.gold.row) out.push(cells(l.level, { id: l.gold.id, title: "Gold" }, null, "", l.gold.row));
  }
  return out;
}
