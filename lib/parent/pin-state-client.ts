import { getParentPinState } from "@/lib/parent/parent-tab-server";

type PinState = Awaited<ReturnType<typeof getParentPinState>>;

/** Short, so a lock that starts elsewhere is never hidden for long. The server checks every PIN anyway. */
const TTL_MS = 20_000;

let cached: { at: number; value: Promise<PinState> } | null = null;

/** Forget the saved answer (a PIN was just created or reset, or a try failed). */
export function clearParentPinStateCache(): void {
  cached = null;
}

/**
 * The PIN state the gate needs ("is there a PIN, is it locked"). It can be
 * asked for ahead of time, when the avatar menu opens, so the PIN boxes are
 * ready the moment the Parent Hub opens. Only a plain "has a PIN, not locked"
 * answer is kept; anything else is asked fresh every time.
 */
export function getParentPinStateCached(now: number = Date.now()): Promise<PinState> {
  if (cached && now - cached.at < TTL_MS) return cached.value;
  const value = getParentPinState();
  cached = { at: now, value };
  void value
    .then((state) => {
      if (cached?.value === value && !(state.ok && state.hasPin && state.lockedUntil === null)) {
        cached = null;
      }
    })
    .catch(() => {
      if (cached?.value === value) cached = null;
    });
  return value;
}

/** Start the ask now; nothing waits on it. */
export function prefetchParentPinState(): void {
  void getParentPinStateCached().catch(() => undefined);
}
