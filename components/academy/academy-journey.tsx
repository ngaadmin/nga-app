"use client";

import { useLayoutEffect, useRef } from "react";
import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

type AcademyJourneyProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
};

export function AcademyJourney({ milestones = [] }: AcademyJourneyProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const main = sectionRef.current?.closest("main");
    scrollContainerRef.current = main instanceof HTMLElement ? main : null;
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Academy journey"
      className="relative mx-auto flex min-h-0 w-full flex-1 flex-col bg-white"
    >
      <AcademySkillTrack
        milestones={milestones}
        scrollContainerRef={scrollContainerRef}
      />
    </section>
  );
}
