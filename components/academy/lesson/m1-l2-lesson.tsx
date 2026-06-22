"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademyLessonShell,
  LessonScreenPane,
  lessonCardClass,
  lessonChoiceClass,
} from "@/components/academy/lesson/academy-lesson-shell";
import {
  completeAcademyMilestone,
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  M1_L2_ACHIEVEMENT_SKILL_ID,
  M1_L2_PERFECT_STREAK_BONUS,
  M1_L2_SKILL_ID,
  M1_L2_XP_REWARD,
} from "@/lib/academy/lessons/registry";
import { setVaultSkillTierOverride } from "@/lib/dashboard/vault-skill-progress-storage";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import {
  LESSON_CASH_IN_LABEL,
  lessonGoldClaimClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

const TOTAL_SCREENS = 8;
const BUDGET_TOTAL = 30;
const RESERVE_TOTAL = 25;
const RESERVE_TARGET = 20;
const ENERGY_DRINK_PRICE = 10;

const goldClaimClass = lessonGoldClaimClass;

const submitAnswerClass =
  "h-touch w-full max-w-xs rounded-nga-lg border-b-4 border-[#4338CA] bg-[#6366F1] px-6 font-heading text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:brightness-[1.05] active:translate-y-[2px] active:border-b-2";

const SCREEN2_ITEMS = [
  {
    id: "case",
    emoji: "📱",
    label: "Phone Case Birthday Present",
    bucket: "need" as const,
    error:
      "Hold up! You promised this to your brother for his birthday. Promises are things Lars needs!",
  },
  {
    id: "cable",
    emoji: "🔌",
    label: "Broken Phone Cable",
    bucket: "need" as const,
    error:
      "Wait! If your phone cable is broken, your phone dies and you're completely disconnected. That's something Lars needs!",
  },
  {
    id: "munch",
    emoji: "🍫",
    label: "Beast Munch",
    bucket: "want" as const,
    error:
      "Beast Munch tastes great, but you won't get stuck without it. That goes into Things Lars wants!",
  },
  {
    id: "gamepass",
    emoji: "💃",
    label: "New skin for his favourite game",
    bucket: "want" as const,
    error:
      "A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!",
  },
];

const SPOTLIGHT_ROUNDS = [
  {
    iconA: "📱",
    optionA: "A new phone case, even though his old one is still fine",
    iconB: "🎁",
    optionB: "A new phone case he promised to buy his brother for his birthday",
    correct: "b" as const,
    error:
      "The birthday present is the true 'need to buy' item for Lars.",
  },
  {
    iconA: "💡",
    optionA: "A light for his bike to be seen in the dark",
    iconB: "🖱️",
    optionB: "A new gaming mouse with lights (his old one still works)",
    correct: "a" as const,
    error:
      "If the old one's still working, replacing it becomes a 'want' not a 'need'.",
  },
  {
    iconA: "🥪",
    optionA: "Buy lunch for himself with his weekly tuckshop money",
    iconB: "🍱",
    optionB: "Buy lunch for all his friends on Monday and have nothing left over",
    correct: "a" as const,
    error:
      "Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!",
  },
];

const RANK_ITEMS = [
  {
    id: "keep",
    label: "Keep the $5 and don't buy anything",
  },
  {
    id: "cheaper",
    label: "Choose something cheaper for $5 to enjoy now.",
  },
  {
    id: "borrow",
    label: "Borrow $5 from dad to buy the $10 bottle.",
  },
] as const;

type RankItemId = (typeof RANK_ITEMS)[number]["id"];

const CORRECT_RANK_ORDER: RankItemId[] = ["keep", "cheaper", "borrow"];

const RANK_SUCCESS_MESSAGE =
  "Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct. That's smart spending control that Lars can count on.";

const RANK_BORROW_ERROR =
  "Not quite! Borrowing money creates debt and you don't want to do that for something you 'want' but can do without. This is the option to avoid and should be at the very bottom of our list. Try again!";

const RANK_CHEAPER_TOP_ERROR =
  "Not quite! While spending what you have left is ok, there's something else Lars could consider as his first option. Try again!";

function playSuccessPing(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  } catch {
    /* Audio optional */
  }
}

function triggerErrorVibration(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}

function getRankSubmitError(order: RankItemId[]): string {
  const top = order[0];
  if (top === "borrow") {
    return RANK_BORROW_ERROR;
  }
  if (top === "cheaper") {
    return RANK_CHEAPER_TOP_ERROR;
  }
  if (top === "keep" && order.indexOf("borrow") !== 2) {
    return RANK_BORROW_ERROR;
  }
  return RANK_CHEAPER_TOP_ERROR;
}

type ScreenFlash = "none" | "error" | "success";

type M1L2LessonProps = {
  milestoneId?: number;
};

export function M1L2Lesson({ milestoneId = 2 }: M1L2LessonProps) {
  const router = useRouter();
  const { awardLessonXp } = useDashboardWallet();

  const [screenIndex, setScreenIndex] = useState(0);
  const [screenReady, setScreenReady] = useState<boolean[]>(
    () => Array.from({ length: TOTAL_SCREENS }, () => false),
  );
  const [screenFlash, setScreenFlash] = useState<ScreenFlash>("none");
  const [screenMistakes, setScreenMistakes] = useState(0);
  const [persistentError, setPersistentError] = useState<string | null>(null);

  // Screen 1
  const [trueFalseChoice, setTrueFalseChoice] = useState<"true" | "false" | null>(
    null,
  );

  // Screen 2
  const [sortIndex, setSortIndex] = useState(0);
  const [sortedToBuckets, setSortedToBuckets] = useState<{
    want: string[];
    need: string[];
  }>({ want: [], need: [] });

  // Screen 3
  const [spotlightRound, setSpotlightRound] = useState(0);
  const [spotlightChoice, setSpotlightChoice] = useState<"a" | "b" | null>(null);
  const [spotlightAllDone, setSpotlightAllDone] = useState(false);

  // Screen 4
  const [busChecked, setBusChecked] = useState(false);
  const [drinkChecked, setDrinkChecked] = useState(false);
  const [cableChecked, setCableChecked] = useState(false);

  // Screen 5
  const [reservedAmount, setReservedAmount] = useState(0);

  // Screen 6
  const [rankOrder, setRankOrder] = useState<RankItemId[]>([
    "cheaper",
    "borrow",
    "keep",
  ]);
  const [rankSubmitted, setRankSubmitted] = useState(false);
  const [rankSuccessMessage, setRankSuccessMessage] = useState<string | null>(
    null,
  );
  const [dragRankId, setDragRankId] = useState<RankItemId | null>(null);

  // Screen 7
  const [giftRevealed, setGiftRevealed] = useState(false);

  // Screen 8
  const [lessonComplete, setLessonComplete] = useState(false);

  const markScreenReady = useCallback((index: number) => {
    setScreenReady((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
  }, []);

  const incrementMistake = useCallback(() => {
    setScreenMistakes((count) => count + 1);
  }, []);

  const showPersistentError = useCallback(
    (message: string) => {
      setPersistentError(message);
      setScreenFlash("error");
    },
    [],
  );

  const dismissPersistentError = useCallback(() => {
    setPersistentError(null);
    setScreenFlash("none");
  }, []);

  const flashSuccess = useCallback(() => {
    setScreenFlash("success");
    window.setTimeout(() => setScreenFlash("none"), 450);
  }, []);

  const budgetSpent =
    (busChecked ? 15 : 0) + (drinkChecked ? 10 : 0) + (cableChecked ? 15 : 0);
  const budgetRemaining = BUDGET_TOTAL - budgetSpent;
  const isBudgetCorrect =
    busChecked && cableChecked && !drinkChecked && budgetRemaining === 0;
  const isOverBudget = budgetSpent > BUDGET_TOTAL;

  const perfectStreak = screenMistakes === 0;
  const spendableToday = RESERVE_TOTAL - reservedAmount;
  const energyDrinkLocked =
    reservedAmount >= RESERVE_TARGET && spendableToday < ENERGY_DRINK_PRICE;

  const handleTrueFalse = (choice: "true" | "false") => {
    setTrueFalseChoice(choice);
    if (choice === "false") {
      dismissPersistentError();
      markScreenReady(0);
      return;
    }
    incrementMistake();
    showPersistentError(
      "Nope! Once the cash is spent, it's gone. You can't use the same dollar twice!",
    );
  };

  const handleSortChoice = (bucket: "want" | "need") => {
    const item = SCREEN2_ITEMS[sortIndex];
    if (!item) return;

    if (item.bucket !== bucket) {
      incrementMistake();
      showPersistentError(item.error);
      triggerErrorVibration();
      return;
    }

    dismissPersistentError();
    playSuccessPing();
    flashSuccess();
    setSortedToBuckets((current) => ({
      ...current,
      [bucket]: [...current[bucket], item.id],
    }));
    const nextIndex = sortIndex + 1;
    setSortIndex(nextIndex);
    if (nextIndex >= SCREEN2_ITEMS.length) {
      markScreenReady(1);
    }
  };

  const handleSpotlightChoice = (choice: "a" | "b") => {
    const round = SPOTLIGHT_ROUNDS[spotlightRound];
    if (!round) return;

    setSpotlightChoice(choice);
    if (choice !== round.correct) {
      incrementMistake();
      showPersistentError(round.error);
      return;
    }

    dismissPersistentError();
    playSuccessPing();
    flashSuccess();

    if (spotlightRound + 1 >= SPOTLIGHT_ROUNDS.length) {
      setSpotlightAllDone(true);
      markScreenReady(2);
      return;
    }

    setSpotlightRound((current) => current + 1);
    setSpotlightChoice(null);
  };

  const toggleBudgetItem = (
    item: "bus" | "drink" | "cable",
    nextChecked: boolean,
  ) => {
    dismissPersistentError();
    const nextBus = item === "bus" ? nextChecked : busChecked;
    const nextDrink = item === "drink" ? nextChecked : drinkChecked;
    const nextCable = item === "cable" ? nextChecked : cableChecked;
    const nextSpent =
      (nextBus ? 15 : 0) + (nextDrink ? 10 : 0) + (nextCable ? 15 : 0);

    if (nextSpent > BUDGET_TOTAL) {
      incrementMistake();
      showPersistentError("Uncheck the item you don't really 'need'.");
      return;
    }

    if (item === "bus") setBusChecked(nextChecked);
    if (item === "drink") setDrinkChecked(nextChecked);
    if (item === "cable") setCableChecked(nextChecked);

    const remaining = BUDGET_TOTAL - nextSpent;
    const correct = nextBus && nextCable && !nextDrink && remaining === 0;
    if (correct) {
      markScreenReady(3);
    } else {
      setScreenReady((current) => {
        const next = [...current];
        next[3] = false;
        return next;
      });
    }
  };

  const validateBudgetOnNext = (): boolean => {
    if (isBudgetCorrect) {
      markScreenReady(3);
      return true;
    }

    incrementMistake();
    if (isOverBudget || (busChecked && drinkChecked && cableChecked)) {
      showPersistentError("Uncheck the item you don't really 'need'.");
    } else if (!cableChecked) {
      showPersistentError(
        "Wait! Your phone is dead without that cable. Uncheck the Energy Drink and secure your phone lifeline!",
      );
    } else if (!busChecked) {
      showPersistentError(
        "Hold up! You're stranded at school without that Bus Pass. Swap out the Energy Drink for a ride home!",
      );
    } else if (drinkChecked) {
      showPersistentError("Uncheck the item you don't really 'need'.");
    }
    return false;
  };

  const handleReservedChange = (value: number) => {
    dismissPersistentError();
    setReservedAmount(value);
    if (value >= RESERVE_TARGET) {
      markScreenReady(4);
    } else {
      setScreenReady((current) => {
        const next = [...current];
        next[4] = false;
        return next;
      });
    }
  };

  const validateSliderOnNext = (): boolean => {
    if (reservedAmount >= RESERVE_TARGET) {
      markScreenReady(4);
      return true;
    }
    incrementMistake();
    showPersistentError(
      "Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!",
    );
    return false;
  };

  const validateRankOrder = (order: RankItemId[]): boolean =>
    order.length === CORRECT_RANK_ORDER.length &&
    order.every((id, index) => id === CORRECT_RANK_ORDER[index]);

  const moveRankItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || rankSubmitted) return;
    const next = [...rankOrder];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    setRankOrder(next);
    dismissPersistentError();
  };

  const handleRankSubmit = () => {
    if (rankSubmitted) return;

    if (validateRankOrder(rankOrder)) {
      dismissPersistentError();
      setRankSuccessMessage(RANK_SUCCESS_MESSAGE);
      setRankSubmitted(true);
      markScreenReady(5);
      playSuccessPing();
      flashSuccess();
      return;
    }

    incrementMistake();
    showPersistentError(getRankSubmitError(rankOrder));
    triggerErrorVibration();
  };

  const handleGiftTap = () => {
    if (giftRevealed) return;
    setGiftRevealed(true);
    markScreenReady(6);
    playSuccessPing();
    flashSuccess();
  };

  const handleCashInPoints = () => {
    if (lessonComplete) return;
    setLessonComplete(true);
    awardLessonXp(M1_L2_XP_REWARD);
    if (perfectStreak) {
      awardLessonXp(M1_L2_PERFECT_STREAK_BONUS);
    }

    const milestones = readAcademyMilestones();
    const alreadyCompleted = milestones.some(
      (node) => node.id === milestoneId && node.status === "completed",
    );

    if (!alreadyCompleted) {
      setVaultSkillTierOverride(M1_L2_SKILL_ID, "bronze");
      const updated = completeAcademyMilestone(milestoneId, milestones);
      saveAcademyMilestones(updated);
    }

    router.push("/dashboard/academy");
  };

  const handleNext = () => {
    if (screenIndex === 3 && !validateBudgetOnNext()) return;
    if (screenIndex === 4 && !validateSliderOnNext()) return;
    if (!screenReady[screenIndex]) return;
    setScreenIndex((current) => Math.min(TOTAL_SCREENS - 1, current + 1));
  };

  const canAdvanceScreen =
    screenIndex === 3 || screenIndex === 4
      ? true
      : Boolean(screenReady[screenIndex]);

  const flashBorderClass =
    screenFlash === "error"
      ? "ring-4 ring-[#E11D48]/70"
      : screenFlash === "success"
        ? "ring-4 ring-[#22C55E]/70"
        : "";

  const currentSpotlight = SPOTLIGHT_ROUNDS[spotlightRound];

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col transition-shadow duration-200",
        flashBorderClass,
      )}
      onClick={() => {
        if (persistentError) dismissPersistentError();
      }}
    >
      {persistentError ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md px-4"
          role="alert"
        >
          <div className="rounded-xl border border-[#E11D48]/30 bg-[#FFF7ED] px-4 py-3 shadow-lg">
            <p className="font-sans text-sm text-[#031F82]">{persistentError}</p>
            <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#1E3A5F]/60">
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      ) : null}

      <AcademyLessonShell
        lessonLabel="Module 1 · Lesson 2 · Needs vs Wants Sort"
        currentScreenIndex={screenIndex}
        totalScreens={TOTAL_SCREENS}
        canAdvance={canAdvanceScreen && screenIndex < TOTAL_SCREENS - 1}
        onNext={handleNext}
        footerSlot={
          screenIndex === TOTAL_SCREENS - 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCashInPoints();
              }}
              disabled={lessonComplete}
              className={goldClaimClass}
            >
              {lessonComplete ? "Cashing in..." : LESSON_CASH_IN_LABEL}
            </button>
          ) : undefined
        }
      >
        {/* Screen 1: The Hook */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Tomorrow is Senna&apos;s birthday. Lars opens his savings jar to buy
            the phone case he promised his brother... but the jar is completely
            empty. True or False: Lars can still buy the present.
          </p>
          <div className={cn(lessonCardClass, "mt-5")}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              Fact Finder
            </p>
            <div className="mt-3 flex gap-3">
              {(["true", "false"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTrueFalse(option);
                  }}
                  className={cn(
                    lessonChoiceClass,
                    "flex-1 text-center uppercase",
                    trueFalseChoice === option &&
                      (option === "false"
                        ? "border-[#22C55E] bg-[#DCFCE7]/60"
                        : "border-[#E11D48] bg-[#FEE2E2]/50"),
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </LessonScreenPane>

        {/* Screen 2: Physics A */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Lars spent all his money on things Lars wanted, but didn&apos;t save
            anything for things he needs to buy. Help Lars identify which items
            are &apos;Things he wants&apos; or &apos;Things he needs&apos;
          </p>
          {sortIndex < SCREEN2_ITEMS.length ? (
            <div
              className={cn(lessonCardClass, "mt-5 text-center")}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  "text/plain",
                  SCREEN2_ITEMS[sortIndex]?.id ?? "",
                );
              }}
            >
              <p className="text-3xl" aria-hidden>
                {SCREEN2_ITEMS[sortIndex]?.emoji}
              </p>
              <p className="mt-2 font-heading text-sm font-extrabold text-[#031F82]">
                {SCREEN2_ITEMS[sortIndex]?.label}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-center font-heading text-sm font-bold text-[#22C55E]">
              All sorted!
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleSortChoice("want");
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleSortChoice("want");
              }}
              disabled={sortIndex >= SCREEN2_ITEMS.length}
              className={lessonChoiceClass}
            >
              Things Lars wants
              {sortedToBuckets.want.length > 0 ? (
                <span className="mt-1 block text-lg">
                  {sortedToBuckets.want
                    .map(
                      (itemId) =>
                        SCREEN2_ITEMS.find((entry) => entry.id === itemId)?.emoji,
                    )
                    .join("")}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleSortChoice("need");
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleSortChoice("need");
              }}
              disabled={sortIndex >= SCREEN2_ITEMS.length}
              className={lessonChoiceClass}
            >
              Things Lars needs
              {sortedToBuckets.need.length > 0 ? (
                <span className="mt-1 block text-lg">
                  {sortedToBuckets.need
                    .map(
                      (itemId) =>
                        SCREEN2_ITEMS.find((entry) => entry.id === itemId)?.emoji,
                    )
                    .join("")}
                </span>
              ) : null}
            </button>
          </div>
        </LessonScreenPane>

        {/* Screen 3: Physics B - Multi-round */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Which item is the one Lars &apos;Needs&apos; to buy before he spends
            money on what he &apos;Wants&apos; to buy?
          </p>
          <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            {spotlightAllDone
              ? "Complete"
              : `Round ${spotlightRound + 1} of ${SPOTLIGHT_ROUNDS.length}`}
          </p>
          {spotlightAllDone ? (
            <div className={cn(lessonCardClass, "mt-6 py-8 text-center")}>
              <p className="font-heading text-sm font-bold text-[#22C55E]">
                All done
              </p>
            </div>
          ) : currentSpotlight ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSpotlightChoice("a");
                }}
                className={cn(
                  lessonChoiceClass,
                  "min-h-[7rem]",
                  spotlightChoice === "a" &&
                    (currentSpotlight.correct === "a"
                      ? "border-[#22C55E] bg-[#DCFCE7]/60"
                      : "border-[#E11D48] bg-[#FEE2E2]/50"),
                )}
              >
                <span className="flex items-start gap-2">
                  <span className="shrink-0 text-2xl" aria-hidden>
                    {currentSpotlight.iconA}
                  </span>
                  <span>{currentSpotlight.optionA}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSpotlightChoice("b");
                }}
                className={cn(
                  lessonChoiceClass,
                  "min-h-[7rem]",
                  spotlightChoice === "b" &&
                    (currentSpotlight.correct === "b"
                      ? "border-[#22C55E] bg-[#DCFCE7]/60"
                      : "border-[#E11D48] bg-[#FEE2E2]/50"),
                )}
              >
                <span className="flex items-start gap-2">
                  <span className="shrink-0 text-2xl" aria-hidden>
                    {currentSpotlight.iconB}
                  </span>
                  <span>{currentSpotlight.optionB}</span>
                </span>
              </button>
            </div>
          ) : null}
        </LessonScreenPane>

        {/* Screen 4: Friction Check */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            You have $30 left. Check the boxes to buy what you actually need.
          </p>
          <div className={cn(lessonCardClass, "mt-5 text-center")}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              Digital Wallet
            </p>
            <p
              className={cn(
                "mt-2 font-heading text-3xl font-extrabold",
                budgetRemaining < 0 ? "text-[#E11D48]" : "text-[#031F82]",
              )}
            >
              ${Math.max(0, budgetRemaining)}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { id: "bus" as const, label: "🚍 Bus Pass ($15)", checked: busChecked },
              {
                id: "drink" as const,
                label: "⚡ Energy Drink ($10)",
                checked: drinkChecked,
              },
              { id: "cable" as const, label: "🔌 Phone Cable ($15)", checked: cableChecked },
            ].map((item) => (
              <label
                key={item.id}
                className={cn(
                  lessonChoiceClass,
                  "flex cursor-pointer items-center gap-3",
                  item.checked && "border-[#0CC1E0] bg-[#BDE9FB]/25",
                )}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => {
                    event.stopPropagation();
                    toggleBudgetItem(item.id, event.target.checked);
                  }}
                  className="h-5 w-5 accent-[#0CC1E0]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </LessonScreenPane>

        {/* Screen 5: Allocation Slider */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Lars has $25 total. He needs $20 next week for his brother&apos;s phone
            case. Help him put the money aside so he doesn&apos;t spend it. Slide
            the divider to secure that money now.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <div
              className={cn(
                lessonCardClass,
                "flex w-28 shrink-0 flex-col items-center p-3 text-center transition-opacity",
                reservedAmount >= RESERVE_TARGET
                  ? "border-2 border-[#031F82] bg-[#BDE9FB]/30"
                  : "opacity-80",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#031F82]/10 text-2xl">
                📱
              </span>
              <p className="mt-2 font-heading text-[10px] font-extrabold text-[#031F82]">
                Phone Case
              </p>
              <p className="font-heading text-xs font-bold text-[#0CC1E0]">$20</p>
            </div>
            <div
              className={cn(
                lessonCardClass,
                "flex w-28 shrink-0 flex-col items-center p-3 text-center transition-all",
                energyDrinkLocked
                  ? "pointer-events-none opacity-35 grayscale"
                  : "opacity-100",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFA503]/15 text-2xl">
                ⚡
              </span>
              <p className="mt-2 font-heading text-[10px] font-extrabold text-[#031F82]">
                Energy Drink
              </p>
              <p className="font-heading text-xs font-bold text-[#FFA503]">$10</p>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <input
              type="range"
              min={0}
              max={RESERVE_TOTAL}
              step={1}
              value={reservedAmount}
              onChange={(event) => {
                event.stopPropagation();
                handleReservedChange(Number.parseInt(event.target.value, 10));
              }}
              className="h-5 w-full cursor-pointer accent-[#031F82]"
              aria-label="Reserve amount for brother's phone case"
            />
            <p className="mt-3 text-center font-heading text-xs font-bold text-[#031F82]">
              ${reservedAmount} secured · ${spendableToday} free today
            </p>
          </div>
        </LessonScreenPane>

        {/* Screen 6: Sequence Stack */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            What should Lars do with the $5 he has left over after putting aside
            the money he needs for Senna&apos;s gift?
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Drag the choices in the correct order, starting with what would be
            best for Lars to do.
          </p>
          <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Best → Avoid
          </p>
          <div className="mt-3 space-y-2">
            {rankOrder.map((itemId, index) => {
              const item = RANK_ITEMS.find((entry) => entry.id === itemId);
              if (!item) return null;
              return (
                <div
                  key={itemId}
                  draggable={!rankSubmitted}
                  onDragStart={() => setDragRankId(itemId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    if (dragRankId === null) return;
                    const fromIndex = rankOrder.indexOf(dragRankId);
                    moveRankItem(fromIndex, index);
                    setDragRankId(null);
                  }}
                  onDragEnd={() => setDragRankId(null)}
                  className={cn(
                    lessonChoiceClass,
                    !rankSubmitted && "cursor-grab active:cursor-grabbing",
                    rankSubmitted && "border-[#22C55E] bg-[#DCFCE7]/50",
                  )}
                >
                  <span className="mr-2 font-heading text-[#0CC1E0]">
                    {index + 1}.
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
          {!rankSubmitted ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRankSubmit();
                }}
                className={submitAnswerClass}
              >
                Submit Answer
              </button>
            </div>
          ) : null}
          {rankSuccessMessage ? (
            <p className="mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 font-sans text-sm text-[#031F82]">
              {rankSuccessMessage}
            </p>
          ) : null}
        </LessonScreenPane>

        {/* Screen 7: Reveal Tap */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Fast forward to next week! Tap the gift box to help Lars deliver his
            promise to Senna.
          </p>
          <div className="mt-6 flex items-end justify-between gap-2 px-2">
            <div className="text-center">
              <p className="text-4xl" aria-hidden>
                🧑
              </p>
              <p className="mt-1 font-heading text-[10px] font-bold text-[#031F82]">
                Lars
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleGiftTap();
              }}
              disabled={giftRevealed}
              className={cn(
                "rounded-2xl border-b-4 border-[#9A5F00] bg-gradient-to-br from-[#FFE082] to-[#FFA503] px-6 py-4 text-4xl shadow-md transition-transform hover:scale-105 active:scale-95",
                giftRevealed && "scale-110 border-[#22C55E] bg-[#DCFCE7] shadow-[0_0_24px_rgba(34,197,94,0.45)]",
              )}
              aria-label="Tap gift box"
            >
              {giftRevealed ? "🎁✨" : "🎁"}
            </button>
            <div className="text-center">
              <p className="text-4xl" aria-hidden>
                🧒
              </p>
              <p className="mt-1 font-heading text-[10px] font-bold text-[#031F82]">
                Senna
              </p>
            </div>
          </div>
          {giftRevealed ? (
            <div className="mt-5 rounded-xl border border-[#22C55E]/40 bg-[#DCFCE7] px-4 py-4 shadow-md">
              <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
                Lesson complete! You&apos;ve unlocked one of the most important
                secrets of money. By looking after your needs before spending on
                wants you can keep your promises and smash your money goals.
              </p>
            </div>
          ) : null}
        </LessonScreenPane>

        {/* Screen 8: Milestone Splash */}
        <LessonScreenPane>
          <LessonCompletionPane
            xpReward={M1_L2_XP_REWARD}
            perfectStreakBonus={M1_L2_PERFECT_STREAK_BONUS}
            perfectStreak={perfectStreak}
            achievementSkillId={M1_L2_ACHIEVEMENT_SKILL_ID}
          />
        </LessonScreenPane>
      </AcademyLessonShell>
    </div>
  );
}
