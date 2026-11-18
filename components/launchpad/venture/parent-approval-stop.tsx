"use client";

import { copyMatrix } from "@/constants/copyMatrix";
import { BTN_PRIMARY, Heading, SubLine } from "@/components/launchpad/venture-test/venture-test-ui";

export type ParentApprovalStopState = "checking" | "pending" | "declined" | "error";

/**
 * The Launchpad parent approval stop. Shown in place of the bronze "Tell people
 * about it" for a learner whose parent has not said yes. Every word comes from
 * copyMatrix.launchpadParentApproval.learner. There is no learner button to
 * ask again: the parent changes the answer in the Parent Hub.
 */
export function ParentApprovalStop({
  state,
  onBack,
  onRetry,
}: {
  state: ParentApprovalStopState;
  onBack: () => void;
  onRetry: () => void;
}) {
  const copy = copyMatrix.launchpadParentApproval.learner;
  const body =
    state === "checking"
      ? copy.checking
      : state === "error"
        ? copy.errorBody
        : state === "declined"
          ? copy.notNowBody
          : copy.waitingBody;
  return (
    <section
      className="flex flex-1 flex-col bg-white"
      data-launchpad-parent-approval-stop={state}
      aria-live="polite"
    >
      <div className="flex flex-1 flex-col justify-center pb-10">
        <Heading>{copy.title}</Heading>
        {state === "pending" ? (
          <p
            data-launchpad-parent-approval-chip
            className="mx-5 mb-2 mt-2 inline-flex w-fit rounded-full bg-[#FFF3D6] px-3 py-1 font-heading text-[13px] font-bold text-[#8A5300]"
          >
            {copy.waitingChip}
          </p>
        ) : null}
        <SubLine className="!leading-[22px] !text-[15px]">{body}</SubLine>
        <div className="mt-6 flex flex-col items-center gap-3">
          {state === "error" ? (
            <button type="button" className={BTN_PRIMARY} onClick={onRetry}>
              {copy.retry}
            </button>
          ) : null}
          {state !== "checking" ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              data-launchpad-parent-approval-back
              onClick={onBack}
            >
              {copy.back}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
