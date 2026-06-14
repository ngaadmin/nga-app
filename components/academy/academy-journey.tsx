"use client";

import { useEffect, useRef, useState } from "react";
import { AcademyContextBanner } from "@/components/academy/academy-context-banner";
import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import type { AcademyLessonMilestoneNode } from "@/lib/dashboard/academy-state";

type AcademyJourneyProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
};

export function AcademyJourney({ milestones = [] }: AcademyJourneyProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hudBannerRef = useRef<HTMLDivElement>(null);
  const [statusHeaderBottom, setStatusHeaderBottom] = useState(0);

  useEffect(() => {
    const header = document.querySelector("[data-dashboard-status-header]");
    if (!header) return;

    const syncHudTop = () => {
      setStatusHeaderBottom(header.getBoundingClientRect().bottom);
    };

    syncHudTop();

    const observer = new ResizeObserver(syncHudTop);
    observer.observe(header);
    window.addEventListener("resize", syncHudTop);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHudTop);
    };
  }, []);

  return (
    <section
      aria-label="Academy journey"
      className="relative mx-auto flex min-h-0 w-full flex-1 flex-col bg-white"
    >
      <AcademyContextBanner
        ref={hudBannerRef}
        milestones={milestones}
        topOffset={statusHeaderBottom}
      />

      <div
        ref={scrollContainerRef}
        className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <AcademySkillTrack
          milestones={milestones}
          scrollContainerRef={scrollContainerRef}
          hudBannerRef={hudBannerRef}
        />
      </div>
    </section>
  );
}
