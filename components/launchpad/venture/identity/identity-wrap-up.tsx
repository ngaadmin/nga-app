"use client";

import type { LaunchpadIdentityWrapUp } from "@/lib/launchpad/content/types";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";
import { BinderCard, HandRule } from "@/components/launchpad/venture/handbook/paper-art";
import { Doodle, HandbookSection, useSectionLines } from "@/components/launchpad/venture/handbook/handbook-page";
import { BTN_ORANGE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { OpenSteps, OpenStepsHint, type OpenStep } from "@/components/launchpad/venture/open-steps";
import { useIdentityAnswer, useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import { IdentityEditor } from "@/components/launchpad/venture/identity/identity-choices";

/**
 * Silver wrap-up "identity-wrap-up": the learner's one logo, drawn from the
 * saved answer, with every pick editable right here through the Logo and
 * Name tabs (edits save to the same answer and the learner stays on this
 * screen). Confirm and continue marks it done.
 * Drawn on the shared binder page (wrapup-binder-r1, screen A): the paper
 * card with the spiral binding, the logo lockup, then the editor and the
 * page's handbook sections.
 */
export function IdentityWrapUp({
  level,
  silverTitle,
  wrapUp,
  choices,
  onBuilding,
  onCorridor,
  onFinalize,
  openSteps = [],
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadIdentityWrapUp;
  choices: IdentityChoices;
  onBuilding: () => void;
  onCorridor: () => void;
  onFinalize: () => void;
  /** Steps left open ("Come back to this later"): listed, and the confirm button stays off until they are done. */
  openSteps?: readonly OpenStep[];
}) {
  const { answer, update, save } = useIdentityAnswer(wrapUp.answerKey);
  const ctx = useLaunchpadAnswers();
  const sections = useSectionLines(wrapUp.handbookSections ?? []).filter((x) => x.lines.length);
  return (
    <section className="flex flex-1 flex-col" data-wrap-up="identity">
      <TrailCrumb level={level} current={silverTitle} onBuilding={onBuilding} onCorridor={onCorridor} />
      <Heading>{wrapUp.heading}</Heading>
      {wrapUp.body && <SubLine className="mb-3">{wrapUp.body}</SubLine>}

      <BinderCard className="mt-1" data-identity-binder="">
        <div className="flex flex-col items-center gap-3 pt-1" data-identity-lockup="">
          <BusinessLogo answer={answer} size="hb" namePlaceholder="Your business name" />
        </div>
        <HandRule />
        <IdentityEditor choices={choices} answer={answer} update={update} idPrefix="wrapup" />
        {sections.map(({ section, lines }, i) => (
          <HandbookSection
            key={section.id}
            section={section}
            lines={lines}
            doodle={i === sections.length - 1 ? <Doodle ventureId={ctx?.iconVentureId ?? ""} /> : undefined}
          />
        ))}
      </BinderCard>

      <OpenSteps steps={openSteps} />
      <div className="mx-5 mt-auto pb-4">
        <OpenStepsHint count={openSteps.length} id="wrap-up-open-hint" />
        <button
          type="button"
          className={`${BTN_ORANGE} w-full disabled:opacity-50`}
          disabled={openSteps.length > 0}
          aria-describedby={openSteps.length > 0 ? "wrap-up-open-hint" : undefined}
          onClick={() => {
            save({ ...answer, finalized: true });
            onFinalize();
          }}
        >
          {wrapUp.finalizeLabel}
        </button>
      </div>
    </section>
  );
}
