/**
 * Level 7 Level Up types and rules. Learner-facing copy lives on the
 * level-up screen in the venture payload, not in this file.
 * `pace` is stored with the learner's picks for a later planning step.
 * It is never shown on these screens.
 */

export type LevelSectionId = "customers" | "ready" | "job" | "happy";
/** Silent classification. Not rendered. */
export type LevelPace = "quick" | "longer";
export type GrowIdeaId = "referral" | "prepaid" | "bundle" | "new-service" | "expand";
export type LevelCohort = "explorer" | "pathfinder" | "maverick";

export const LEVEL_SECTION_IDS: readonly LevelSectionId[] = ["customers", "ready", "job", "happy"];
export const GROW_IDEA_IDS: readonly GrowIdeaId[] = ["referral", "prepaid", "bundle", "new-service", "expand"];
export const LEVEL_COHORTS: readonly LevelCohort[] = ["explorer", "pathfinder", "maverick"];

export type LevelStatement = {
  id: string;
  /** Same words on Reflect and Improve. */
  label: string;
  pace: LevelPace;
  section: LevelSectionId;
};

export type LevelUpOption = {
  id: string;
  label: string;
  /** When set, only these cohorts see the option. Expand jobs use this. */
  cohorts?: readonly LevelCohort[];
};

/** One Grow heading and the options listed under it. */
export type LevelUpIdea = {
  id: GrowIdeaId;
  label: string;
  options: readonly LevelUpOption[];
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
    closerHeadline: string;
    closerContext: string;
    calendarNote: string;
    /** `{date}` is the calculated check-in date. */
    checkIn: string;
    copyLabel: string;
    copyHint: string;
    ideas: readonly LevelUpIdea[];
  };
};

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

export function paceFor(content: LaunchpadLevelUpContent, picks: Readonly<Record<string, string>>): Record<string, LevelPace> {
  return Object.fromEntries(pickedStatements(content, picks).map((item) => [item.id, item.pace]));
}

/** Today plus three calendar months. 10 Nov 2026 becomes 10 Feb 2027. */
export function addMonths(today: Date, months: number): Date {
  return new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
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

