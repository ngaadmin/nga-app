import type { ParentTabAccess } from "@/lib/parent/parent-tab-server";

/** Body of GET /api/parent/hub-signals. */
export type ParentHubSignals = {
  access: ParentTabAccess;
  unreadCount: number;
};
