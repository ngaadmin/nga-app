"use client";

import { useId } from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";

export const CONFETTI_RAIN_DURATION_MS = 2800;
const CONFETTI_COUNT = 72;

const CONFETTI_COLORS = [
  "#FFA503",
  "#0CC1E0",
  "#031F82",
  "#22C55E",
  "#F472B6",
  "#FACC15",
  "#FB7185",
];

export type ConfettiPiece = {
  id: string;
  leftPct: number;
  delayMs: number;
  durationMs: number;
  widthPx: number;
  heightPx: number;
  color: string;
  driftVw: number;
  spinDeg: number;
  rounded: boolean;
};

export function spawnConfettiPieces(): ConfettiPiece[] {
  const stamp = Date.now();
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
    id: `confetti-${stamp}-${index}`,
    leftPct: 2 + Math.random() * 96,
    delayMs: Math.random() * 500,
    durationMs: 1800 + Math.random() * 1200,
    widthPx: 6 + Math.random() * 8,
    heightPx: 10 + Math.random() * 14,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
    driftVw: (Math.random() - 0.5) * 18,
    spinDeg: (Math.random() - 0.5) * 720,
    rounded: Math.random() > 0.55,
  }));
}

type ConfettiRainOverlayProps = {
  pieces: ConfettiPiece[];
};

export function ConfettiRainOverlay({ pieces }: ConfettiRainOverlayProps) {
  const styleId = useId().replace(/:/g, "");

  if (pieces.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes vault-confetti-rain-${styleId} {
          0% {
            transform: translate3d(0, -14vh, 0) rotate(0deg);
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 115vh, 0) rotate(var(--spin));
            opacity: 0.9;
          }
        }
      `}</style>
      <OverlayPortal>
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="absolute top-0 block shadow-sm"
            style={{
              left: `${piece.leftPct}%`,
              width: piece.widthPx,
              height: piece.heightPx,
              backgroundColor: piece.color,
              borderRadius: piece.rounded ? "9999px" : "2px",
              ["--drift" as string]: `${piece.driftVw}vw`,
              ["--spin" as string]: `${piece.spinDeg}deg`,
              animation: `vault-confetti-rain-${styleId} ${piece.durationMs}ms linear forwards`,
              animationDelay: `${piece.delayMs}ms`,
            }}
            aria-hidden
          />
        ))}
      </OverlayPortal>
    </>
  );
}

type SavingsGoalAchievedCalloutProps = {
  isVisible: boolean;
  message: string;
  kicker?: string;
};

export function SavingsGoalAchievedCallout({
  isVisible,
  message,
  kicker,
}: SavingsGoalAchievedCalloutProps) {
  const styleId = useId().replace(/:/g, "");

  if (!isVisible) return null;

  const fadeOutDelayMs = CONFETTI_RAIN_DURATION_MS - 450;

  return (
    <>
      <style>{`
        @keyframes vault-goal-callout-in-${styleId} {
          0% {
            transform: scale(0.12) rotate(-10deg);
            opacity: 0;
          }
          55% {
            transform: scale(1.12) rotate(3deg);
            opacity: 1;
          }
          75% {
            transform: scale(0.96) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes vault-goal-callout-out-${styleId} {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.06);
            opacity: 0;
          }
        }
        @keyframes vault-goal-callout-sparkle-${styleId} {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) rotate(12deg);
            opacity: 0.85;
          }
        }
      `}</style>
      <OverlayPortal className="flex min-h-[100dvh] items-center justify-center px-6">
        <div
          className="relative w-full max-w-xs text-center"
          role="status"
          aria-live="polite"
          style={{
            animation: `vault-goal-callout-in-${styleId} 560ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, vault-goal-callout-out-${styleId} 420ms ease-in ${fadeOutDelayMs}ms forwards`,
          }}
        >
            <p className="text-4xl leading-none" aria-hidden>
              <span
                className="inline-block"
                style={{
                  animation: `vault-goal-callout-sparkle-${styleId} 900ms ease-in-out infinite`,
                }}
              >
                ✨
              </span>{" "}
              🎯{" "}
              <span
                className="inline-block"
                style={{
                  animation: `vault-goal-callout-sparkle-${styleId} 900ms ease-in-out 150ms infinite`,
                }}
              >
                🎉
              </span>
            </p>
            {kicker ? (
              <p className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#0CC1E0] drop-shadow-sm">
                {kicker}
              </p>
            ) : null}
            <p className="mt-2 font-heading text-[1.75rem] font-extrabold leading-tight text-[#031F82] drop-shadow-[0_2px_0_rgba(255,165,3,0.85)] sm:text-3xl">
              {message}
            </p>
        </div>
      </OverlayPortal>
    </>
  );
}
