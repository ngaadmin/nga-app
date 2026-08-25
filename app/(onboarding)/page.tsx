import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingEntryGate } from "@/components/onboarding";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NextGenAchievers",
  description: "Finally. A fun way to learn money skills.",
};

export default async function HomePage() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  } catch {
    isAuthenticated = false;
  }

  if (isAuthenticated) {
    redirect(DASHBOARD_ACADEMY_PATH);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
      <OnboardingEntryGate />
    </div>
  );
}
