/** Longest a shared tab skeleton may cover the dashboard before we recover. */
export const PENDING_SCREEN_MAX_MS = 8_000;

/**
 * After the max wait, always drop the skeleton.
 * If the route still is not the tapped href, load that href with a full navigation.
 */
export function pendingScreenTimeoutPlan(
  pathname: string,
  pendingHref: string,
): { assignHref: string | null } {
  return { assignHref: pathname === pendingHref ? null : pendingHref };
}

export function startPendingScreenTimeout(input: {
  pendingHref: string;
  readPathname: () => string;
  clearPending: () => void;
  assign: (href: string) => void;
}): () => void {
  const timer = setTimeout(() => {
    const plan = pendingScreenTimeoutPlan(input.readPathname(), input.pendingHref);
    input.clearPending();
    if (plan.assignHref) input.assign(plan.assignHref);
  }, PENDING_SCREEN_MAX_MS);
  return () => clearTimeout(timer);
}
