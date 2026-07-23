"use client";

import { useId } from "react";
import { OverlayPortal } from "@/components/ui/overlay-portal";

export const COIN_RAIN_DURATION_MS = 1000;
const COIN_RAIN_COUNT = 36;

export type RainCoin = {
  id: string;
  leftPct: number;
  delayMs: number;
  durationMs: number;
  sizePx: number;
  driftVw: number;
  spinDeg: number;
};

export function spawnRainCoins(): RainCoin[] {
  const stamp = Date.now();
  return Array.from({ length: COIN_RAIN_COUNT }, (_, index) => ({
    id: `coin-rain-${stamp}-${index}`,
    leftPct: 4 + Math.random() * 92,
    delayMs: Math.random() * 350,
    durationMs: 650 + Math.random() * 450,
    sizePx: 20 + Math.random() * 16,
    driftVw: (Math.random() - 0.5) * 10,
    spinDeg: (Math.random() - 0.5) * 540,
  }));
}

function CartoonGoldCoin({ sizePx }: { sizePx: number }) {
  const fontSize = Math.max(8, Math.round(sizePx * 0.42));

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[#B87400] bg-gradient-to-br from-[#FFF1A8] via-[#FFC933] to-[#E08A00] shadow-[0_3px_0_#9A6200,inset_0_2px_5px_rgba(255,255,255,0.55)]"
      style={{ width: sizePx, height: sizePx }}
      aria-hidden
    >
      <span
        className="font-heading font-extrabold leading-none text-[#9A6200]"
        style={{ fontSize }}
      >
        $
      </span>
    </span>
  );
}

type CoinRainOverlayProps = {
  coins: RainCoin[];
};

export function CoinRainOverlay({ coins }: CoinRainOverlayProps) {
  const styleId = useId().replace(/:/g, "");

  if (coins.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes vault-coin-rain-${styleId} {
          0% {
            transform: translate3d(0, -12vh, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 112vh, 0) rotate(var(--spin));
            opacity: 0.85;
          }
        }
      `}</style>
      <OverlayPortal>
        {coins.map((coin) => (
          <span
            key={coin.id}
            className="absolute top-0"
            style={{
              left: `${coin.leftPct}%`,
              ["--drift" as string]: `${coin.driftVw}vw`,
              ["--spin" as string]: `${coin.spinDeg}deg`,
              animation: `vault-coin-rain-${styleId} ${coin.durationMs}ms linear forwards`,
              animationDelay: `${coin.delayMs}ms`,
            }}
          >
            <CartoonGoldCoin sizePx={coin.sizePx} />
          </span>
        ))}
      </OverlayPortal>
    </>
  );
}
