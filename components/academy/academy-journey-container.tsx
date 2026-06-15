"use client";

import { useEffect, useState } from "react";
import { AcademyJourney } from "@/components/academy/academy-journey";
import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

export function AcademyJourneyContainer() {
  const [milestones, setMilestones] = useState<
    readonly AcademyLessonMilestoneNode[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMilestones(readAcademyMilestones());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white" />
    );
  }

  return <AcademyJourney milestones={milestones} />;
}
