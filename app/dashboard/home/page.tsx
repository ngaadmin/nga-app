import { redirect } from "next/navigation";
import { DASHBOARD_SETTINGS_HREF } from "@/lib/dashboard/navigation";

export default function LegacyHomeRedirectPage() {
  redirect(DASHBOARD_SETTINGS_HREF);
}
