import { redirect } from "next/navigation";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";

export default function AchievementsPage() {
  redirect(DASHBOARD_DEFAULT_HREF);
}
