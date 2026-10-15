import { redirect } from "next/navigation";
import { ClassPage } from "@/components/dashboard/class/class-page";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import {
  CLASS_PASSWORD_DECRYPT_FAILED,
  isClassPasswordSetupError,
} from "@/lib/school/class-password-crypto";
import { loadClassRoster } from "@/lib/school/class-roster";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function showClassPageError(message: string): boolean {
  return (
    isClassPasswordSetupError(message) || message === CLASS_PASSWORD_DECRYPT_FAILED
  );
}

export default async function DashboardClassPage() {
  const roster = await loadClassRoster();
  if (!roster.ok) {
    // Category only. The password itself is never written to logs.
    console.error(
      "[class-page]",
      showClassPageError(roster.error) ? roster.error : "load failed",
    );
    if (showClassPageError(roster.error)) {
      return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 py-6">
          <h1 className="font-heading text-xl font-extrabold text-nga-primary">
            Class page
          </h1>
          <p className="font-sans text-sm text-nga-ink" role="alert">
            {roster.error}
          </p>
        </div>
      );
    }
    redirect(DASHBOARD_ACADEMY_PATH);
  }

  return <ClassPage roster={roster.roster} />;
}
