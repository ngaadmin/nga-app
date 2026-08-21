import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSupabaseAuthCookie(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("sb-") || lower.includes("supabase");
}

function expireCookie(response: NextResponse, name: string, secure: boolean) {
  const base = {
    name,
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax" as const,
    secure,
  };
  response.cookies.set({ ...base, httpOnly: true });
  response.cookies.set(base);
}

export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  const names = [
    ...new Set(
      cookieStore
        .getAll()
        .map((cookie) => cookie.name)
        .filter(isSupabaseAuthCookie),
    ),
  ];

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Still expire cookies below so `/` cannot read leftover claims.
  }

  const response = NextResponse.json({ ok: true });
  for (const name of names) {
    expireCookie(response, name, secure);
  }
  return response;
}
