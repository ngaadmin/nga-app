import type { ReactElement } from "react";
import { VentureBuildingSmall, type BuildingFloorView } from "@/components/launchpad/venture-test/venture-building";
import { SVG_HEADING_FONT, VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { BTN_ORANGE } from "@/components/launchpad/venture-test/venture-test-ui";

/** Onboarding art always shows the starting building: L1 open, the rest locked, no window lit. */
function onboardingFloors(floors: readonly BuildingFloorView[]): BuildingFloorView[] {
  return floors.map((f) => ({
    ...f,
    state: f.level === 1 ? "current" : "locked",
    windows: f.windows.map((w) => ({ ...w, lit: false })),
  }));
}

function Kit() {
  const cards: ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const y = 258 - i * 24;
    const c = i === 0 ? VT.secondary : i % 2 ? VT.ledge : VT.panel;
    cards.push(
      <g key={i}>
        <rect x={20} y={y} width={76} height={20} rx={5} fill={c} />
        <rect x={26} y={y + 5} width={10} height={10} rx={5} fill="#fff" />
        <text x={31} y={y + 13.5} textAnchor="middle" fontWeight={700} fontSize={8} fill={VT.ink} style={SVG_HEADING_FONT}>
          {i + 1}
        </text>
        {[0, 1, 2].map((k) => (
          <rect key={k} x={44 + k * 16} y={y + 7} width={11} height={6} rx={1.5} fill="#fff" opacity={0.7} />
        ))}
      </g>,
    );
  }
  return (
    <g>
      <rect x={8} y={150} width={100} height={140} rx={14} fill={VT.mist} />
      {cards}
      <text x={58} y={308} textAnchor="middle" fontWeight={700} fontSize={10} fill={VT.slate} style={SVG_HEADING_FONT}>
        Your business kit
      </text>
    </g>
  );
}

function Stack() {
  const blocks: [number, number, number][] = [
    [1, 264, 1],
    [2, 238, 1],
    [3, 212, 1],
    [4, 170, 0.55],
    [5, 128, 0.3],
  ];
  return (
    <g>
      {blocks.map(([n, y, op]) => (
        <g key={n} opacity={op}>
          <rect x={134} y={y} width={80} height={26} fill={n === 1 ? VT.mist : VT.facade} />
          <rect x={131} y={y + 23} width={86} height={4} rx={1.5} fill={VT.ledge} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={158 + k * 18} y={y + 6} width={11} height={13} rx={1.5} fill={n === 1 ? VT.secondary : VT.windowOff} />
          ))}
          <text x={143} y={y + 16.5} textAnchor="middle" fontWeight={700} fontSize={9} fill={VT.ink} style={SVG_HEADING_FONT}>
            {n}
          </text>
        </g>
      ))}
      <path d="M174 206 v-8 M170 201 l4 -4 4 4" stroke={VT.secondary} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d="M174 162 v-8 M170 157 l4 -4 4 4" stroke={VT.secondary} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} />
      <rect x={126} y={290} width={96} height={2} rx={1} fill={VT.panel} />
    </g>
  );
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
        <Kit />
        <Stack />
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
        <button type="button" onClick={onStart} className={`${BTN_ORANGE} w-full`}>
          Start building
        </button>
      </div>
    </section>
  );
}
