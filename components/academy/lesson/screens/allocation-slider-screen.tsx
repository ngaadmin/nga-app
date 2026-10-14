"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import {
  allocationNextEnabled,
  allocationSavedBadge,
  clampSaveAmount,
  saveAmountFromClientX,
} from "@/lib/academy/lessons/allocation-slider";
import type { AllocationSliderScreenConfig } from "@/lib/academy/lessons/types";
import type { StandardScreenProps } from "./types";

const TRACK_GOLD = "#FFA503";
const TRACK_NAVY = "#031F82";

function dollar(amount: number) {
  return `$${amount}`;
}

export function AllocationSliderScreen({
  screen,
  screenIndex,
  flow,
}: StandardScreenProps<AllocationSliderScreenConfig>) {
  const { handleComplete, handleIncomplete, handleSuccess } = useLessonScreenFlow({
    screenIndex,
    flow,
  });

  const total = Math.max(0, screen.total);
  const targetMin = Math.max(0, screen.targetMin);
  const reservedRef = useRef(0);
  const [reservedAmount, setReservedAmount] = useState(0);
  const metRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const spendableToday = Math.max(0, total - reservedAmount);
  const meetsTarget = allocationNextEnabled(reservedAmount, targetMin);
  const savePct = total > 0 ? (reservedAmount / total) * 100 : 0;
  const targetPct = total > 0 ? Math.min(100, (targetMin / total) * 100) : 0;
  const showTargetTick = targetMin > 0 && targetMin < total;

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
  };

  const applyFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    applySave(saveAmountFromClientX(clientX, rect.left, rect.width, total));
  };

  useEffect(() => {
    if (meetsTarget && !metRef.current) {
      metRef.current = true;
      handleSuccess();
      handleComplete();
      return;
    }
    if (!meetsTarget && metRef.current) {
      metRef.current = false;
      handleIncomplete();
    }
  }, [handleComplete, handleIncomplete, handleSuccess, meetsTarget]);

  return (
    <LessonScreenLayout>
      <div className="mt-1">
        <div className="mb-4 space-y-1">
          {lines.map((line) => (
            <p
              key={line}
              className="font-heading text-[20px] font-extrabold leading-snug text-[#031F82]"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="mb-2 flex items-start justify-between gap-3 px-1">
          <div className="text-left">
            <p className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
              💰 Save
            </p>
            <p className="font-heading text-xl font-extrabold tabular-nums text-[#031F82]">
              {dollar(reservedAmount)}
            </p>
            {targetMin > 0 ? (
              <p className="mt-0.5 font-sans text-[13px] font-bold text-[#C2410C]">
                needs {dollar(targetMin)}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
              🛍️ Spend
            </p>
            <p className="font-heading text-xl font-extrabold tabular-nums text-[#031F82]">
              {dollar(spendableToday)}
            </p>
          </div>
        </div>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Save amount"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={reservedAmount}
          aria-valuetext={`${dollar(reservedAmount)} saved`}
          className="relative h-12 touch-none select-none"
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            applyFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            applyFromClientX(event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              applySave(reservedRef.current + 1);
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              applySave(reservedRef.current - 1);
            }
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full"
            style={{ backgroundColor: TRACK_NAVY }}
            aria-hidden
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${savePct}%`, backgroundColor: TRACK_GOLD }}
            />
          </div>
          {showTargetTick ? (
            <span
              className="pointer-events-none absolute top-1/2 z-raised h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_#C2410C]"
              style={{ left: `${targetPct}%` }}
              aria-hidden
            />
          ) : null}
          <span
            className="pointer-events-none absolute top-1/2 z-raised size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#FFA503] shadow-[0_2px_8px_rgb(3_31_130_/_0.35)]"
            style={{ left: `${savePct}%` }}
            aria-hidden
          />
        </div>

        {meetsTarget ? (
          <p
            className="mt-3 text-center font-heading text-lg font-extrabold text-[#031F82]"
            role="status"
          >
            {allocationSavedBadge(targetMin)}
          </p>
        ) : null}
      </div>
    </LessonScreenLayout>
  );
}
