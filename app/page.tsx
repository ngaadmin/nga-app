import { redirect } from "next/navigation";
import { ONBOARDING_ENTRY_PATH } from "@/lib/onboarding/guest-session";

/** App entry sends new users into onboarding; dashboard stays at /dashboard. */
export default function HomePage() {
  redirect(ONBOARDING_ENTRY_PATH);
}
