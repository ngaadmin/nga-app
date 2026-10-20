import { NextResponse } from "next/server";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";
import { deleteTeacherWithPhrase } from "@/lib/privacy/account-data-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const origin = authorizeBrowserMutation(request);
  if (!origin.ok) {
    return NextResponse.json({ success: false, error: origin.error }, { status: origin.status });
  }

  let phrase = "";
  try {
    const body = (await request.json()) as { phrase?: unknown };
    phrase = typeof body.phrase === "string" ? body.phrase : "";
  } catch {
    phrase = "";
  }

  const result = await deleteTeacherWithPhrase(phrase);
  if (!result.ok) {
    const status = result.error === "Type DELETE to confirm." ? 400 : 403;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true });
}
