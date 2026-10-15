import { notFound } from "next/navigation";
import { ClassPage } from "@/components/dashboard/class/class-page";

const PREVIEW_ROSTER = {
  teacherId: "preview-teacher",
  seatCap: 30,
  seatsUsed: 8,
  classPassword: "Yellow",
  classCohort: "pathfinder" as const,
  usernames: [
    "amber2",
    "amber3",
    "amber4",
    "amber5",
    "cedar2",
    "cedar3",
    "comet2",
    "forest6",
  ],
  classes: [
    {
      classId: "preview-class",
      label: "Pathfinder class",
      totalLifetimeXp: 0,
      students: [
        { username: "amber2", lifetimeXp: 0 },
        { username: "amber3", lifetimeXp: 0 },
        { username: "amber4", lifetimeXp: 0 },
        { username: "amber5", lifetimeXp: 0 },
        { username: "cedar2", lifetimeXp: 0 },
        { username: "cedar3", lifetimeXp: 0 },
        { username: "comet2", lifetimeXp: 0 },
        { username: "forest6", lifetimeXp: 0 },
      ],
    },
  ],
};

const FOUR_USER_ROSTER: typeof PREVIEW_ROSTER = {
  ...PREVIEW_ROSTER,
  seatsUsed: 4,
  usernames: ["amber2", "amber3", "cedar2", "forest6"],
  classes: [
    {
      classId: "preview-class",
      label: "Pathfinder class",
      totalLifetimeXp: 255,
      students: [
        { username: "amber2", lifetimeXp: 120 },
        { username: "amber3", lifetimeXp: 80 },
        { username: "cedar2", lifetimeXp: 45 },
        { username: "forest6", lifetimeXp: 10 },
      ],
    },
  ],
};

const EMPTY_ROSTER: typeof PREVIEW_ROSTER = {
  ...PREVIEW_ROSTER,
  seatsUsed: 0,
  usernames: [],
  classes: [
    {
      classId: "preview-class",
      label: "Pathfinder class",
      totalLifetimeXp: 0,
      students: [],
    },
  ],
};

/** Dev / QA only. Production class page still loads the signed-in teacher's roster. */
export default async function ClassRosterPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string; saved?: string; users?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const roster =
    params.empty === "1"
      ? EMPTY_ROSTER
      : params.users === "4"
        ? FOUR_USER_ROSTER
        : PREVIEW_ROSTER;
  return (
    <ClassPage
      roster={roster}
      passwordSaved={params.saved === "1"}
    />
  );
}
