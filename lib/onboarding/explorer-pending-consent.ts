import { getComplianceTierFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import {
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  type UserSession,
} from "@/lib/onboarding/guest-session";

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

/** After login/signup: pending Explorers wait for approval; everyone else plays. */
export function registeredPlayPath(
  session: UserSession | null | undefined,
): string {
  return isExplorerPendingConsent(session)
    ? ONBOARDING_SIGN_UP_PENDING_PATH
    : DASHBOARD_ACADEMY_PATH;
}
