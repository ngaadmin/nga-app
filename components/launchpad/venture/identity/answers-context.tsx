"use client";

import { createContext, useContext, useState } from "react";
import {
  EMPTY_IDENTITY,
  setIdentityField,
  type BusinessIdentityAnswer,
  type IdentityField,
} from "@/lib/launchpad/content/identity";
import { identityAnswerOf, type LaunchpadAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";

/**
 * The learner's saved answers for the venture, provided by the flow (which
 * stores them beside progress). Picker screens read and write through this.
 */
export type LaunchpadAnswersValue = {
  /** Venture whose icon set the logo picker offers. */
  iconVentureId: string;
  answers: LaunchpadAnswers;
  setAnswer: (answerKey: string, answer: LaunchpadAnswer) => void;
  /** The venture's floors, so screens can read carried values (option labels of earlier answers). */
  floors?: readonly LaunchpadFloor[];
};

const AnswersContext = createContext<LaunchpadAnswersValue | null>(null);
export const LaunchpadAnswersProvider = AnswersContext.Provider;

/** Read and update one identity answer. Without a provider it keeps the answer in local state (previews, tests). */
export function useIdentityAnswer(answerKey: string) {
  const ctx = useContext(AnswersContext);
  const [local, setLocal] = useState<BusinessIdentityAnswer>(EMPTY_IDENTITY);
  const answer = ctx ? (identityAnswerOf(ctx.answers, answerKey) ?? EMPTY_IDENTITY) : local;
  const save = ctx ? (a: BusinessIdentityAnswer) => ctx.setAnswer(answerKey, a) : setLocal;
  const update = <F extends IdentityField>(field: F, value: NonNullable<BusinessIdentityAnswer[F]>) =>
    save(setIdentityField(answer, field, value));
  return { answer, update, save, iconVentureId: ctx?.iconVentureId ?? "" };
}

/** The whole answers map and its setter, for capture screens and summaries. Null without a provider. */
export function useLaunchpadAnswers(): LaunchpadAnswersValue | null {
  return useContext(AnswersContext);
}

/**
 * Read and update one capture answer. Without a provider it keeps the answer
 * in local state (previews, tests).
 */
export function useCaptureAnswer(answerKey: string) {
  const ctx = useContext(AnswersContext);
  const [local, setLocal] = useState<LaunchpadAnswers>({});
  const answers = ctx ? ctx.answers : local;
  const save = (answer: LaunchpadAnswer) =>
    ctx ? ctx.setAnswer(answerKey, answer) : setLocal((prev) => ({ ...prev, [answerKey]: answer }));
  return { answers, answer: answers[answerKey], save, floors: ctx?.floors ?? [] };
}
