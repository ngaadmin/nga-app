"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";
import { LessonCompletionConfetti } from "@/components/academy/lesson/lesson-completion-confetti";
import { lessonMotionEnabled } from "@/lib/academy/lessons/coin-counter-flight";
import { VentureRooftopArt } from "@/components/launchpad/venture-test/venture-rooftop-art";
import { BTN_ORANGE, BTN_WHITE, Heading, SubLine } from "@/components/launchpad/venture-test/venture-test-ui";

/**
 * PLACEHOLDER — pending Jasper's design. Rooftop finish screen shown once
 * every floor is done ("Go to the rooftop" on the building screen). Reuses
 * the existing r4 rooftop terrace art and the existing Academy confetti
 * burst (LessonCompletionConfetti); no new art, colors or dependencies.
 *
 * TODO: an animated celebration video is planned to replace / sit alongside
 * the confetti burst later.
 */

/** DRAFT copy — Storybird may refine. */
const ROOFTOP_HEADING = "Congratulations!";
/** DRAFT copy — Storybird may refine. */
const ROOFTOP_LINE = "You've built your business. You're on your way!";

/**
 * "Back to home" goes to the learner's main home. /dashboard/home is a legacy
 * redirect to Settings, so this uses DASHBOARD_DEFAULT_HREF (/dashboard/academy):
 * where /dashboard redirects, the logo links, and the first bottom-bar tab.
 */
const APP_HOME_HREF = DASHBOARD_DEFAULT_HREF;

export function VentureRooftopFinish({ onLaunchpadHome }: { onLaunchpadHome: () => void }) {
  // Confetti fires once on arrival (skipped when the learner prefers reduced motion).
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    if (lessonMotionEnabled()) setConfetti(true);
  }, []);
  return (
    <section className="flex flex-1 flex-col bg-white" data-placeholder="rooftop-finish" aria-labelledby="lp-rooftop-title">
      {confetti ? <LessonCompletionConfetti /> : null}
      <Heading className="mt-6 text-center">
        <span id="lp-rooftop-title">{ROOFTOP_HEADING}</span>
      </Heading>
      <SubLine className="text-center">{ROOFTOP_LINE}</SubLine>
      {/* Rooftop terrace only: the art's own box is x 47-343, y -44 to 48. */}
      <svg role="img" aria-label="Rooftop terrace" width="390" height="230" viewBox="40 -48 310 100" className="mx-auto mt-8 block shrink-0">
        <VentureRooftopArt />
      </svg>
      <div className="mx-5 mt-auto flex flex-col gap-3 pb-4 pt-8">
        {/* Primary: back to the Launchpad home (Business Ideas tiles) to pick another venture. */}
        <button type="button" className={`${BTN_ORANGE} w-full`} onClick={onLaunchpadHome}>
          Try another one
        </button>
        <Link href={APP_HOME_HREF} className={`${BTN_WHITE} w-full`}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
