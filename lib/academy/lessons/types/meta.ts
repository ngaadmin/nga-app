import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type LessonRewards = {
  xpReward: number;
  perfectStreakBonus: number;
  skillSlug: string;
  achievementSkillSlug: string;
};

export type PedagogicalStage = "hook" | "core" | "apply" | "reward" | "close";

export type ScreenAuthoringMeta = {
  objective?: string;
  gameArchetype?: string;
  simpleScreenText?: string;
  theAction?: string;
  contentForGame?: string;
  errorMessage?: string;
  pedagogicalStage?: PedagogicalStage;
  stageDescription?: string;
  screenNumber?: number;
  lessonKey?: string;
};

export type CharacterTokenMap = {
  lead?: string;
  support?: string;
  explorer?: string;
  pathfinder?: string;
  maverick?: string;
};

export type LessonMeta = {
  milestoneId: number;
  levelId: number;
  lessonNumber: number;
  moduleTitle: string;
  lessonTitle: string;
  shellLabel: string;
  totalScreens: number;
  skillName?: string;
  skillHubId?: string;
  learningOutcome?: string;
  conceptTruth?: string;
  behaviourShift?: string;
  ruleEnforcement?: string;
  learningArc?: string;
  focus?: string;
  lessonKey?: string;
  characters?: CharacterTokenMap;
  shippedCohorts?: readonly MasteryCohort[];
  /** Dev-only visual QA shell — never listed on the Academy map. */
  isDesignShell?: boolean;
};

export type CohortContentMap<T> = {
  explorer: T;
  pathfinder: T;
  maverick?: T;
};

export type LessonComponentProps = {
  milestoneId: number;
};
