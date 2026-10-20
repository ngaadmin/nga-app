import { Z } from "@/lib/ui/layers";
import { readRecordingSuppressIntroFlag } from "@/lib/recording/suppress-intro-flag";

const COIN_TICK_KEY = "nga_lesson_coin_tick";
const FLY_MS = 680;
const TRAIL_COINS = 4;
const TRAIL_STAGGER_MS = 60;

export const COIN_COUNTER_ATTR = "data-coin-counter";

/** Zoom and fly play for screen recordings even when the OS asks for less motion. */
export function lessonMotionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const recording =
    new URLSearchParams(window.location.search).get("recording") === "1" ||
    document.documentElement.dataset.recording === "1" ||
    readRecordingSuppressIntroFlag();
  if (recording) return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where the coins pill sits when the dashboard header is not on this screen. */
export function coinCounterFallbackPoint(): { x: number; y: number } {
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  const navOffset = desktop ? 256 : 0;
  const inset = window.innerWidth >= 640 ? 24 : 16;
  return { x: navOffset + inset + 16, y: 24 };
}

export function coinCounterPoint(): { x: number; y: number } {
  const node = document.querySelector(`[${COIN_COUNTER_ATTR}]`);
  if (node instanceof HTMLElement) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  }
  return coinCounterFallbackPoint();
}

export function markCoinCounterTick(amount: number): void {
  const safe = Math.floor(amount);
  if (!Number.isFinite(safe) || safe <= 0 || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(COIN_TICK_KEY, String(safe));
  } catch {
    // The header still shows the saved balance the next time it renders.
  }
}

export function readCoinCounterTick(): number {
  if (typeof window === "undefined") return 0;
  try {
    const amount = Number(sessionStorage.getItem(COIN_TICK_KEY));
    return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  } catch {
    return 0;
  }
}

export function clearCoinCounterTick(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(COIN_TICK_KEY);
  } catch {
    // Locked storage can keep the flag. The header still shows the balance.
  }
}

function spawnCoinTrail(from: DOMRect, dx: number, dy: number): void {
  for (let index = 0; index < TRAIL_COINS; index += 1) {
    const coin = document.createElement("span");
    coin.setAttribute("aria-hidden", "true");
    coin.style.position = "fixed";
    coin.style.left = `${from.left + from.width / 2 - 14 + (index - 1.5) * 12}px`;
    coin.style.top = `${from.top + from.height / 2 - 14}px`;
    coin.style.width = "28px";
    coin.style.height = "28px";
    coin.style.borderRadius = "999px";
    coin.style.background =
      "radial-gradient(circle at 35% 30%, #FFE08A 0%, #FFB822 55%, #E89B00 100%)";
    coin.style.boxShadow = "inset 0 0 0 2px #E89B00";
    coin.style.pointerEvents = "none";
    coin.style.zIndex = String(Z.toast);
    document.body.appendChild(coin);

    const remove = () => coin.remove();
    const backup = window.setTimeout(remove, FLY_MS + index * TRAIL_STAGGER_MS + 80);
    try {
      const animation = coin.animate(
        [
          { transform: "translate(0px, 0px) scale(0.9)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.2 },
        ],
        {
          duration: FLY_MS,
          delay: index * TRAIL_STAGGER_MS,
          easing: "cubic-bezier(0.2, 0.75, 0.2, 1)",
          fill: "forwards",
        },
      );
      const done = () => {
        window.clearTimeout(backup);
        remove();
      };
      animation.onfinish = done;
      animation.oncancel = done;
    } catch {
      window.clearTimeout(backup);
      remove();
    }
  }
}

/** Moves a copy of the lesson total to the coins counter, then runs `onArrive`. */
export function flyLessonTotalToCoinCounter(
  source: HTMLElement,
  label: string,
  onArrive: () => void,
): void {
  if (!lessonMotionEnabled()) {
    onArrive();
    return;
  }

  const from = source.getBoundingClientRect();
  const target = coinCounterPoint();
  const flyer = document.createElement("p");
  flyer.textContent = label;
  flyer.setAttribute("aria-hidden", "true");
  flyer.className =
    "pointer-events-none m-0 text-center font-heading text-[44px] font-extrabold leading-none text-[#031F82]";
  flyer.style.position = "fixed";
  flyer.style.left = `${from.left}px`;
  flyer.style.top = `${from.top}px`;
  flyer.style.width = `${Math.max(from.width, 1)}px`;
  flyer.style.zIndex = String(Z.toast);
  document.body.appendChild(flyer);

  const dx = target.x - (from.left + from.width / 2);
  const dy = target.y - (from.top + from.height / 2);
  spawnCoinTrail(from, dx, dy);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    flyer.remove();
    onArrive();
  };

  const backup = window.setTimeout(finish, FLY_MS + 120);
  const done = () => {
    window.clearTimeout(backup);
    finish();
  };

  try {
    const animation = flyer.animate(
      [
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.45)`, opacity: 1 },
      ],
      {
        duration: FLY_MS,
        easing: "cubic-bezier(0.2, 0.75, 0.2, 1)",
        fill: "forwards",
      },
    );
    animation.onfinish = done;
    animation.oncancel = done;
  } catch {
    done();
  }
}
