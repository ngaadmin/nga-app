import { VentureBuildingSmall, type BuildingFloorView } from "@/components/launchpad/venture-test/venture-building";
import { OnboardingKit, OnboardingStack } from "@/components/launchpad/venture-test/venture-onboarding-art";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { BTN_PRIMARY } from "@/components/launchpad/venture-test/venture-test-ui";

/** Onboarding art always shows the starting building: L1 open, the rest locked, no window lit. */
function onboardingFloors(floors: readonly BuildingFloorView[]): BuildingFloorView[] {
  return floors.map((f) => ({
    ...f,
    state: f.level === 1 ? "current" : "locked",
    windows: f.windows.map((w) => ({ ...w, lit: false })),
  }));
}

/** Onboarding version A: kit → stack → building, then the headline and Start building. */
export function VentureOnboarding({
  floors,
  onStart,
}: {
  floors: readonly BuildingFloorView[];
  onStart: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col" aria-labelledby="lp-onboarding-title">
      <svg
        role="img"
        aria-label="Your business kit becomes a building, one floor at a time"
        width="390"
        height="270"
        viewBox="0 64 390 260"
        className="mx-auto mt-24 block shrink-0 overflow-visible"
      >
        <OnboardingKit />
        <OnboardingStack />
        <VentureBuildingSmall floors={onboardingFloors(floors)} />
        <path d="M382 270 V140 M375 150 l7 -10 7 10" stroke={VT.cta} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {(
          [
            [110, 126],
            [220, 238],
          ] as const
        ).map(([x1, x2]) => (
          <g key={x1}>
            <path d={`M${x1} 220 H${x2}`} stroke={VT.slate} strokeWidth={1.4} />
            <path d={`M${x2 - 4} 216.5 L${x2} 220 L${x2 - 4} 223.5`} stroke={VT.slate} strokeWidth={1.4} fill="none" />
          </g>
        ))}
      </svg>
      <h1 id="lp-onboarding-title" className="mx-[30px] mt-16 text-center font-heading text-2xl font-bold leading-[1.3] text-nga-ink">
        Build your business one floor at a time.
      </h1>
      <p className="mx-[34px] mt-2.5 text-center text-base text-nga-slate">Finish a floor, unlock the next.</p>
      <div className="mt-auto px-6 pb-11 pt-6">
        <button type="button" onClick={onStart} className={`${BTN_PRIMARY}`}>
          Start building
        </button>
      </div>
    </section>
  );
}
