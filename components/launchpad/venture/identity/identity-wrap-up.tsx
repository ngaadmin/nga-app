"use client";

import type { LaunchpadIdentityWrapUp } from "@/lib/launchpad/content/types";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";
import { BinderCard, HandRule } from "@/components/launchpad/venture/handbook/paper-art";
import { VisionBlock } from "@/components/launchpad/venture/handbook/vision-block";
import { BTN_PRIMARY, PRIMARY_LABEL, continueCopy, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { OpenSteps, OpenStepsHint, type OpenStep } from "@/components/launchpad/venture/open-steps";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";

/**
 * Silver wrap-up "identity-wrap-up": a summary only: the vision line at
 * the top, then the learner's logo and business name in the chosen font and
 * color. Picks are changed in the task or the handbook, not here. Continue
 * marks it done.
 * Drawn on the shared binder page (wrapup-binder-r1, screen A): the paper
 * card with the spiral binding, the logo lockup, then the editor and the
 * page's handbook sections.
 */
export function IdentityWrapUp({
  level,
  silverTitle,
  wrapUp,
  onBuilding,
  onCorridor,
  onFinalize,
  openSteps = [],
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadIdentityWrapUp;
  /** Kept for callers; the summary no longer shows the pick editor. */
  choices?: IdentityChoices;
  onBuilding: () => void;
  onCorridor: () => void;
  onFinalize: () => void;
  /** Steps left open ("Come back to this later"): listed, and the confirm button stays off until they are done. */
  openSteps?: readonly OpenStep[];
}) {
  const { answer, save } = useIdentityAnswer(wrapUp.answerKey);
  return (
    <section className="flex flex-1 flex-col" data-wrap-up="identity">
      <TrailCrumb level={level} current={silverTitle} onBuilding={onBuilding} onCorridor={onCorridor} />
      <Heading>{wrapUp.heading}</Heading>
      {wrapUp.body && <SubLine className="mb-3">{continueCopy(wrapUp.body)}</SubLine>}

      <BinderCard className="mt-1" data-identity-binder="">
        {/* Summary only (Cath 4 Nov 10:01pm): the vision at the top, then the
            logo and business name. The vision is the compiled H19 sentence,
            the same block as the workbook cover. */}
        {wrapUp.vision && (
          <div data-identity-vision="" className="pt-1">
            <VisionBlock spec={wrapUp.vision} />
          </div>
        )}
        <HandRule />
        <div className="flex flex-col items-center pt-1" data-identity-lockup="">
          <BusinessLogo answer={answer} size="hb" namePlaceholder="Your business name" />
        </div>
      </BinderCard>

      <OpenSteps steps={openSteps} />
      <div className="mx-5 mt-auto pb-4">
        <OpenStepsHint count={openSteps.length} id="wrap-up-open-hint" />
        <button
          type="button"
          className={`${BTN_PRIMARY} disabled:opacity-50`}
          disabled={openSteps.length > 0}
          aria-describedby={openSteps.length > 0 ? "wrap-up-open-hint" : undefined}
          onClick={() => {
            save({ ...answer, finalized: true });
            onFinalize();
          }}
        >
          {PRIMARY_LABEL}
        </button>
      </div>
    </section>
  );
}
