import { redirect } from "next/navigation";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/ghost-session";

export default function DashboardPage() {
  redirect(DASHBOARD_ACADEMY_PATH);
}
