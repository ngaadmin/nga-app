"use client";

import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

type AcademyJourneyProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
};

export function AcademyJourney({ milestones = [] }: AcademyJourneyProps) {
  return (
    <section
      aria-label="Academy journey"
      className="relative mx-auto flex min-h-0 w-full flex-1 flex-col overflow-visible bg-white"
    >
      <AcademySkillTrack milestones={milestones} />
    </section>
  );
}
