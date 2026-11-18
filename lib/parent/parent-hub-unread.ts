import { copyMatrix } from "@/constants/copyMatrix";

/**
 * Shared unread-count source for the Parent Hub signals on the parent
 * avatar (red dot) and the Parent Hub menu row (count pill).
 *
 * There is no messages table yet, so the live count is always 0. Off
 * production, `?parentUnread=N` can override the count for preview tests.
 * That query is ignored when VERCEL_ENV or NEXT_PUBLIC_VERCEL_ENV is
 * production, so it cannot leak into the live app.
 */

export const PARENT_UNREAD_QUERY_PARAM = "parentUnread";

export type ParentUnreadDeployEnv = {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_VERCEL_ENV?: string;
};

/** Direct property access so Next can inline NEXT_PUBLIC_* in the browser. */
function readDeployEnv(): ParentUnreadDeployEnv {
  return {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };
}

export function isProductionDeploy(
  env: ParentUnreadDeployEnv = readDeployEnv(),
): boolean {
  return (
    env.VERCEL_ENV === "production" || env.NEXT_PUBLIC_VERCEL_ENV === "production"
  );
}

function readQueryValue(
  search:
    | string
    | URLSearchParams
    | { get(name: string): string | null }
    | null
    | undefined,
  name: string,
): string | null {
  if (search == null) return null;
  if (typeof search === "string") {
    const query = search.includes("?") ? search.slice(search.indexOf("?") + 1) : search;
    return new URLSearchParams(query).get(name);
  }
  return search.get(name);
}

/** Parse a non-negative integer, or null when the value is missing or invalid. */
export function parseParentUnreadParam(
  raw: string | null | undefined,
): number | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) return null;
  return count;
}

/**
 * Preview and local override. Returns null when the query is absent, invalid,
 * or the deploy is production.
 */
export function readParentUnreadOverride(
  search:
    | string
    | URLSearchParams
    | { get(name: string): string | null }
    | null
    | undefined,
  env: ParentUnreadDeployEnv = readDeployEnv(),
): number | null {
  if (isProductionDeploy(env)) return null;
  return parseParentUnreadParam(
    readQueryValue(search, PARENT_UNREAD_QUERY_PARAM),
  );
}

/** Live source. No messages table yet, so this is always 0. */
export function parentHubUnreadCountFromSource(): number {
  return 0;
}

/** Resolved unread count for the two Parent Hub signals. */
export function resolveParentHubUnreadCount(options?: {
  search?:
    | string
    | URLSearchParams
    | { get(name: string): string | null }
    | null;
  env?: ParentUnreadDeployEnv;
}): number {
  const override = readParentUnreadOverride(
    options?.search,
    options?.env ?? readDeployEnv(),
  );
  if (override != null) return override;
  return parentHubUnreadCountFromSource();
}

/**
 * Visible count for the menu pill. Hidden at 0 (and below). Values above 9
 * show as "9+".
 */
export function formatParentHubUnreadCount(count: number): string | null {
  if (!Number.isInteger(count) || count <= 0) return null;
  if (count > 9) return copyMatrix.dashboard.parentHubUnread.overflowLabel;
  return String(count);
}

/** Accessible label with the exact count. Null when the signals are hidden. */
export function parentHubUnreadAriaLabel(count: number): string | null {
  if (!Number.isInteger(count) || count <= 0) return null;
  const copy = copyMatrix.dashboard.parentHubUnread;
  if (count === 1) return copy.ariaLabelOne;
  return copy.ariaLabelMany.replace("{count}", String(count));
}
