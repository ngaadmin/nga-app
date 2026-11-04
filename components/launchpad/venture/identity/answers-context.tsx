"use client";

import { createContext, useContext, useState } from "react";
import {
  EMPTY_IDENTITY,
  setIdentityField,
  type BusinessIdentityAnswer,
  type IdentityField,
  type LaunchpadAnswers,
} from "@/lib/launchpad/content/identity";

/**
 * The learner's saved answers for the venture, provided by the flow (which
 * stores them beside progress). Picker screens read and write through this.
 */
export type LaunchpadAnswersValue = {
  /** Venture whose icon set the logo picker offers. */
  iconVentureId: string;
  answers: LaunchpadAnswers;
  setAnswer: (answerKey: string, answer: BusinessIdentityAnswer) => void;
};

const AnswersContext = createContext<LaunchpadAnswersValue | null>(null);
export const LaunchpadAnswersProvider = AnswersContext.Provider;

/** Read and update one identity answer. Without a provider it keeps the answer in local state (previews, tests). */
export function useIdentityAnswer(answerKey: string) {
  const ctx = useContext(AnswersContext);
  const [local, setLocal] = useState<BusinessIdentityAnswer>(EMPTY_IDENTITY);
  const answer = ctx ? (ctx.answers[answerKey] ?? EMPTY_IDENTITY) : local;
  const save = ctx ? (a: BusinessIdentityAnswer) => ctx.setAnswer(answerKey, a) : setLocal;
  const update = <F extends IdentityField>(field: F, value: NonNullable<BusinessIdentityAnswer[F]>) =>
    save(setIdentityField(answer, field, value));
  return { answer, update, save, iconVentureId: ctx?.iconVentureId ?? "" };
}
