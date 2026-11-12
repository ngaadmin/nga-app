/**
 * Level 7 Level Up types and rules. Learner-facing copy lives on the
 * level-up screen in the venture payload, not in this file.
 */

export type LevelSectionId = "customers" | "ready" | "job" | "happy";
export type GrowIdeaId = "referral" | "prepaid" | "bundle" | "new-service" | "expand";
export type LevelCohort = "explorer" | "pathfinder" | "maverick";

export const LEVEL_SECTION_IDS: readonly LevelSectionId[] = ["customers", "ready", "job", "happy"];
export const GROW_IDEA_IDS: readonly GrowIdeaId[] = ["referral", "prepaid", "bundle", "new-service", "expand"];
export const LEVEL_COHORTS: readonly LevelCohort[] = ["explorer", "pathfinder", "maverick"];

export type LevelStatement = {
  id: string;
  /** Same words on Reflect and Improve. */
  label: string;
  section: LevelSectionId;
};

export type LevelUpOption = {
  id: string;
  label: string;
  /** Words used inside the statement. The dropdown keeps `label`. */
  sentence?: string;
  /** When set, only these cohorts see the option. Expand jobs use this. */
  cohorts?: readonly LevelCohort[];
};

/** One Grow idea and the options the learner can tick on its own screen. */
export type LevelUpIdea = {
  id: GrowIdeaId;
  label: string;
  options: readonly LevelUpOption[];
  /** One line under the heading. Absent on a payload published before this screen. */
  context?: string;
  /**
   * The experiment sentence. Tokens: `{offer}` `{start}` `{count}` `{checkIn}`.
   * Absent on a payload published before this screen.
   */
  statement?: string;
  /** `{count}` is the whole-number blank. Absent on a payload published before this screen. */
  successLine?: string;
  /**
   * `stacked` replaces the inline sentence with one lead-in per field.
   * Absent ideas keep the sentence. Only the bundles idea uses this.
   */
  layout?: "stacked";
  stacked?: {
    offerLead: string;
    startLead: string;
    countLead: string;
    /** Sits on the same line as the number blank. */
    countAfter: string;
    checkInLead: string;
    /** Shown in an empty pick, with the chevron. */
    emptyLabel: string;
    /** Extra line under the offer field. */
    offerNote?: string;
    /** Extra line under the start field. */
    startNote?: string;
  };
};

export type GrowChoice = {
  id: string;
  label: string;
  /** Calendar months until this pick. */
  months?: number;
  /** Whole days until this pick, when it is shorter than a month. */
  days?: number;
  /**
   * Words that fill `{period}` in the closer heading. No leading "in",
   * so "See you in {period}." does not become "in in".
   */
  period?: string;
};

/** Shared by the Reflect, Improve, and Grow screens of one Level Up silver. */
export type LaunchpadLevelUpContent = {
  sections: readonly { id: LevelSectionId; label: string }[];
  statements: readonly LevelStatement[];
  reflect: { context: string; guidance: string; question: string };
  improve: {
    context: string;
    guidance: string;
    question: string;
    nailedTitle: string;
    /** `{section}` is the section label. */
    nailedLine: string;
    /** Section 5. Absent on a payload published before this screen. */
    planHeader?: string;
    planContext: string;
    /** Week 1..4. The screen uses the first N, one per Improve pick. */
    weekLabels?: readonly string[];
  };
  grow: {
    guidance: string;
    question: string;
    /** Shown under the question. Absent on a payload published before this screen. */
    context?: string;
    /** Shown above the option list on each idea screen. */
    optionPrompt?: string;
    startLabel?: string;
    checkInLabel?: string;
    /** Accessible name of the success number blank. */
    successFieldLabel?: string;
    /** Joins the last two offer picks. Absent on a payload published before the statement screen. */
    joinWord?: string;
    /** `{date}` is the experiment check-in date under the statement. */
    dateLine?: string;
    startOptions?: readonly GrowChoice[];
    /** `months` is how far ahead the check-in date is written. */
    checkInOptions?: readonly GrowChoice[];
    closerHeadline: string;
    closerContext: string;
    calendarNote: string;
    /** `{date}` is the closer's own check-in date. */
    checkIn: string;
    copyLabel: string;
    copyHint: string;
    /** Button label after a successful copy. Absent on a payload published before this feedback. */
    copiedLabel?: string;
    /** Shown when the copy fails, so the learner can copy the check-in by hand. */
    copyFailedHint?: string;
    ideas: readonly LevelUpIdea[];
  };
  /**
   * Ordered Growing workbook pages. Absent on a payload published before
   * these pages. Each id has a renderer; the title is the page heading.
   * `lead` is the framing line under the focus-page title.
   */
  workbookPages?: readonly { id: string; title: string; lead?: string }[];
};

/** Improve picks in the order the learner ranked them, without week labels. */
export function focusAreaLines(
  content: LaunchpadLevelUpContent,
  plan: readonly { statementId: string; week: number }[],
): { id: string; line: string }[] {
  const byId = new Map(content.statements.map((item) => [item.id, item.label]));
  return [...plan]
    .filter((row) => byId.has(row.statementId) && row.week >= 1)
    .sort((a, b) => a.week - b.week || a.statementId.localeCompare(b.statementId))
    .flatMap((row) => {
      const line = byId.get(row.statementId);
      return line ? [{ id: row.statementId, line }] : [];
    });
}

/** Improve picks in week order, with the payload week label and statement label. */
export function weeklyFocusRows(
  content: LaunchpadLevelUpContent,
  plan: readonly { statementId: string; week: number }[],
): { weekLabel: string; line: string }[] {
  const labels = content.improve.weekLabels ?? [];
  const byId = new Map(content.statements.map((item) => [item.id, item.label]));
  return [...plan]
    .filter((row) => byId.has(row.statementId) && row.week >= 1)
    .sort((a, b) => a.week - b.week || a.statementId.localeCompare(b.statementId))
    .flatMap((row) => {
      const weekLabel = labels[row.week - 1];
      const line = byId.get(row.statementId);
      return weekLabel && line ? [{ weekLabel, line }] : [];
    });
}

export function statementsIn(statements: readonly LevelStatement[], section: LevelSectionId): LevelStatement[] {
  return statements.filter((item) => item.section === section);
}

export function sectionLabel(sections: LaunchpadLevelUpContent["sections"], id: LevelSectionId): string {
  return sections.find((section) => section.id === id)?.label ?? id;
}

export function fillToken(template: string, token: string, value: string): string {
  return template.replaceAll(`{${token}}`, value);
}

export function pickedStatements(
  content: LaunchpadLevelUpContent,
  picks: Readonly<Record<string, string>>,
): LevelStatement[] {
  return content.sections.flatMap((section) => {
    const id = picks[section.id];
    const item = id ? statementsIn(content.statements, section.id).find((row) => row.id === id) : undefined;
    return item ? [item] : [];
  });
}

/** Today plus three calendar months. 10 Nov 2026 becomes 10 Feb 2027. */
export function addMonths(today: Date, months: number): Date {
  return new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
}

export function addDays(today: Date, days: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
}

function spanDays(option: GrowChoice): number | null {
  if (typeof option.days === "number" && option.days > 0) return option.days;
  if (typeof option.months === "number" && option.months > 0) return option.months * 30;
  return null;
}

/** Heading word for a timing option. Drops a leading "in" so the template does not repeat it. */
export function periodWord(option: GrowChoice): string {
  const period = option.period?.trim();
  if (period) return period;
  const label = option.label.trim();
  return /^in\s+/i.test(label) ? label.replace(/^in\s+/i, "") : label;
}

export type SoonestCheckIn = { period: string; date: Date };

/**
 * The soonest timing the learner picked on their Grow ideas (a start or a
 * check-in). No picks falls back to the three-month check-in option.
 */
export function soonestGrowCheckIn(
  plans: readonly { when?: string; checkIn?: string; checkInDate?: string }[],
  startOptions: readonly GrowChoice[] | undefined,
  checkInOptions: readonly GrowChoice[] | undefined,
  today: Date,
): SoonestCheckIn {
  const byId = new Map([...(startOptions ?? []), ...(checkInOptions ?? [])].map((option) => [option.id, option]));
  const fallback = (checkInOptions ?? []).find((option) => option.months === 3) ?? (checkInOptions ?? []).find((option) => (option.months ?? 0) > 0);
  const fallbackDate = addMonths(today, fallback?.months && fallback.months > 0 ? fallback.months : 3);
  let best: { span: number; date: Date; period: string } | null = null;
  for (const plan of plans) {
    for (const id of [plan.when, plan.checkIn]) {
      if (!id) continue;
      const option = byId.get(id);
      const span = option ? spanDays(option) : null;
      if (!option || span === null) continue;
      const saved = id === plan.checkIn ? plan.checkInDate?.trim() : "";
      const parsed = saved ? Date.parse(saved) : Number.NaN;
      const date = !Number.isNaN(parsed) ? new Date(parsed) : option.days ? addDays(today, option.days) : addMonths(today, option.months ?? 0);
      const period = periodWord(option);
      if (!period) continue;
      if (!best || span < best.span || (span === best.span && date.getTime() < best.date.getTime())) best = { span, date, period };
    }
  }
  return best ? { period: best.period, date: best.date } : { period: fallback ? periodWord(fallback) : "", date: fallbackDate };
}

export function formatCheckInDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** The calendar note, then the calculated check-in line. The app sets no reminder. */
export function checkInClipboard(note: string, checkInLine: string): string {
  return `${note}\n${checkInLine}`;
}

export function expandJobsFor(options: readonly LevelUpOption[], cohort: LevelCohort): { id: string; label: string }[] {
  return options
    .filter((option) => !option.cohorts || option.cohorts.includes(cohort))
    .map((option) => ({ id: option.id, label: option.label }));
}

/** X, then X and Y, then X, Y and Z. No serial comma. The joining word comes from the payload. */
export function joinList(items: readonly string[], andWord: string): string {
  const rows = items.filter((item) => item.trim().length > 0);
  if (rows.length === 0) return "";
  if (rows.length === 1) return rows[0]!;
  if (rows.length === 2) return `${rows[0]} ${andWord} ${rows[1]}`;
  return `${rows.slice(0, -1).join(", ")} ${andWord} ${rows[rows.length - 1]}`;
}

