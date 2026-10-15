import { notFound, redirect } from "next/navigation";
import { ClassUsernamesPrintScreen } from "@/components/dashboard/class/class-usernames-print";
import { masteryCohortLabel, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";
import { loadClassRoster } from "@/lib/school/class-roster";

const COHORT_EMOJI: Record<MasteryCohort, string> = {
  explorer: "🔭",
  pathfinder: "🧭",
  maverick: "🚀",
};

const PREVIEW_USERNAMES = [
  "amber2",
  "amber3",
  "amber4",
  "amber5",
  "cedar2",
  "cedar3",
  "comet2",
  "forest6",
];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Username sheet only. The class password is never loaded into this screen. */
export default async function ClassUsernamesPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (process.env.NODE_ENV !== "production" && id === "preview-teacher") {
    return (
      <ClassUsernamesPrintScreen
        classId={id}
        className="Pathfinder class"
        cohortEmoji={COHORT_EMOJI.pathfinder}
        usernames={PREVIEW_USERNAMES}
      />
    );
  }

  const roster = await loadClassRoster();
  if (!roster.ok) {
    redirect(DASHBOARD_ACADEMY_PATH);
  }
  if (roster.roster.teacherId !== id) {
    notFound();
  }

  const cohort = roster.roster.classCohort;
  return (
    <ClassUsernamesPrintScreen
      classId={id}
      className={cohort ? `${masteryCohortLabel(cohort)} class` : "Class"}
      cohortEmoji={cohort ? COHORT_EMOJI[cohort] : ""}
      usernames={[...roster.roster.usernames].sort((left, right) => left.localeCompare(right))}
    />
  );
}
