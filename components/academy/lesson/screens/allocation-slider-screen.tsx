"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import {
  LessonAnswerTick,
  LessonScreenLayout,
  lessonFeedbackCopy,
} from "@/components/academy/lesson/lesson-ui";
import {
  ALLOCATION_KNOB_PX,
  allocationGoalCaption,
  allocationNextEnabled,
  allocationSliderValueText,
  allocationTrackInsetPx,
  clampSaveAmount,
  saveAmountFromClientX,
} from "@/lib/academy/lessons/allocation-slider";
import type { AllocationSliderScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { StandardScreenProps } from "./types";

const TRACK_BASE = "#DCEFF8";
const TRACK_FILL = "#0CC1E0";
const ZONE_REST = "#FFF1CC";
const ZONE_MET = "#FFE7A3";

function dollar(amount: number) {
  return `$${amount}`;
}

function trackPosition(amount: number, total: number): string {
  const ratio = total > 0 ? amount / total : 0;
  const inset = allocationTrackInsetPx();
  return `calc(${inset}px + (100% - ${ALLOCATION_KNOB_PX}px) * ${ratio})`;
}

export function AllocationSliderScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<AllocationSliderScreenConfig>) {
  const { handleComplete, handleIncomplete, handleMistake, handleSuccess } =
    useLessonScreenFlow({
      screenIndex,
      flow,
    });

  const total = Math.max(0, screen.total);
  const targetMin = Math.max(0, screen.targetMin);
  const match = screen.match ?? "exact";
  const reservedRef = useRef(0);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const metRef = useRef(false);
  const lastSettledRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const chipLabel = screen.reserveGoals[0]?.label?.trim();
  const saveLabel = chipLabel && chipLabel !== "Set aside" ? chipLabel : "Save";
  const inset = allocationTrackInsetPx();
  const goalZone = match === "at-least" && targetMin > 0 && targetMin < total;

  const spendableToday = Math.max(0, total - reservedAmount);
  const meetsTarget = solved && allocationNextEnabled(reservedAmount, targetMin, match);
  const savePct = total > 0 ? (reservedAmount / total) * 100 : 0;
  const showGoalLabel = targetMin > 0 && targetMin < total;

  const lines = [
    ...screen.intro.split("\n").map((line) => line.trim()).filter(Boolean),
    ...(screen.instruction && !screen.intro.includes(screen.instruction)
      ? [screen.instruction.trim()]
      : []),
  ];

  const applySave = (next: number) => {
    const clamped = clampSaveAmount(next, total);
    reservedRef.current = clamped;
    setReservedAmount(clamped);
    if (!allocationNextEnabled(clamped, targetMin, match) && metRef.current) {
      metRef.current = false;
      setSolved(false);
      handleIncomplete();
    }
  };

  const shakeSlider = () => {
    if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
    setShaking(false);
    window.requestAnimationFrame(() => {
      setShaking(true);
      shakeTimerRef.current = window.setTimeout(() => {
        setShaking(false);
        shakeTimerRef.current = null;
      }, 360);
    });
  };

  const settle = (amount: number) => {
    if (allocationNextEnabled(amount, targetMin, match)) {
      lastSettledRef.current = amount;
      setError(null);
      setShaking(false);
      if (!metRef.current) {
        metRef.current = true;
        setSolved(true);
        handleSuccess();
        handleComplete();
      }
      return;
    }
    if (metRef.current) {
      metRef.current = false;
      setSolved(false);
      handleIncomplete();
    }
    if (amount === 0) {
      lastSettledRef.current = 0;
      setError(null);
      return;
    }
    if (lastSettledRef.current === amount) return;
    lastSettledRef.current = amount;
    setError(lessonFeedbackCopy(screen.sliderError) ?? null);
    shakeSlider();
    handleMistake();
  };

  const applyFromClientX = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    applySave(saveAmountFromClientX(clientX, rect.left, rect.width, total));
  };

  const knobCenter = trackPosition(reservedAmount, total);
  const goalAnchor = trackPosition(targetMin, total);

  useEffect(
    () => () => {
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    },
    [],
  );

  return (
    <LessonScreenLayout errorMessage={error}>
      <div className="mt-1">
        <div className="mb-4 space-y-1">
          {lines.map((line) => (
            <p
              key={line}
              className="font-heading text-[20px] font-extrabold leading-[1.375] text-[#031F82]"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="flex items-center gap-1.5 font-sans text-[15px] font-semibold text-[#031F82]/80">
              <AnswerEmoji emoji="🐷" />
              {saveLabel}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-heading text-[40px] font-extrabold leading-[1.05] tabular-nums text-[#031F82]">
                {dollar(reservedAmount)}
              </p>
              {meetsTarget ? <LessonAnswerTick /> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 font-sans text-[15px] font-semibold text-[#031F82]/80">
              <AnswerEmoji emoji="🛍️" />
              Spend
            </p>
            <p className="mt-1 font-heading text-[40px] font-extrabold leading-[1.05] tabular-nums text-[#031F82]">
              {dollar(spendableToday)}
            </p>
          </div>
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Save amount"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={reservedAmount}
          aria-valuetext={allocationSliderValueText(reservedAmount, targetMin, match)}
          className={cn(
            "relative h-[74px] touch-none select-none",
            shaking && "lesson-tile-shake",
          )}
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            applyFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            applyFromClientX(event.clientX);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
            settle(reservedRef.current);
          }}
          onPointerCancel={() => {
            if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
            settle(reservedRef.current);
          }}
          onKeyDown={(event) => {
            const step =
              event.key === "ArrowRight" || event.key === "ArrowUp"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowDown"
                  ? -1
                  : 0;
            if (step === 0) return;
            event.preventDefault();
            applySave(reservedRef.current + step);
            if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = window.setTimeout(() => {
              settleTimerRef.current = null;
              settle(reservedRef.current);
            }, 400);
          }}
        >
          {goalZone ? (
            <span
              className="pointer-events-none absolute h-8 rounded-2xl transition-colors duration-150"
              style={{
                left: `calc(${goalAnchor} - 8px)`,
                right: 14,
                top: 14,
                backgroundColor: meetsTarget ? ZONE_MET : ZONE_REST,
              }}
              aria-hidden
            />
          ) : null}
          <div
            ref={barRef}
            className="pointer-events-none absolute h-3.5 overflow-hidden rounded-full"
            style={{
              left: inset,
              right: inset,
              top: 23,
              backgroundColor: TRACK_BASE,
            }}
            aria-hidden
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${savePct}%`, backgroundColor: TRACK_FILL }}
            />
          </div>
          {showGoalLabel ? (
            <span
              className="pointer-events-none absolute whitespace-nowrap font-heading text-sm font-bold text-[#031F82]"
              style={{ top: 52, left: `calc(${goalAnchor} - 4px)` }}
            >
              {allocationGoalCaption(targetMin, match)}
            </span>
          ) : null}
          <span
            className="pointer-events-none absolute z-raised -translate-x-1/2 rounded-full border-[3px] border-white bg-[#FFB822] shadow-[0_2px_8px_rgba(3,31,130,0.30)]"
            style={{
              left: knobCenter,
              top: 8,
              width: ALLOCATION_KNOB_PX,
              height: ALLOCATION_KNOB_PX,
            }}
            aria-hidden
          />
        </div>
      </div>
    </LessonScreenLayout>
  );
}
