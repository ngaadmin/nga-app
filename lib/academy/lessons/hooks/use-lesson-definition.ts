"use client";

import { useMemo } from "react";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import { getLessonDefinition } from "@/lib/academy/lessons/registry";
import {
  resolveLessonDefinition,
  type ResolvedLessonContent,
} from "@/lib/academy/lessons/types";

export function useLessonDefinition(
  milestoneId: number,
): ResolvedLessonContent {
  const cohort = useLessonMasteryCohort();
  const definition = getLessonDefinition(milestoneId);

  if (!definition) {
    throw new Error(`No lesson definition for milestone ${milestoneId}`);
  }

  return useMemo(
    () => resolveLessonDefinition(definition, cohort),
    [definition, cohort],
  );
}
