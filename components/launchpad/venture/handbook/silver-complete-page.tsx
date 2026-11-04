import type { ReactNode } from "react";
import { partLabel, type HandbookPageView, type MilestoneView } from "@/lib/launchpad/venture-test/handbook";
import { HandbookPage } from "@/components/launchpad/venture/handbook/handbook-page";
import { AccentLabel, BinderCard, HandRule, TagChip } from "@/components/launchpad/venture/handbook/paper-art";
import { BTN_ORANGE, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

/**
 * Draws one finished step's handbook page. Swappable: a screen can render the
 * full page in place of the milestone's "What you built" chips.
 */
export type SilverPageRenderer = (props: { page: HandbookPageView; iconVentureId: string }) => ReactNode;

export const defaultSilverPageRenderer: SilverPageRenderer = ({ page, iconVentureId }) => (
  <HandbookPage page={page} editable={false} iconVentureId={iconVentureId} />
);

function Star() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
      <path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" fill="#FFA503" strokeLinejoin="round" />
    </svg>
  );
}

/** Mini building for "Next up": line art with the next window lit. */
function MiniBuilding() {
  return (
    <svg width="46" height="60" viewBox="0 0 46 60" fill="none" stroke="#D9D1C3" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" className="flex-none" data-mini-building="">
      <path d="M6 58V8l17-6 17 6v50z" />
      <path d="M6 44h34M6 30h34M6 16h34" />
      <rect x="12" y="20" width="7" height="7" rx="1" />
      <rect x="27" y="20" width="7" height="7" rx="1" />
      <rect x="12" y="34" width="7" height="7" rx="1" />
      <rect x="27" y="34" width="7" height="7" rx="1" />
      <rect x="12" y="48" width="7" height="7" rx="1" stroke="#FFA503" strokeWidth="2" fill="#FFF3DC" />
      <rect x="27" y="48" width="7" height="10" rx="1" />
    </svg>
  );
}

/**
 * Milestone wrap-up (wrapup-binder-r1 screen C), shown once right after a step
 * is finished (after its wrap-up when it has one): "<step>: done!", how many of
 * the venture's steps are done, what was built as check chips on the binder
 * page, what is up next, and a single Continue. Not shown when re-entering
 * finished work.
 */
export function SilverCompletePage(props: {
  level: number;
  page: HandbookPageView;
  milestone: MilestoneView;
  iconVentureId: string;
  onBuilding: () => void;
  onCorridor: () => void;
  onContinue: () => void;
  renderPage?: SilverPageRenderer;
}) {
  const { page, milestone } = props;
  const pct = milestone.total ? Math.round((milestone.done / milestone.total) * 10000) / 100 : 0;
  const next = milestone.next;
  return (
    <section className="flex flex-1 flex-col bg-white pb-6" data-silver-complete={page.silver.id}>
      <TrailCrumb level={props.level} current={page.silver.title} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <div className="mb-3 ml-[22px] mr-5 mt-2">
        <h1 className="flex items-center gap-2 font-heading text-[21px] font-semibold leading-[1.25] text-[#111827]">
          {page.silver.title}: done! <Star />
        </h1>
        <p className="mt-3 text-[12.5px] font-medium text-[#6B7280]" data-milestone-steps="">
          {milestone.done} of {milestone.total} steps done
        </p>
        <div
          className="mt-1.5 h-1 rounded-sm bg-[#EDE7DC]"
          role="progressbar"
          aria-label="Steps done"
          aria-valuemin={0}
          aria-valuemax={milestone.total}
          aria-valuenow={milestone.done}
        >
          <i className="block h-full rounded-sm bg-[#3FB7DA]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <BinderCard data-silver-complete-card="">
        {props.renderPage ? (
          props.renderPage({ page, iconVentureId: props.iconVentureId })
        ) : (
          <>
            <AccentLabel as="h2">What you built</AccentLabel>
            <ul className="mt-2.5 flex flex-wrap gap-[9px]" data-what-you-built="">
              {page.bronzeTitles.map((t, i) => (
                <TagChip key={i} check>
                  {partLabel(t, i)}
                </TagChip>
              ))}
            </ul>
          </>
        )}
        <HandRule className="mb-2.5 mt-3.5" />
        <AccentLabel as="h2">Next up</AccentLabel>
        <div className="mt-2.5 flex items-center gap-3.5" data-next-up="">
          <MiniBuilding />
          <div>
            <b className="block font-heading text-[17px] font-semibold text-[#111827]">
              {next ? (next.newFloor ? `Level ${next.level}` : next.silverTitle) : "The rooftop"}
            </b>
            <span className="text-[14px] text-[#6B7280]">
              {next ? (next.newFloor ? "Your next floor is ready." : `Next on Level ${next.level}.`) : "Your building is finished."}
            </span>
          </div>
        </div>
      </BinderCard>
      <div className="ml-[22px] mr-4 mt-3.5">
        <button type="button" onClick={props.onContinue} className={`${BTN_ORANGE} w-full`}>
          Continue
        </button>
      </div>
    </section>
  );
}
