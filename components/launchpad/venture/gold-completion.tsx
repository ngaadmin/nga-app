import type { LaunchpadGoldCompletion } from "@/lib/launchpad/content/types";
import { BTN_ORANGE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

function GoldMedal() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" data-gold-medal="">
      <path d="M30 6h14l8 26H38z" fill="#3FB7DA" />
      <path d="M66 6H52l-8 26h14z" fill="#2A8FB0" />
      <circle cx="48" cy="58" r="30" fill="#F5B829" />
      <circle cx="48" cy="58" r="22" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
      <path d="M48 44l4.3 8.7 9.6 1.4-7 6.8 1.7 9.6L48 66l-8.6 4.5 1.7-9.6-7-6.8 9.6-1.4z" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Gold completion: shown once after the floor's last silver-complete page.
 * Heading, the gold's line, the guidance and recap from the content, and one
 * button (the lift to the next floor, or the building on the top floor).
 */
export function GoldCompletion(props: {
  level: number;
  floorName: string;
  goldTitle: string;
  completion: LaunchpadGoldCompletion;
  onBuilding: () => void;
  onCorridor: () => void;
  onContinue: () => void;
}) {
  const c = props.completion;
  return (
    <section className="flex flex-1 flex-col" data-gold-completion={props.level}>
      <TrailCrumb level={props.level} current={props.floorName} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <div className="mt-6 flex justify-center">
        <GoldMedal />
      </div>
      <Heading className="mt-3 text-center">{c.heading}</Heading>
      <SubLine className="mb-2 text-center">{c.body}</SubLine>
      {c.recap && <p className="mx-6 mt-3 rounded-2xl bg-[#FFF8E6] px-4 py-3 text-center text-[15px] leading-[1.45] text-nga-ink">{c.recap}</p>}
      {c.guidance && <p className="mx-6 mt-4 text-center text-[14px] text-nga-slate">{c.guidance}</p>}
      <div className="mx-5 mt-auto pb-4 pt-6">
        <button type="button" className={`${BTN_ORANGE} w-full`} onClick={props.onContinue}>
          {c.buttonLabel}
        </button>
      </div>
    </section>
  );
}
