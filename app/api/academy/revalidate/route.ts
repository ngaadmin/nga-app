import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { ACADEMY_LESSONS_CACHE_TAG } from "@/lib/academy/lessons/payload/master/fetch-published";

/**
 * Called right after a version is promoted so lessons refresh at once
 * instead of within the 5-minute revalidate window.
 *
 *   POST /api/academy/revalidate
 *   x-academy-revalidate-secret: <ACADEMY_REVALIDATE_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.ACADEMY_REVALIDATE_SECRET?.trim() ?? "";
  if (!secret) return NextResponse.json({ ok: false }, { status: 404 });
  const given = request.headers.get("x-academy-revalidate-secret") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(ACADEMY_LESSONS_CACHE_TAG);
  console.warn(JSON.stringify({ event: "academy_lessons_revalidated" }));
  return NextResponse.json({ ok: true, tag: ACADEMY_LESSONS_CACHE_TAG });
}
