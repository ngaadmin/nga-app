"use client";

import { useEffect, useState } from "react";
import { AcademyJourney } from "@/components/academy/academy-journey";
import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import { ACCOUNT_PROGRESS_RESTORED_EVENT } from "@/lib/dashboard/account-progress-dirty";
import { LEARNING_PROGRESS_RESET_EVENT } from "@/lib/dashboard/learning-progress-reset";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

export function AcademyJourneyContainer() {
  const [milestones, setMilestones] = useState<
    readonly AcademyLessonMilestoneNode[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function refreshMilestones() {
      setMilestones(readAcademyMilestones());
    }

    refreshMilestones();
    setHydrated(true);
    window.addEventListener(LEARNING_PROGRESS_RESET_EVENT, refreshMilestones);
    window.addEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, refreshMilestones);
    return () => {
      window.removeEventListener(LEARNING_PROGRESS_RESET_EVENT, refreshMilestones);
      window.removeEventListener(ACCOUNT_PROGRESS_RESTORED_EVENT, refreshMilestones);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white" />
    );
  }

  return <AcademyJourney milestones={milestones} />;
}
