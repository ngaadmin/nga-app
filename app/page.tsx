import { redirect } from "next/navigation";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";

/** App entry opens the Academy dashboard map; onboarding stays at /onboarding. */
export default function HomePage() {
  redirect(DASHBOARD_DEFAULT_HREF);
}
