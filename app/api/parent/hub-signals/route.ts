import { NextResponse } from "next/server";
import { loadParentHubUnreadCount } from "@/lib/launchpad/parent-approval/server";
import { loadParentTabAccess } from "@/lib/parent/parent-tab-server";
import type { ParentHubSignals } from "@/lib/parent/hub-signals-type";

export const dynamic = "force-dynamic";

/**
 * What the top bar needs for a parent: whether the Parent Hub opens, and how
 * many Launchpad requests are waiting (the red dot and the menu count).
 *
 * This is a plain GET, not a server action. Server actions in the browser run
 * strictly one after another, so these two used to wait behind every other
 * action on the page (progress, cash-in, household and so on). Here both
 * checks run at once and don't queue. Same checks as before: the signed-in
 * parent is read from the session on the server, nothing comes from the URL.
 */
export async function GET() {
  const [access, unreadCount] = await Promise.all([loadParentTabAccess(), loadParentHubUnreadCount()]);
  const body: ParentHubSignals = { access, unreadCount };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
