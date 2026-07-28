"use client";

import { useRef } from "react";
import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

type AcademyJourneyProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
};

export function AcademyJourney({ milestones = [] }: AcademyJourneyProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-label="Academy journey"
      className="relative mx-auto flex min-h-0 w-full flex-1 flex-col bg-white"
    >
      <div
        ref={scrollContainerRef}
        className="layer-island relative z-base min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <AcademySkillTrack
          milestones={milestones}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
    </section>
  );
}
