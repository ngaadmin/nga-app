import { redirect } from "next/navigation";
import { ClassPage } from "@/components/dashboard/class/class-page";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { lookupCurrentLearnerAccount } from "@/lib/onboarding/learner-account";
import { loadClassRoster } from "@/lib/school/class-roster";

export const dynamic = "force-dynamic";

export default async function DashboardClassPage() {
  const account = await lookupCurrentLearnerAccount();
  if (!account?.isTeacher || account.accountStatus !== "active") {
    redirect(DASHBOARD_ACADEMY_PATH);
  }

  const roster = await loadClassRoster();
  if (!roster.ok) {
    redirect(DASHBOARD_ACADEMY_PATH);
  }

  return <ClassPage roster={roster.roster} />;
}
