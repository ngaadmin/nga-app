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

/** Dev / QA only. Production class page still loads the signed-in teacher's roster. */
export default function ClassRosterPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ClassPage roster={PREVIEW_ROSTER} />;
}
