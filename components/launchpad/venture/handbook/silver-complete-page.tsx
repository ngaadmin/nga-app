import type { ReactNode } from "react";
import type { HandbookPageView } from "@/lib/launchpad/venture-test/handbook";
import { HandbookPage } from "@/components/launchpad/venture/handbook/handbook-page";
import { BTN_ORANGE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

/**
 * Draws one silver's handbook page on the "just completed" screen. Swappable:
 * dedicated handbook-page screens can replace the default without touching the flow.
 */
export type SilverPageRenderer = (props: { page: HandbookPageView; iconVentureId: string }) => ReactNode;

export const defaultSilverPageRenderer: SilverPageRenderer = ({ page, iconVentureId }) => (
  <HandbookPage page={page} editable={false} iconVentureId={iconVentureId} />
);

/**
 * Shown once, right after the learner finishes a silver (after its wrap-up when it
 * has one): that silver's handbook page as the result of the work just done, with a
 * single Continue button. Not shown when re-entering finished work.
 */
export function SilverCompletePage(props: {
  level: number;
  page: HandbookPageView;
  iconVentureId: string;
  onBuilding: () => void;
  onCorridor: () => void;
  onContinue: () => void;
  renderPage?: SilverPageRenderer;
}) {
  const render = props.renderPage ?? defaultSilverPageRenderer;
  return (
    <section className="flex flex-1 flex-col bg-white" data-silver-complete={props.page.silver.id}>
      <TrailCrumb level={props.level} current={props.page.silver.title} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <Heading className="mb-1 mt-1.5">Added to your handbook</Heading>
      <SubLine className="mb-3">Here is the page for the work you just finished.</SubLine>
      <div className="mx-5 mb-4 rounded-2xl border border-[#EDE7DC] bg-[#FDFBF7] px-5 pb-6 pt-5" data-silver-complete-card="">
        {render({ page: props.page, iconVentureId: props.iconVentureId })}
      </div>
      <div className="mx-5 mb-6 mt-auto">
        <button type="button" onClick={props.onContinue} className={`${BTN_ORANGE} w-full`}>
          Continue
        </button>
      </div>
    </section>
  );
}
