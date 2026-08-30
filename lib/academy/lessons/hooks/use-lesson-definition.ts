"use client";

import { useMemo } from "react";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { getLessonDefinition } from "@/lib/academy/lessons/registry";
import {
  resolveLessonDefinition,
  type ResolvedLessonContent,
} from "@/lib/academy/lessons/types";

export function useLessonDefinition(
  milestoneId: number,
  cohortOverride?: MasteryCohort,
): ResolvedLessonContent {
  const sessionCohort = useLessonMasteryCohort();
  const cohort = cohortOverride ?? sessionCohort;
  const definition = getLessonDefinition(milestoneId);

  if (!definition) {
    throw new Error(`No lesson definition for milestone ${milestoneId}`);
  }

  return useMemo(
    () => resolveLessonDefinition(definition, cohort),
    [definition, cohort],
  );
}
