import type { ReactElement } from "react";
import { VentureRooftopArt } from "@/components/launchpad/venture-test/venture-rooftop-art";
import {
  SVG_HEADING_FONT,
  VT,
} from "@/components/launchpad/venture-test/venture-test-colors";

export type BuildingFloorView = {
  level: number;
  name: string;
  /** One window per silver on that floor. */
  windows: number;
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
/** r3 draws the ground-floor shop front with three windows whatever L1's silver count. */
export const GROUND_FLOOR_WINDOWS = 3;

/**
 * The venture building (design r3), drawn in a 390 x 604 box (viewBox y from
 * -44), matching Jasper's handoff-onboarding-A/building-r3.svg. Floors L2 to
 * L5 stack above the L1 ground floor; each upper floor has one window per
 * silver (r3 counts: L2 3, L3 6, L4 4, L5 4). The ground floor is the shop
 * front from r3 with its fixed three windows, awning and door.
 */
export function VentureBuildingArt({
  floors,
}: {
  floors: readonly BuildingFloorView[];
}): ReactElement {
  const g: ReactElement[] = [];
  let k = 0;
  const key = () => `b${k++}`;

  // Roof: parapet and the full r3 rooftop terrace (generated from building-r3.svg).
  g.push(<VentureRooftopArt key={key()} />);

  // Upper floors, L5 at the top down to L2.
  const upper = floors
    .filter((f) => f.level > 1)
    .sort((a, b) => b.level - a.level);
  upper.forEach((f, idx) => {
    const y = 48 + idx * 92;
    const lit = f.state !== "locked";
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
    const gap = (BW - 24 - f.windows * ww) / (f.windows + 1);
    for (let i = 0; i < f.windows; i++) {
      const x = BX + 12 + gap + i * (ww + gap);
      g.push(
        <rect
          key={key()}
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
          fill={lit ? VT.secondary : VT.windowOff}
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
    }
  });

  // Ground floor (L1).
  const l1 = floors.find((f) => f.level === 1);
  const y = 48 + upper.length * 92;
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
  for (let i = 0; i < GROUND_FLOOR_WINDOWS; i++) {
    const x = BX + 22 + i * 48;
    g.push(
      <rect
        key={key()}
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
        fill={VT.secondary}
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
  }
  const dx = BX + 192;
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

/** Full-size building for screen 1. */
export function VentureBuilding({
  floors,
  label,
}: {
  floors: readonly BuildingFloorView[];
  label: string;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      width="390"
      height="573"
      viewBox="0 -44 390 604"
      className="mx-auto mt-1 block shrink-0"
    >
      <VentureBuildingArt floors={floors} />
    </svg>
  );
}
