import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingEntryGate } from "@/components/onboarding";
import {
  DASHBOARD_ACADEMY_PATH,
  SCHOOL_SIGN_UP_PATH,
} from "@/lib/onboarding/guest-session";
import { DASHBOARD_CLASS_PATH } from "@/lib/school/paths";
import { landingShareMetadata } from "@/lib/site-share-metadata";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const share = landingShareMetadata();

export const metadata: Metadata = {
  title: "NextGenAchievers",
  description: "Finally. A fun way to learn money skills.",
  openGraph: share.openGraph,
  twitter: share.twitter,
};

export default async function SchoolHomePage() {
  let isAuthenticated = false;
  let isActiveTeacher = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId =
      typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    isAuthenticated = Boolean(userId);
    if (userId) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_teacher, account_status")
        .eq("id", userId)
        .maybeSingle();
      isActiveTeacher =
        profile?.is_teacher === true && profile.account_status === "active";
    }
  } catch {
    // Keep whatever we already learned from Auth.
  }

  if (isAuthenticated) {
    redirect(isActiveTeacher ? DASHBOARD_CLASS_PATH : DASHBOARD_ACADEMY_PATH);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
      <OnboardingEntryGate
        signUpHref={SCHOOL_SIGN_UP_PATH}
        subtitle="Login page for schools."
        primaryCtaLabel="Create class"
        secondaryCtaLabel="Teacher log in"
      />
    </div>
  );
}
