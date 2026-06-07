import { COPY_USERNAME_TOKEN } from "@/constants/copyMatrix";

/** Replace `[Username]` in copy-matrix greeting templates at runtime. */
export function resolveDashboardGreeting(
  template: string,
  username: string,
): string {
  return template.split(COPY_USERNAME_TOKEN).join(username);
}
