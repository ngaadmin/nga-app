"use client";

import { useMemo } from "react";
import type { JourneyStaggerSide } from "@/lib/dashboard/journey-stagger";

const BRIDGE_VIEW_HEIGHT = 100;

function staggerAnchorPercent(stagger: JourneyStaggerSide): number {
  switch (stagger) {
    case "left":
      return 22;
    case "right":
      return 78;
    case "center":
      return 50;
  }
}

/** Segment is walked once the learner has reached the downstream milestone index. */
function isWalkedSegment(
  segmentIndex: number,
  activeStepIndex: number,
): boolean {
  return segmentIndex + 1 <= activeStepIndex;
}

function buildCurvedPathD(
  fromStagger: JourneyStaggerSide,
  toStagger: JourneyStaggerSide,
): string {
  const startX = staggerAnchorPercent(fromStagger);
  const endX = staggerAnchorPercent(toStagger);

  return `M ${startX} 0 C ${startX} ${BRIDGE_VIEW_HEIGHT * 0.38}, ${endX} ${BRIDGE_VIEW_HEIGHT * 0.62}, ${endX} ${BRIDGE_VIEW_HEIGHT}`;
}

export type JourneyPathBridgeProps = {
  fromStagger: JourneyStaggerSide;
  toStagger: JourneyStaggerSide;
  segmentIndex: number;
  activeStepIndex: number;
};

export function JourneyPathBridge({
  fromStagger,
  toStagger,
  segmentIndex,
  activeStepIndex,
}: JourneyPathBridgeProps) {
  const walked = isWalkedSegment(segmentIndex, activeStepIndex);

  const pathD = useMemo(
    () => buildCurvedPathD(fromStagger, toStagger),
    [fromStagger, toStagger],
  );

  return (
    <div
      className="relative z-0 h-12 w-full shrink-0 sm:h-14"
      aria-hidden
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${BRIDGE_VIEW_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke={walked ? "#6B7280" : "#D1D5DB"}
          strokeOpacity={walked ? 1 : 0.35}
          strokeWidth={2}
          strokeDasharray="3 5"
          strokeLinecap="round"
          vectorEffect="nonScalingStroke"
        />
      </svg>
    </div>
  );
}
