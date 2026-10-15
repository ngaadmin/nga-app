"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import {
  ALLOCATION_KNOB_PX,
  allocationNextEnabled,
  allocationSavedBadge,
  allocationTargetMarker,
  allocationTrackInsetPx,
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
  const barRef = useRef<HTMLDivElement>(null);
  const inset = allocationTrackInsetPx();

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
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    applySave(saveAmountFromClientX(clientX, rect.left, rect.width, total));
  };

  const knobCenter = `calc(${inset}px + (100% - ${ALLOCATION_KNOB_PX}px) * ${savePct / 100})`;
  const markerCenter = `calc(${inset}px + (100% - ${ALLOCATION_KNOB_PX}px) * ${targetPct / 100})`;
  const markerAlign =
    targetPct >= 70 ? "translateX(-85%)" : targetPct <= 30 ? "translateX(-15%)" : "translateX(-50%)";

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
          role="slider"
          tabIndex={0}
          aria-label="Save amount"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={reservedAmount}
          aria-valuetext={`${dollar(reservedAmount)} saved`}
          className="relative mt-2 h-24 touch-none select-none"
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
          {showTargetTick ? (
            <span
              className="pointer-events-none absolute top-0 z-raised flex flex-col items-center"
              style={{ left: markerCenter, transform: markerAlign }}
            >
              <span className="whitespace-nowrap rounded-full bg-[#C2410C] px-2.5 py-1 font-sans text-[13px] font-extrabold text-white shadow-[0_2px_6px_rgba(194,65,12,0.35)]">
                {allocationTargetMarker(targetMin)}
              </span>
              <span className="h-3 w-1 rounded-full bg-[#C2410C]" aria-hidden />
            </span>
          ) : null}
          <div
            ref={barRef}
            className="pointer-events-none absolute bottom-3 h-3 overflow-hidden rounded-full"
            style={{
              left: inset,
              right: inset,
              backgroundColor: TRACK_NAVY,
            }}
            aria-hidden
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${savePct}%`, backgroundColor: TRACK_GOLD }}
            />
          </div>
          {showTargetTick ? (
            <span
              className="pointer-events-none absolute bottom-1.5 h-7 w-1.5 -translate-x-1/2 rounded-full bg-[#C2410C]"
              style={{ left: markerCenter }}
              aria-hidden
            />
          ) : null}
          <span
            className="pointer-events-none absolute bottom-0 z-raised -translate-x-1/2 rounded-full border-[3px] border-white bg-[#FFA503] shadow-[0_2px_8px_rgb(3_31_130_/_0.35)]"
            style={{
              left: knobCenter,
              width: ALLOCATION_KNOB_PX,
              height: ALLOCATION_KNOB_PX,
            }}
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
