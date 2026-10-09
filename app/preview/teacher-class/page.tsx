import type { Metadata } from "next";
import { ClassPage } from "@/components/dashboard/class/class-page";
import { generateClassPassword } from "@/lib/school/class-password";
import type { ClassRosterSnapshot } from "@/lib/school/class-roster";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Teacher class preview",
  description:
    "Dev / QA only — local new-teacher class page. No account, no email.",
};

function emptyNewTeacherRoster(): ClassRosterSnapshot {
  return {
    teacherId: "local-preview",
    seatCap: 30,
    seatsUsed: 0,
    classPassword: generateClassPassword(),
    classCohort: null,
    usernames: [],
  };
}

/** Dev / QA route — not linked from production nav. Does not create a teacher. */
export default function TeacherClassLocalPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white px-4 py-8">
      <p className="mb-4 text-center font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-nga-primary/70">
        Local preview · new teacher class
      </p>
      <ClassPage roster={emptyNewTeacherRoster()} preview />
    </main>
  );
}
