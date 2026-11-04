"use client";

import type { LaunchpadIdentityWrapUp } from "@/lib/launchpad/content/types";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { BTN_ORANGE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import { IdentityEditor } from "@/components/launchpad/venture/identity/identity-choices";

/**
 * Silver wrap-up "identity-wrap-up": the learner's one logo, drawn from the
 * saved answer, with every pick editable right here through the Logo and
 * Name tabs (edits save to the same answer and the learner stays on this
 * screen). Confirm and continue marks it done.
 * The frame is a PLACEHOLDER pending Jasper's wrap-up art.
 */
export function IdentityWrapUp({
  level,
  silverTitle,
  wrapUp,
  choices,
  onBuilding,
  onCorridor,
  onFinalize,
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadIdentityWrapUp;
  choices: IdentityChoices;
  onBuilding: () => void;
  onCorridor: () => void;
  onFinalize: () => void;
}) {
  const { answer, update, save } = useIdentityAnswer(wrapUp.answerKey);
  return (
    <section className="flex flex-1 flex-col" data-wrap-up="identity">
      <TrailCrumb level={level} current={silverTitle} onBuilding={onBuilding} onCorridor={onCorridor} />
      <Heading>{wrapUp.heading}</Heading>
      {wrapUp.body && <SubLine className="mb-3">{wrapUp.body}</SubLine>}

      <div
        className="relative mx-5 mt-1 flex min-h-[230px] items-center justify-center rounded-3xl bg-[#F9FAFB] px-4 py-5"
        style={wrapUp.placeholder ? { border: `2px dashed ${VT.panel}` } : undefined}
        data-placeholder-frame={wrapUp.placeholder ? "" : undefined}
      >
        {wrapUp.placeholder && (
          <span className="absolute right-3 top-2 font-heading text-[11px] font-semibold text-nga-slate">Frame art TBC</span>
        )}
        <BusinessLogo answer={answer} namePlaceholder="Your business name" />
      </div>

      <div className="mx-5 mb-5 mt-5">
        <IdentityEditor choices={choices} answer={answer} update={update} idPrefix="wrapup" />
      </div>

      <div className="mx-5 mt-auto pb-4">
        <button
          type="button"
          className={`${BTN_ORANGE} w-full`}
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
