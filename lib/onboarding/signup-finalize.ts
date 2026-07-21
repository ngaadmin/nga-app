import { mergeGhostProgressSnapshot } from "@/lib/onboarding/ghost-progress-snapshot";
import {
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/ghost-session";

/** Saves the registered session and merges any backed-up ghost progress. */
export function finalizeRegisteredSignup(session: UserSession): UserSession {
  saveUserSession(session);
  mergeGhostProgressSnapshot();
  return session;
}
