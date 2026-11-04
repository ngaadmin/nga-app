import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";
import { overlayLoad } from "@/lib/launchpad/load/to-payload";
import { LAUNCHPAD_LOAD_TEMPLATES, type LaunchpadLoadFile, type LoadRowMeta } from "@/lib/launchpad/load/types";

/**
 * Checks a load file before it is written or served:
 *  - ids (silvers, bronzes, tasks, screens) and answer keys are unique;
 *  - every template is one the app renders, and matches its payload type;
 *  - every feeds entry names an answer key saved on an EARLIER row, and
 *    every feedsInto target is a row in the load;
 *  - every flag names a listed decision;
 *  - the payload it produces over the seed passes the publish check
 *    (which re-checks carried values, goal-loop order and summary sources).
 */
export type LoadProblem = { where: string; reason: string };

/** Every row in course order (task screens, then the silver's wrap-up; the gold after its level). */
export function loadRows(load: LaunchpadLoadFile): LoadRowMeta[] {
  const out: LoadRowMeta[] = [];
  for (const l of load.levels) {
    for (const s of l.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) out.push(...t.screens);
      out.push(...(s.lockedRows ?? []));
      if (s.wrapUp) out.push(s.wrapUp);
    }
    if (l.gold.row) out.push(l.gold.row);
  }
  return out;
}

function templateMatches(row: LoadRowMeta & { payload?: { type: string; mode?: string } }): boolean {
  const p = row.payload;
  if (!p) return true;
  const [base, mode] = row.template.split(":");
  if (p.type !== base) return false;
  return !mode || p.mode === mode;
}

export function validateLoad(load: LaunchpadLoadFile, seed: LaunchpadVenturePayload): { problems: LoadProblem[]; payload?: LaunchpadVenturePayload } {
  const problems: LoadProblem[] = [];
  const add = (where: string, reason: string) => problems.push({ where, reason });

  const ids = new Set<string>();
  const uniq = (id: string, where: string) => {
    if (ids.has(id)) add(where, `Id ${id} is used twice.`);
    ids.add(id);
  };
  for (const l of load.levels)
    for (const s of l.silvers) {
      uniq(s.id, `silver ${s.id}`);
      for (const b of s.bronzes) {
        uniq(b.id, `bronze ${b.id}`);
        for (const t of b.tasks) uniq(t.id, `task ${t.id}`);
      }
    }

  const rows = loadRows(load);
  const decisionIds = new Set(load.decisions.map((d) => d.id));
  const saved = new Map<string, number>();
  const screenIds = new Set<string>();
  rows.forEach((row, i) => {
    const where = `row ${row.sourceRow} ${row.screenId}`;
    uniq(row.screenId, where);
    screenIds.add(row.screenId);
    if (!(LAUNCHPAD_LOAD_TEMPLATES as readonly string[]).includes(row.template)) add(where, `Unknown template ${row.template}.`);
    else if (!templateMatches(row as LoadRowMeta & { payload?: { type: string; mode?: string } })) add(where, `Template ${row.template} does not match its payload.`);
    for (const f of row.feeds) {
      const at = saved.get(f.answerKey);
      if (at === undefined) add(where, `Feeds from ${f.answerKey}, which no earlier row saves.`);
    }
    if (row.answer) {
      const key = row.answer.answerKey;
      // Picker rows share the identity key.
      if (saved.has(key) && row.answer.kind !== "business-identity") add(where, `Answer key ${key} is used twice.`);
      if (!saved.has(key)) saved.set(key, i);
    }
    for (const flag of row.flags) if (/^D\d+$/.test(flag) && !decisionIds.has(flag)) add(where, `Flag ${flag} is not a listed decision.`);
  });
  for (const row of rows) for (const t of row.feedsInto) if (!screenIds.has(t)) add(`row ${row.sourceRow} ${row.screenId}`, `Feeds into unknown ${t}.`);

  let payload: LaunchpadVenturePayload | undefined;
  try {
    payload = overlayLoad(seed, load);
    const check = checkLaunchpadVenturePayload(payload, load.ventureId);
    if (!check.ok) add("payload", check.reason);
  } catch (error) {
    add("payload", error instanceof Error ? error.message : String(error));
  }
  return { problems, ...(payload ? { payload } : {}) };
}
