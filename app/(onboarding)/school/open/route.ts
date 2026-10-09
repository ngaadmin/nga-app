import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyClassOpenToken } from "@/lib/school/class-open-token";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { DASHBOARD_CLASS_PATH } from "@/lib/school/paths";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const claims = verifyClassOpenToken(token);
  const signInUrl = new URL("/onboarding/sign-in", url.origin);

  if (!claims) {
    return NextResponse.redirect(signInUrl);
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, is_teacher, account_status")
      .eq("id", claims.userId)
      .maybeSingle();

    if (!profile?.id || profile.is_teacher !== true) {
      return NextResponse.redirect(new URL(DASHBOARD_ACADEMY_PATH, url.origin));
    }

    const { error: activateError } = await admin
      .from("profiles")
      .update({
        account_status: "active",
        consent_approved_at: null,
      })
      .eq("id", claims.userId)
      .eq("is_teacher", true);

    if (activateError) {
      return NextResponse.redirect(signInUrl);
    }

    const { data: userData } = await admin.auth.admin.getUserById(claims.userId);
    const email = userData.user?.email?.trim().toLowerCase();
    if (!email || email !== claims.email) {
      return NextResponse.redirect(signInUrl);
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hashedToken = link?.properties?.hashed_token;
    if (linkError || !hashedToken) {
      return NextResponse.redirect(signInUrl);
    }

    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: hashedToken,
    });
    if (verifyError) {
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.redirect(new URL(DASHBOARD_CLASS_PATH, url.origin));
  } catch {
    return NextResponse.redirect(signInUrl);
  }
}
