"use client";

import { lessonCardClass } from "@/components/academy/lesson/academy-lesson-shell";
import { M1_L2_CUSTOM } from "@/lib/academy/lessons/content/m1-l2";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import {
  cnLessonChoice,
  lessonSortChipClass,
  lessonSubmitAnswerClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import {
  playLessonSuccessPing,
  triggerLessonErrorVibration,
} from "@/lib/academy/lessons/utils";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const submitAnswerClass = lessonSubmitAnswerClass;

type BudgetState = {
  busChecked: boolean;
  drinkChecked: boolean;
  cableChecked: boolean;
  setBusChecked: (value: boolean) => void;
  setDrinkChecked: (value: boolean) => void;
  setCableChecked: (value: boolean) => void;
};

type ReserveState = {
  reservedAmount: number;
  setReservedAmount: (value: number) => void;
};

type M1L2CustomScreensProps = {
  renderer: string;
  screenIndex: number;
  flow: LessonFlow;
  onPersistentError: (message: string) => void;
  onDismissError: () => void;
  onFlashSuccess: () => void;
  budget?: BudgetState;
  reserve?: ReserveState;
  rankConfig?: typeof M1_L2_CUSTOM.rank;
};

export function M1L2CustomScreen({
  renderer,
  screenIndex,
  flow,
  onPersistentError,
  onDismissError,
  onFlashSuccess,
  budget,
  reserve,
  rankConfig,
}: M1L2CustomScreensProps) {
  switch (renderer) {
    case "m1-l2-budget-wallet":
      return budget ? (
        <BudgetWalletScreen
          screenIndex={screenIndex}
          flow={flow}
          onPersistentError={onPersistentError}
          onDismissError={onDismissError}
          budget={budget}
        />
      ) : null;
    case "m1-l2-reserve-slider":
      return reserve ? (
        <ReserveSliderScreen
          screenIndex={screenIndex}
          flow={flow}
          onDismissError={onDismissError}
          reserve={reserve}
        />
      ) : null;
    case "m1-l2-rank-stack":
      return (
        <RankStackScreen
          screenIndex={screenIndex}
          flow={flow}
          onPersistentError={onPersistentError}
          onDismissError={onDismissError}
          onFlashSuccess={onFlashSuccess}
          rankConfig={rankConfig}
        />
      );
    case "m1-l2-gift-reveal":
      return (
        <GiftRevealScreen
          screenIndex={screenIndex}
          flow={flow}
          onFlashSuccess={onFlashSuccess}
        />
      );
    default:
      return null;
  }
}

function BudgetWalletScreen({
  flow,
  onPersistentError,
  onDismissError,
  budget,
}: Omit<M1L2CustomScreensProps, "renderer" | "onFlashSuccess" | "reserve"> & {
  budget: BudgetState;
}) {
  const config = M1_L2_CUSTOM.budget;
  const { busChecked, drinkChecked, cableChecked } = budget;

  const budgetSpent =
    (busChecked ? 15 : 0) + (drinkChecked ? 10 : 0) + (cableChecked ? 15 : 0);
  const budgetRemaining = config.total - budgetSpent;

  const toggle = (item: "bus" | "drink" | "cable", nextChecked: boolean) => {
    onDismissError();
    const nextBus = item === "bus" ? nextChecked : busChecked;
    const nextDrink = item === "drink" ? nextChecked : drinkChecked;
    const nextCable = item === "cable" ? nextChecked : cableChecked;
    const nextSpent =
      (nextBus ? 15 : 0) + (nextDrink ? 10 : 0) + (nextCable ? 15 : 0);

    if (nextSpent > config.total) {
      flow.incrementMistake();
      onPersistentError(config.errors.overBudget);
      return;
    }

    if (item === "bus") budget.setBusChecked(nextChecked);
    if (item === "drink") budget.setDrinkChecked(nextChecked);
    if (item === "cable") budget.setCableChecked(nextChecked);
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{config.intro}</p>
      <div className={cn(lessonCardClass, "mt-5 text-center")}>
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          {config.walletLabel}
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
        {config.items.map((item) => {
          const checked =
            item.id === "bus"
              ? busChecked
              : item.id === "drink"
                ? drinkChecked
                : cableChecked;
          return (
            <label
              key={item.id}
              className={cn(
                cnLessonChoice(checked, "neutral"),
                "flex cursor-pointer items-center gap-3",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  event.stopPropagation();
                  toggle(item.id, event.target.checked);
                }}
                className="h-5 w-5 accent-[#0CC1E0]"
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

function ReserveSliderScreen({
  onDismissError,
  reserve,
}: Omit<M1L2CustomScreensProps, "renderer" | "onPersistentError" | "onFlashSuccess" | "budget"> & {
  reserve: ReserveState;
}) {
  const config = M1_L2_CUSTOM.reserve;
  const { reservedAmount, setReservedAmount } = reserve;
  const spendableToday = config.total - reservedAmount;
  const energyDrinkLocked =
    reservedAmount >= config.target && spendableToday < config.energyDrinkPrice;

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{config.intro}</p>
      <div className="mt-5 flex justify-center gap-3">
        <div
          className={cn(
            lessonCardClass,
            "flex w-28 shrink-0 flex-col items-center p-3 text-center transition-opacity",
            reservedAmount >= config.target
              ? "border-2 border-[#031F82] bg-[#BDE9FB]/30"
              : "opacity-80",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#031F82]/10 text-2xl">
            📱
          </span>
          <p className="mt-2 font-heading text-[10px] font-extrabold text-[#031F82]">
            {config.phoneCaseLabel}
          </p>
          <p className="font-heading text-xs font-bold text-[#0CC1E0]">
            ${config.phoneCaseAmount}
          </p>
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
            {config.energyDrinkLabel}
          </p>
          <p className="font-heading text-xs font-bold text-[#FFA503]">
            ${config.energyDrinkAmount}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-6">
        <input
          type="range"
          min={0}
          max={config.total}
          step={1}
          value={reservedAmount}
          onChange={(event) => {
            event.stopPropagation();
            onDismissError();
            setReservedAmount(Number.parseInt(event.target.value, 10));
          }}
          className="h-5 w-full cursor-pointer accent-[#031F82]"
          aria-label="Reserve amount for brother's phone case"
        />
        <p className="mt-3 text-center font-heading text-xs font-bold text-[#031F82]">
          ${reservedAmount} secured · ${spendableToday} free today
        </p>
      </div>
    </>
  );
}

function RankStackScreen({
  screenIndex,
  flow,
  onPersistentError,
  onDismissError,
  onFlashSuccess,
  rankConfig,
}: Omit<M1L2CustomScreensProps, "renderer" | "budget" | "reserve"> & {
  rankConfig?: typeof M1_L2_CUSTOM.rank;
}) {
  const config = rankConfig ?? M1_L2_CUSTOM.rank;
  type RankItemId = (typeof config.items)[number]["id"];
  const [rankOrder, setRankOrder] = useState<RankItemId[]>(() =>
    [...config.items].map((item) => item.id).reverse() as RankItemId[],
  );
  const [rankSubmitted, setRankSubmitted] = useState(false);
  const [rankSuccessMessage, setRankSuccessMessage] = useState<string | null>(
    null,
  );
  const [dragRankId, setDragRankId] = useState<RankItemId | null>(null);

  const correctOrder = [...config.correctOrder];

  const moveRankItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || rankSubmitted) return;
    const next = [...rankOrder];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    setRankOrder(next);
    onDismissError();
  };

  const getRankSubmitError = (order: RankItemId[]): string => {
    for (let i = 0; i < correctOrder.length; i += 1) {
      if (order[i] !== correctOrder[i]) {
        const wrongId = order[i];
        const keyed = config.errors[wrongId as keyof typeof config.errors];
        if (keyed) return keyed;
        break;
      }
    }
    return Object.values(config.errors)[0] ?? "Not quite! Try again!";
  };

  const handleSubmit = () => {
    if (rankSubmitted) return;
    const valid =
      rankOrder.length === correctOrder.length &&
      rankOrder.every((id, index) => id === correctOrder[index]);

    if (valid) {
      onDismissError();
      setRankSuccessMessage(config.successMessage);
      setRankSubmitted(true);
      flow.markScreenReady(screenIndex);
      playLessonSuccessPing();
      onFlashSuccess();
      return;
    }

    flow.incrementMistake();
    onPersistentError(getRankSubmitError(rankOrder));
    triggerLessonErrorVibration();
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{config.intro}</p>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {config.dragHint}
      </p>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {config.axisLabel}
      </p>
      <div className="mt-3 space-y-2">
        {rankOrder.map((itemId, index) => {
          const item = config.items.find((entry) => entry.id === itemId);
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
                lessonSortChipClass,
                "w-full text-left",
                !rankSubmitted && "cursor-grab active:cursor-grabbing",
                rankSubmitted && "border-[#22C55E] bg-[#DCFCE7]/50",
              )}
            >
              <span className="mr-2 font-heading text-[#0CC1E0]">{index + 1}.</span>
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
              handleSubmit();
            }}
            className={submitAnswerClass}
          >
            {config.submitLabel}
          </button>
        </div>
      ) : null}
      {rankSuccessMessage ? (
        <p className="mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 font-sans text-sm text-[#031F82]">
          {rankSuccessMessage}
        </p>
      ) : null}
    </>
  );
}

function GiftRevealScreen({
  screenIndex,
  flow,
  onFlashSuccess,
}: Pick<M1L2CustomScreensProps, "screenIndex" | "flow" | "onFlashSuccess">) {
  const config = M1_L2_CUSTOM.gift;
  const [revealed, setRevealed] = useState(false);

  const handleTap = () => {
    if (revealed) return;
    setRevealed(true);
    flow.markScreenReady(screenIndex);
    playLessonSuccessPing();
    onFlashSuccess();
  };

  return (
    <>
      <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">{config.intro}</p>
      <div className="mt-6 flex items-end justify-between gap-2 px-2">
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            {config.characterLeft.emoji}
          </p>
          <p className="mt-1 font-heading text-[10px] font-bold text-[#031F82]">
            {config.characterLeft.label}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleTap();
          }}
          disabled={revealed}
          className={cn(
            "rounded-2xl border-b-4 border-[#9A5F00] bg-gradient-to-br from-[#FFE082] to-[#FFA503] px-6 py-4 text-4xl shadow-md transition-transform hover:scale-105 active:scale-95",
            revealed &&
              "scale-110 border-[#22C55E] bg-[#DCFCE7] shadow-[0_0_24px_rgba(34,197,94,0.45)]",
          )}
          aria-label="Tap gift box"
        >
          {revealed ? "🎁✨" : "🎁"}
        </button>
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            {config.characterRight.emoji}
          </p>
          <p className="mt-1 font-heading text-[10px] font-bold text-[#031F82]">
            {config.characterRight.label}
          </p>
        </div>
      </div>
      {revealed ? (
        <div className="mt-5 rounded-xl border border-[#22C55E]/40 bg-[#DCFCE7] px-4 py-4 shadow-md">
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {config.revealMessage}
          </p>
        </div>
      ) : null}
    </>
  );
}
