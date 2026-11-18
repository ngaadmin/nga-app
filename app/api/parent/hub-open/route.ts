import { NextResponse } from "next/server";
import { openParentHubWithPin } from "@/lib/parent/parent-tab-server";
import { isParentTabPin } from "@/lib/parent/parent-tab-pin";

export const dynamic = "force-dynamic";

/**
 * Parent Hub entry: checks the Parent PIN and returns the Hub data in the same
 * request. A plain POST so it never waits behind other server actions on the
 * page. The PIN check, the wrong-try lock and the signed pass are exactly the
 * ones in openParentTabGate. JSON only, so a cross-site form can't post to it.
 */
export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 415, headers: noStore });
  }
  const body = (await request.json().catch(() => null)) as { pin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!isParentTabPin(pin)) {
    return NextResponse.json(
      { ok: false, reason: "wrong", error: "Enter 4 numbers.", triesLeft: 0, lockedUntil: null },
      { headers: noStore },
    );
  }
  return NextResponse.json(await openParentHubWithPin(pin), { headers: noStore });
}
