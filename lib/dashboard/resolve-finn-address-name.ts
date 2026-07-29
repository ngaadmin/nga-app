import { GUEST_USERNAME } from "@/lib/dashboard/use-dashboard-user";

export const DEMO_PROFILE_FALLBACK_USERNAME = "Kuikie";

export function resolveFinnAddressName(
  username: string,
  isLoading: boolean,
): string {
  if (isLoading) return DEMO_PROFILE_FALLBACK_USERNAME;

  const trimmed = username.trim();
  if (!trimmed || trimmed === GUEST_USERNAME) {
    return DEMO_PROFILE_FALLBACK_USERNAME;
  }

  return trimmed;
}

export function buildHighRoiWarningCopy(displayName: string): string {
  return `Whoa there, ${displayName}! High outsized returns usually carry much higher risk. In the real world, returns over 12% are highly volatile and not guaranteed. Always protect my capital baseline!`;
}

export function buildCloseBusinessWarningLead(displayName: string): string {
  return `Hold up, ${displayName}! Are you sure you want to close down your business line? Doing this will permanently clear out your current step progress data!`;
}
