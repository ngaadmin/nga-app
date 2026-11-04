import type { ReactElement } from "react";
import { VentureRooftopArt } from "@/components/launchpad/venture-test/venture-rooftop-art";
import {
  SVG_HEADING_FONT,
  VT,
} from "@/components/launchpad/venture-test/venture-test-colors";

export type BuildingWindowView = {
  silverId: string;
  /** A window lights up once its silver is done. */
  lit: boolean;
};

export type BuildingFloorView = {
  level: number;
  name: string;
  /** One window per silver on that floor, in plaque order. */
  windows: readonly BuildingWindowView[];
  state: "done" | "current" | "locked";
};

function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="1.5" y="5" width="9" height="6.5" rx="1.5" fill={VT.lockIcon} />
      <path
        d="M3.5 5V3.6a2.5 2.5 0 0 1 5 0V5"
        stroke={VT.lockIcon}
        strokeWidth="1.6"
        fill="none"
      />
    </g>
  );
}

const BX = 55;
const BW = 280;
/** Upper-floor height in the art (unchanged from r3). */
const FH = 92;
/**
 * Unscaled art box height (viewBox from y -44): 92 for the rooftop, 92 per
 * upper floor, 144 for the ground floor and pavement. 5 floors = 604 (r3),
 * 6 floors = 696 (r4-tall).
 */
export function buildingArtHeight(floorCount: number): number {
  return 92 + Math.max(0, floorCount - 1) * FH + 144;
}

function windowFill(w: BuildingWindowView): string {
  return w.lit ? VT.secondary : VT.windowOff;
}

/**
 * The venture building (design r4), matching Jasper's
 * handoff-onboarding-A/building-r4-tall.svg at 1:1 (viewBox 0 -44 390 696 for
 * six floors). Floors from the data stack above the L1 ground floor, the top
 * level directly under the rooftop. Every floor, the ground floor included,
 * has one window per silver, spaced evenly (r4: L1 2, L2 2, L3 4, L4 3, L5 2,
 * L6 3). Windows carry class "win" and data-floor="Lx" as in the r4 SVG.
 */
export function VentureBuildingArt({
  floors,
}: {
  floors: readonly BuildingFloorView[];
}): ReactElement {
  const g: ReactElement[] = [];
  let k = 0;
  const key = () => `b${k++}`;

  // Roof: parapet and the rooftop terrace (generated from building-r4-tall.svg).
  g.push(<VentureRooftopArt key={key()} />);

  // Upper floors, the top level first, down to L2.
  const upper = floors
    .filter((f) => f.level > 1)
    .sort((a, b) => b.level - a.level);
  upper.forEach((f, idx) => {
    const y = 48 + idx * FH;
    const pillOn = f.state === "current";
    g.push(
      <rect key={key()} x={BX} y={y} width={BW} height={92} fill={VT.facade} />,
    );
    g.push(
      <rect
        key={key()}
        x={BX - 6}
        y={y + 86}
        width={BW + 12}
        height={7}
        rx={2}
        fill={VT.ledge}
      />,
    );
    g.push(
      <rect
        key={key()}
        x={BX + 12}
        y={y + 10}
        width={BW - 24}
        height={20}
        rx={10}
        fill={pillOn ? VT.secondary : "#fff"}
      />,
    );
    g.push(
      <text
        key={key()}
        x={BX + 24}
        y={y + 24.5}
        fontWeight={700}
        fontSize={11}
        fill={pillOn ? "#fff" : VT.slate}
        style={SVG_HEADING_FONT}
      >
        {`L${f.level} · ${f.name}`}
      </text>,
    );
    if (f.state === "locked")
      g.push(<Lock key={key()} x={BX + BW - 32} y={y + 14} />);
    const ww = 30;
    const n = f.windows.length;
    const gap = (BW - 24 - n * ww) / (n + 1);
    f.windows.forEach((w, i) => {
      const x = Math.round((BX + 12 + gap + i * (ww + gap)) * 100) / 100;
      g.push(
        <rect
          key={key()}
          className="win"
          data-floor={`L${f.level}`}
          data-silver={w.silverId}
          data-lit={w.lit ? "1" : "0"}
          x={x - 3}
          y={y + 38}
          width={ww + 6}
          height={36}
          rx={3}
          fill="#fff"
        />,
      );
      g.push(
        <rect
          key={key()}
          x={x}
          y={y + 41}
          width={ww}
          height={30}
          rx={2}
          fill={windowFill(w)}
        />,
      );
      g.push(
        <rect
          key={key()}
          x={x + ww / 2 - 1}
          y={y + 41}
          width={2}
          height={30}
          fill="#fff"
        />,
      );
      g.push(
        <rect
          key={key()}
          x={x - 5}
          y={y + 74}
          width={ww + 10}
          height={5}
          rx={2}
          fill={VT.ledge}
        />,
      );
    });
  });

  // Ground floor (L1).
  const l1 = floors.find((f) => f.level === 1);
  const y = 48 + upper.length * FH;
  const l1PillOn = l1?.state === "current";
  g.push(
    <rect key={key()} x={BX} y={y} width={BW} height={120} fill={VT.mist} />,
  );
  g.push(
    <rect
      key={key()}
      x={BX + 12}
      y={y + 10}
      width={BW - 24}
      height={20}
      rx={10}
      fill={l1PillOn ? VT.secondary : "#fff"}
    />,
  );
  g.push(
    <text
      key={key()}
      x={BX + 24}
      y={y + 24.5}
      fontWeight={700}
      fontSize={11}
      fill={l1PillOn ? "#fff" : VT.slate}
      style={SVG_HEADING_FONT}
    >
      {`L1 · ${l1?.name ?? ""}`}
    </text>,
  );
  const dx = BX + 192;
  // Window zone: pill inset to the awning's left edge (r4 rule).
  const zl = BX + 12;
  const zr = dx - 16;
  const groundWindows = l1?.windows ?? [];
  const gGap = (zr - zl - groundWindows.length * 30) / (groundWindows.length + 1);
  groundWindows.forEach((w, i) => {
    const x = Math.round((zl + gGap + i * (30 + gGap)) * 100) / 100;
    g.push(
      <rect
        key={key()}
        className="win"
        data-floor="L1"
        data-silver={w.silverId}
        data-lit={w.lit ? "1" : "0"}
        x={x - 3}
        y={y + 48}
        width={36}
        height={40}
        rx={3}
        fill="#fff"
      />,
    );
    g.push(
      <rect
        key={key()}
        x={x}
        y={y + 51}
        width={30}
        height={34}
        rx={2}
        fill={windowFill(w)}
      />,
    );
    g.push(
      <rect
        key={key()}
        x={x + 14}
        y={y + 51}
        width={2}
        height={34}
        fill="#fff"
      />,
    );
    g.push(
      <rect
        key={key()}
        x={x - 5}
        y={y + 88}
        width={40}
        height={5}
        rx={2}
        fill={VT.ledge}
      />,
    );
  });
  g.push(
    <rect
      key={key()}
      x={dx - 16}
      y={y + 38}
      width={88}
      height={12}
      rx={3}
      fill={VT.cta}
    />,
  );
  for (let i = 0; i < 4; i++) {
    g.push(
      <path
        key={key()}
        d={`M${dx - 16 + i * 22} ${y + 50} q11 8 22 0z`}
        fill={i % 2 === 0 ? VT.cta : VT.ctaShadow}
      />,
    );
  }
  g.push(
    <rect
      key={key()}
      x={dx}
      y={y + 56}
      width={56}
      height={64}
      rx={4}
      fill={VT.ink}
    />,
  );
  g.push(
    <rect
      key={key()}
      x={dx + 27}
      y={y + 56}
      width={2}
      height={64}
      fill={VT.slate}
    />,
  );
  g.push(<circle key={key()} cx={dx + 22} cy={y + 90} r={2.5} fill={VT.cta} />);
  g.push(<circle key={key()} cx={dx + 34} cy={y + 90} r={2.5} fill={VT.cta} />);
  g.push(
    <rect
      key={key()}
      x={dx - 10}
      y={y + 120}
      width={76}
      height={8}
      rx={2}
      fill={VT.step1}
    />,
  );
  g.push(
    <rect
      key={key()}
      x={dx - 18}
      y={y + 128}
      width={92}
      height={7}
      rx={2}
      fill={VT.step2}
    />,
  );
  g.push(
    <rect
      key={key()}
      x={20}
      y={y + 128}
      width={350}
      height={3}
      rx={1.5}
      fill={VT.panel}
    />,
  );

  return <>{g}</>;
}

/** r4 frame: the r3 390 x 604 box. Taller art is scaled to fit, centered, top-anchored. */
const FRAME_H = 604;

/**
 * Tap targets over each floor, in the unscaled art box. Invisible (no fill
 * drawn), so the building art is unchanged; focus shows an outline only.
 */
export function buildingFloorHitBoxes(floors: readonly BuildingFloorView[]): { level: number; y: number; height: number }[] {
  const upper = floors.filter((f) => f.level > 1).sort((a, b) => b.level - a.level);
  const boxes = upper.map((f, idx) => ({ level: f.level, y: 48 + idx * FH, height: FH }));
  if (floors.some((f) => f.level === 1)) boxes.push({ level: 1, y: 48 + upper.length * FH, height: 128 });
  return boxes;
}

function floorTapLabel(f: BuildingFloorView): string {
  const what = f.state === "done" ? "done, tap to review" : f.state === "current" ? "you are here" : "locked, tap to look inside";
  return `Level ${f.level} · ${f.name}, ${what}`;
}

/** Full-size building for screen 1 (building-r4.svg framing). Every floor can be tapped when `onSelectFloor` is set. */
export function VentureBuilding({
  floors,
  label,
  onSelectFloor,
}: {
  floors: readonly BuildingFloorView[];
  label: string;
  onSelectFloor?: (level: number) => void;
}) {
  const scale = Math.min(1, FRAME_H / buildingArtHeight(floors.length));
  return (
    <svg
      role={onSelectFloor ? "group" : "img"}
      aria-label={label}
      width="390"
      height="573"
      viewBox={`0 -44 390 ${FRAME_H}`}
      className="mx-auto mt-1 block shrink-0"
    >
      <g transform={`translate(195 -44) scale(${scale.toFixed(6)}) translate(-195 44)`}>
        <VentureBuildingArt floors={floors} />
        {onSelectFloor &&
          buildingFloorHitBoxes(floors).map((box) => {
            const f = floors.find((x) => x.level === box.level)!;
            return (
              <rect
                key={`hit-${box.level}`}
                role="button"
                tabIndex={0}
                aria-label={floorTapLabel(f)}
                data-floor-hit={`L${box.level}`}
                x={BX}
                y={box.y}
                width={BW}
                height={box.height}
                fill="transparent"
                className="cursor-pointer outline-none focus-visible:[stroke:#0cc1e0] focus-visible:[stroke-width:3]"
                onClick={() => onSelectFloor(box.level)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectFloor(box.level);
                  }
                }}
              />
            );
          })}
      </g>
    </svg>
  );
}

/**
 * Small building for the first-time intro (building-r4-small.svg framing):
 * the unscaled art in a box 232.3 high, centered in the 150 wide slot at x 226.
 */
export function VentureBuildingSmall({ floors }: { floors: readonly BuildingFloorView[] }) {
  const artH = buildingArtHeight(floors.length);
  const h = 232.3;
  const w = (h * 390) / artH;
  const x = 226 + (150 - w) / 2;
  return (
    <svg x={x.toFixed(2)} y={57.08} width={w.toFixed(2)} height={h} viewBox={`0 -44 390 ${artH}`} overflow="visible">
      <VentureBuildingArt floors={floors} />
    </svg>
  );
}
