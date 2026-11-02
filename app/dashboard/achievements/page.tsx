import { redirect } from "next/navigation";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";
import { PROFILE_ACHIEVEMENTS_QUERY } from "@/lib/dashboard/profile-deep-link";

/**
 * Old Achievements page. Achievements now live in the profile, so old links
 * land on the dashboard with the profile open at its Achievements section.
 */
export default function AchievementsPage() {
  redirect(`${DASHBOARD_DEFAULT_HREF}?${PROFILE_ACHIEVEMENTS_QUERY}`);
}
