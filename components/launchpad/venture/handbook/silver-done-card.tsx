import { BTN_PRIMARY, BTN_CYAN_OUTLINE_COMPACT, TickBadge } from "@/components/launchpad/venture-test/venture-test-ui";

/** The message under the headline (Cath's brief, AC14, verbatim). */
export const SILVER_DONE_MESSAGE =
  "See your progress in your workbook, or wait until you've completed all the steps in this level.";

/**
 * Shown right after a step's last task (Final J11 / AC14), in place of the old
 * per-step wrap-up screens: "Nice work! <step> is done.", the progress
 * message, "See my workbook" (opens the handbook at this step's page) and
 * "Keep going" (back to the corridor), plus a "Back to the lift" link. A
 * level's last step skips this and goes straight to the level-done lift.
 */
export function SilverDoneCard({
  silverId,
  silverTitle,
  onSeeHandbook,
  onKeepGoing,
  onBackToLift,
}: {
  silverId: string;
  silverTitle: string;
  onSeeHandbook: () => void;
  onKeepGoing: () => void;
  onBackToLift: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col bg-white px-5 pb-6" data-silver-done={silverId}>
      <nav aria-label="Breadcrumb" className="pt-4">
        <button type="button" onClick={onBackToLift} className="text-[14px] font-semibold text-nga-ink" data-back-to-lift="">
          ‹ Back to the lift
        </button>
      </nav>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <TickBadge size={44} />
        <h1 className="font-heading text-[24px] font-semibold leading-tight text-nga-ink">
          Nice work! {silverTitle} is done.
        </h1>
        <p className="max-w-[300px] text-[15px] leading-[1.45] text-[#374151]" data-silver-done-message="">
          {SILVER_DONE_MESSAGE}
        </p>
        <div className="mt-2 flex w-full flex-col items-center gap-3">
          <button type="button" onClick={onSeeHandbook} className={BTN_PRIMARY} data-see-handbook="">
            See my workbook
          </button>
          <button type="button" onClick={onKeepGoing} className={`${BTN_CYAN_OUTLINE_COMPACT} min-w-[140px]`} data-keep-going="">
            Keep going
          </button>
        </div>
      </div>
    </section>
  );
}
