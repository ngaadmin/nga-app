export const USER_SESSION_UPDATED_EVENT = "nga:user-session-updated";

export function dispatchUserSessionUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(USER_SESSION_UPDATED_EVENT));
}
