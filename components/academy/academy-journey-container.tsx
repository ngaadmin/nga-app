"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AcademyJourney } from "@/components/academy/academy-journey";
import { readAcademyMilestones } from "@/lib/dashboard/academy-progress-storage";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";
import {
  focusAcademyMilestone,
  parseAcademyFocusParam,
} from "@/lib/dev/academy-dev-tools";
import { getShippedLessonIdsForCohort } from "@/lib/academy/lessons/registry";
import { getLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import { isDevClient } from "@/lib/dev/client-persist";

function DevLessonJumpBar({
  onFocus,
}: {
  onFocus: (milestoneId: number) => void;
}) {
  const router = useRouter();
  const cohort = getLessonMasteryCohort();
  const shippedIds = getShippedLessonIdsForCohort(cohort);

  if (!isDevClient()) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 font-sans text-xs text-amber-950">
      <span className="font-heading font-bold uppercase tracking-wide">Dev</span>
      <span className="rounded-md bg-white px-2 py-1 font-medium capitalize text-amber-900">
        {cohort}
      </span>
      {shippedIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onFocus(id)}
          className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium hover:bg-amber-100"
        >
          Focus L{id}
        </button>
      ))}
      {shippedIds.map((id) => (
        <button
          key={`open-${id}`}
          type="button"
          onClick={() => router.push(`/dashboard/academy/lesson/${id}`)}
          className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium hover:bg-amber-100"
        >
          Open L{id}
        </button>
      ))}
      <span className="text-amber-800/80">· persists in localStorage</span>
    </div>
  );
}

export function AcademyJourneyContainer() {
  const [milestones, setMilestones] = useState<
    readonly AcademyLessonMilestoneNode[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  const applyFocus = useCallback((milestoneId: number) => {
    const next = focusAcademyMilestone(milestoneId);
    setMilestones(next);
  }, []);

  useEffect(() => {
    const focusId = parseAcademyFocusParam(window.location.search);
    if (focusId !== null) {
      setMilestones(focusAcademyMilestone(focusId));
      // Dev-only ?focus=N must not stick in the URL (avoids confusing reloads/bookmarks).
      const url = new URL(window.location.href);
      url.searchParams.delete("focus");
      const cleaned =
        url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(null, "", cleaned);
    } else {
      setMilestones(readAcademyMilestones());
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white" />
    );
  }

  return (
    <>
      <DevLessonJumpBar onFocus={applyFocus} />
      <AcademyJourney milestones={milestones} />
    </>
  );
}
