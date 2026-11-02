/**
 * One intro card at a time. A page's first-visit hub intro (e.g. Academy)
 * registers here while it is waiting to show or showing; the Achievements tip
 * waits until nothing is pending, so the two never stack.
 */
const pending = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setHubIntroPending(id: string, isPending: boolean): void {
  const had = pending.has(id);
  if (isPending === had) return;
  if (isPending) pending.add(id);
  else pending.delete(id);
  emit();
}

export function hasPendingHubIntro(): boolean {
  return pending.size > 0;
}

export function subscribeHubIntroQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper. */
export function resetHubIntroQueue(): void {
  pending.clear();
}
