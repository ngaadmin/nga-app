import { NextResponse } from "next/server";
import { getParentPinState } from "@/lib/parent/parent-tab-server";

export const dynamic = "force-dynamic";

/**
 * Whether the signed-in parent has a Parent PIN and whether it is locked.
 * A plain GET so it never waits in the browser's one-at-a-time server action
 * queue. The parent is read from the session on the server, as before.
 */
export async function GET() {
  const state = await getParentPinState();
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
