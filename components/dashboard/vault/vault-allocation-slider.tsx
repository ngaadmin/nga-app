"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  pointerValueFromClientX,
  resolveVaultSliderStep,
  roundToSliderStep,
  VAULT_SLIDER_THUMB_INSET_PX,
} from "@/lib/dashboard/vault-allocation-slider";
import { cn } from "@/lib/utils/cn";

type VaultAllocationSliderProps = {
  value: number;
  /** Maximum assignable amount for this row (pool minus other rows). */
  max: number;
  /** Total pool — fixed track scale so other rows do not shift visually. */
  poolTotal: number;
  onChange: (value: number) => void;
  accentColor: string;
  trackClassName?: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

export function VaultAllocationSlider({
  value,
  max,
  poolTotal,
  onChange,
  accentColor,
  trackClassName = "bg-[#BDE9FB]/45",
  ariaLabel,
  disabled = false,
  className,
}: VaultAllocationSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const commit = useCallback(
    (next: number) => {
      const step = resolveVaultSliderStep(poolTotal);
      const clamped = roundToSliderStep(Math.min(max, Math.max(0, next)), step);
      if (clamped === valueRef.current) return;
      valueRef.current = clamped;
      onChange(clamped);
    },
    [max, onChange, poolTotal],
  );

  const readPointerValue = useCallback(
    (clientX: number, mode: "direct" | "dampened") => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return valueRef.current;
      return pointerValueFromClientX(clientX, rect, max, valueRef.current, mode, {
        poolTotal,
      });
    },
    [max, poolTotal],
  );

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || max <= 0) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    commit(readPointerValue(event.clientX, "dampened"));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !draggingRef.current) return;
    commit(readPointerValue(event.clientX, "dampened"));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (disabled || max <= 0) return;
    if (draggingRef.current) {
      commit(readPointerValue(event.clientX, "direct"));
    }
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || max <= 0) return;

    const step = resolveVaultSliderStep(poolTotal);
    let next = valueRef.current;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next -= step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next += step;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    commit(next);
  }

  const fillPercent =
    poolTotal > 0 ? Math.min(100, (value / poolTotal) * 100) : 0;
  const thumbLeft = `calc(${VAULT_SLIDER_THUMB_INSET_PX}px + (100% - ${VAULT_SLIDER_THUMB_INSET_PX * 2}px) * ${fillPercent / 100})`;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled || max <= 0 ? -1 : 0}
        aria-valuemin={0}
        aria-valuemax={poolTotal}
        aria-valuenow={value}
        aria-label={ariaLabel}
        aria-disabled={disabled || max <= 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex min-h-11 w-full min-w-0 touch-none select-none items-center px-3.5 py-2",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        )}
      >
        <div className="relative h-4 w-full">
          <div
            className={cn("h-4 w-full overflow-hidden rounded-full", trackClassName)}
            aria-hidden
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${fillPercent}%`, backgroundColor: accentColor }}
            />
          </div>
          <div
            className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(3,31,130,0.28)]"
            style={{
              left: thumbLeft,
              backgroundColor: accentColor,
            }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
