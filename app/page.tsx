import { redirect } from "next/navigation";
import {
  DASHBOARD_ACADEMY_PATH,
  ONBOARDING_START_PATH,
} from "@/lib/onboarding/guest-session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect(DASHBOARD_ACADEMY_PATH);
  }

  redirect(ONBOARDING_START_PATH);
}
