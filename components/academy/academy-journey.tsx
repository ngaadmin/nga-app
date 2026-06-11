"use client";

import { useRef } from "react";
import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import {
  ACADEMY_JOURNEY_PLACEHOLDER_STATE,
  type AcademyLessonMilestoneNode,
} from "@/lib/dashboard/academy-state";

type AcademyJourneyProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
};

export function AcademyJourney({ milestones = [] }: AcademyJourneyProps) {
  const { dayStreak, xp } = ACADEMY_JOURNEY_PLACEHOLDER_STATE;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-label="Academy journey"
      className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-white"
    >
      <AcademyMomentumHeader dayStreak={dayStreak} xp={xp} />

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scroll-padding-block:min(42%,14rem)]"
      >
        <AcademySkillTrack
          milestones={milestones}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
    </section>
  );
}
