import { getComplianceTierFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import { removePersisted, writePersisted } from "@/lib/dev/client-persist";
import {
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  type UserSession,
} from "@/lib/onboarding/guest-session";

/** This browser session may keep playing after Explorer Save Progress. */
export const EXPLORER_PENDING_PLAY_OK_KEY = "nga_explorer_pending_play_ok";

/** Explorer VPC hold — legal birth-year tier, not a curriculum override. */
export function isExplorerPendingConsent(
  session: Pick<
    UserSession,
    "accessMode" | "accountRole" | "accountStatus" | "birthYear"
  > | null | undefined,
): boolean {
  if (!session || session.accessMode !== "registered") return false;
  if (session.accountRole === "parent_master") return false;
  if (session.accountStatus !== "PENDING_CONSENT") return false;
  return getComplianceTierFromBirthYear(session.birthYear) === "explorer";
}

/** After login: pending Explorers hit the grown-up gate. Signup uses ?from=signup. */
export function registeredPlayPath(
  session: UserSession | null | undefined,
): string {
  return isExplorerPendingConsent(session)
    ? ONBOARDING_SIGN_UP_PENDING_PATH
    : DASHBOARD_ACADEMY_PATH;
}

export function markExplorerPendingPlayAllowed(): void {
  writePersisted(EXPLORER_PENDING_PLAY_OK_KEY, "1");
}

export function clearExplorerPendingPlayAllowed(): void {
  removePersisted(EXPLORER_PENDING_PLAY_OK_KEY);
}

export function isExplorerPendingPlayAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(EXPLORER_PENDING_PLAY_OK_KEY) === "1"
    || window.localStorage.getItem(EXPLORER_PENDING_PLAY_OK_KEY) === "1";
}

/** Hard gate only on later return — not the immediate post-submit session. */
export function shouldBlockExplorerPendingPlay(
  session: Parameters<typeof isExplorerPendingConsent>[0],
): boolean {
  return isExplorerPendingConsent(session) && !isExplorerPendingPlayAllowed();
}
