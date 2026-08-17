import { redirect } from "next/navigation";
import { ONBOARDING_ENTRY_PATH } from "@/lib/onboarding/guest-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Legacy welcome URL. The hero now lives at `/`. */
export default function OnboardingAliasPage() {
  redirect(ONBOARDING_ENTRY_PATH);
}
