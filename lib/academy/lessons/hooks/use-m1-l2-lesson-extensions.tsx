"use client";

import { useCallback, useMemo, useState } from "react";
import { M1L2CustomScreen } from "@/components/academy/lesson/m1-l2-custom-screens";
import { M1_L2_CUSTOM } from "@/lib/academy/lessons/content/m1-l2";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
} from "@/lib/academy/lessons/utils";
import type { ResolvedLessonContent } from "@/lib/academy/lessons/types";
import type { ReactNode } from "react";

export function useM1L2LessonExtensions(
  content: ResolvedLessonContent,
  flow: LessonFlow,
) {
  const hasM1L2CustomScreens = content.screens.some(
    (screen) =>
      screen.type === "custom" &&
      screen.renderer.startsWith("m1-l2-"),
  );

  const budgetScreenIndex = useMemo(
    () =>
      content.screens.findIndex(
        (screen) =>
          screen.type === "custom" && screen.renderer === "m1-l2-budget-wallet",
      ),
    [content.screens],
  );

  const sliderScreenIndex = useMemo(
    () =>
      content.screens.findIndex(
        (screen) =>
          screen.type === "custom" && screen.renderer === "m1-l2-reserve-slider",
      ),
    [content.screens],
  );

  const rankConfig = (content.custom?.rank ?? M1_L2_CUSTOM.rank) as typeof M1_L2_CUSTOM.rank;

  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [busChecked, setBusChecked] = useState(false);
  const [drinkChecked, setDrinkChecked] = useState(false);
  const [cableChecked, setCableChecked] = useState(false);
  const [reservedAmount, setReservedAmount] = useState(0);

  const showPersistentError = useCallback(
    (message: string) => {
      setPersistentError(message);
      signalLessonIncorrectAnswer(flow.flashScreen);
    },
    [flow],
  );

  const dismissPersistentError = useCallback(() => {
    setPersistentError(null);
    flow.flashScreen("none");
  }, [flow]);

  const flashSuccess = useCallback(() => {
    celebrateLessonCorrectAnswer(flow.flashScreen);
  }, [flow]);

  const budgetSpent =
    (busChecked ? 15 : 0) + (drinkChecked ? 10 : 0) + (cableChecked ? 15 : 0);
  const budgetRemaining = M1_L2_CUSTOM.budget.total - budgetSpent;
  const isBudgetCorrect =
    busChecked &&
    cableChecked &&
    !drinkChecked &&
    budgetRemaining === 0;

  const validateBudgetOnNext = (): boolean => {
    if (isBudgetCorrect) {
      flow.markScreenReady(budgetScreenIndex);
      return true;
    }
    flow.incrementMistake();
    const errors = M1_L2_CUSTOM.budget.errors;
    if (
      budgetSpent > M1_L2_CUSTOM.budget.total ||
      (busChecked && drinkChecked && cableChecked)
    ) {
      showPersistentError(errors.overBudget);
    } else if (!cableChecked) {
      showPersistentError(errors.missingCable);
    } else if (!busChecked) {
      showPersistentError(errors.missingBus);
    } else if (drinkChecked) {
      showPersistentError(errors.wrongSelection);
    } else {
      showPersistentError(errors.wrongSelection);
    }
    return false;
  };

  const validateSliderOnNext = (): boolean => {
    if (reservedAmount >= M1_L2_CUSTOM.reserve.target) {
      flow.markScreenReady(sliderScreenIndex);
      return true;
    }
    flow.incrementMistake();
    showPersistentError(M1_L2_CUSTOM.reserve.sliderError);
    return false;
  };

  const handleNext = () => {
    if (
      budgetScreenIndex >= 0 &&
      flow.screenIndex === budgetScreenIndex &&
      !validateBudgetOnNext()
    ) {
      return;
    }
    if (
      sliderScreenIndex >= 0 &&
      flow.screenIndex === sliderScreenIndex &&
      !validateSliderOnNext()
    ) {
      return;
    }
    flow.handleNext();
  };

  const onBudgetOrSliderScreen =
    (budgetScreenIndex >= 0 && flow.screenIndex === budgetScreenIndex) ||
    (sliderScreenIndex >= 0 && flow.screenIndex === sliderScreenIndex);

  const canAdvance = onBudgetOrSliderScreen
    ? true
    : flow.canAdvanceDefault;

  const renderCustomScreen = useCallback(
    (screenIndex: number, renderer: string): ReactNode => (
      <M1L2CustomScreen
        renderer={renderer}
        screenIndex={screenIndex}
        flow={flow}
        onPersistentError={showPersistentError}
        onDismissError={dismissPersistentError}
        onFlashSuccess={flashSuccess}
        rankConfig={rankConfig}
        budget={{
          busChecked,
          drinkChecked,
          cableChecked,
          setBusChecked,
          setDrinkChecked,
          setCableChecked,
        }}
        reserve={{ reservedAmount, setReservedAmount }}
      />
    ),
    [
      busChecked,
      cableChecked,
      drinkChecked,
      dismissPersistentError,
      flashSuccess,
      flow,
      rankConfig,
      reservedAmount,
      showPersistentError,
    ],
  );

  if (!hasM1L2CustomScreens) {
    return {
      persistentError: null,
      dismissPersistentError: undefined,
      canAdvance: undefined,
      onNext: undefined,
      onPersistentError: undefined,
      renderCustomScreen: undefined,
    };
  }

  return {
    persistentError,
    dismissPersistentError,
    canAdvance: canAdvance && !flow.isLastScreen,
    onNext: handleNext,
    onPersistentError: showPersistentError,
    renderCustomScreen,
  };
}
