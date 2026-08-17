import { redirect } from "next/navigation";
import { DASHBOARD_ADD_PROFILE_PATH } from "@/lib/onboarding/guest-session";

export default function AddLinkedProfileRedirectPage() {
  redirect(DASHBOARD_ADD_PROFILE_PATH);
}
