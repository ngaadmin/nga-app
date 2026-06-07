"use client";

import Image from "next/image";
import { Fragment, useMemo } from "react";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { JourneyPathBridge } from "@/components/dashboard/journey-path-bridge";
import { resolveActiveStepIndex } from "@/lib/dashboard/resolve-active-step-index";
import {
  cycleStagger,
  type JourneyStaggerSide,
} from "@/lib/dashboard/journey-stagger";
import { copyMatrix } from "@/constants/copyMatrix";
import type { AcademyNodeState } from "@/lib/dashboard/academy-state";
import { LockIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type AcademySkillTrackProps = {
  nodes: readonly AcademyNodeState[];
};

const JOURNEY_NODES = copyMatrix.dashboard.academy.journey.nodes;

function getNodeMeta(id: string) {
  const node = JOURNEY_NODES.find((entry) => entry.id === id);
  return {
    number: node?.number ?? 0,
    subtitle: node?.subtitle ?? id,
    iconPath: node?.iconPath ?? "/dashboard/money-bag.svg",
  };
}

function CheckmarkBadge() {
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-[#86EFAC] font-heading text-xs font-bold text-[#031F82] sm:size-6">
      ✓
    </span>
  );
}

type AcademyNodeProps = {
  node: AcademyNodeState;
  stagger: "left" | "right" | "center";
};

function AcademyNode({ node, stagger }: AcademyNodeProps) {
  const copy = copyMatrix.dashboard.academy.journey;
  const { number, subtitle, iconPath } = getNodeMeta(node.id);
  const isActive = node.status === "active";
  const isCompleted = node.status === "completed";
  const isLocked = node.status === "locked";

  const alignment =
    stagger === "left"
      ? "self-start"
      : stagger === "right"
        ? "self-end"
        : "self-center";

  if (isCompleted) {
    return (
      <div
        className={cn(
          "relative z-10 flex w-[min(100%,8.5rem)] flex-col items-center gap-1.5",
          alignment,
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-[#86EFAC]/40 shadow-sm sm:h-12 sm:w-12">
          <CheckmarkBadge />
        </div>
        <span className="max-w-[7.5rem] text-center font-heading text-[10px] font-bold leading-tight text-[#031F82] sm:max-w-[8.5rem] sm:text-xs">
          {subtitle}
        </span>
        <span className="font-heading text-[8px] font-bold uppercase tracking-wide text-[#22C55E]">
          Done
        </span>
      </div>
    );
  }

  const nodeContent = (
    <>
      <div
        className={cn(
          "relative flex h-12 w-12 flex-col items-center justify-center rounded-full sm:h-14 sm:w-14",
          isActive
            ? "border-0 border-b-[3px] border-b-nga-cta-shadow bg-nga-cta text-white shadow-lg shadow-[#FFA503]/35 ring-4 ring-[#FFA503]/25 transition-all duration-75 group-active:translate-y-[2px] group-active:border-b-0"
            : "border-0 bg-gray-50 text-gray-500 shadow-sm",
        )}
      >
        <span className="font-heading text-lg font-extrabold leading-none sm:text-xl">
          {number}
        </span>
        <Image
          src={iconPath}
          alt=""
          width={14}
          height={14}
          className={cn(
            "mt-0.5 size-3 sm:size-3.5",
            isActive ? "brightness-0 invert" : "opacity-70",
          )}
          aria-hidden
        />
        {isLocked ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
            <LockIcon className="size-2.5" />
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "max-w-[7.5rem] text-center font-heading text-[10px] font-bold leading-tight sm:max-w-[8.5rem] sm:text-xs",
          isActive ? "text-nga-primary" : "text-gray-400",
        )}
      >
        {subtitle}
      </span>
      {isActive ? (
        <span className="font-heading text-[8px] font-bold uppercase tracking-wide text-[#FFA503]">
          Launch Now
        </span>
      ) : null}
    </>
  );

  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => {
          console.log(`Academy node clicked: ${node.id} — ${subtitle}`);
        }}
        className={cn(
          "group relative z-10 flex w-[min(100%,8.5rem)] flex-col items-center gap-1.5 rounded-2xl p-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary",
          alignment,
        )}
      >
        {nodeContent}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative z-10 flex w-[min(100%,8.5rem)] flex-col items-center gap-1.5 opacity-60",
        alignment,
      )}
      aria-label={`${subtitle} — ${copy.lockedLabel}`}
    >
      {nodeContent}
    </div>
  );
}

const STAGGER_PATTERN: readonly JourneyStaggerSide[] = [
  "left",
  "right",
  "center",
  "left",
  "right",
  "center",
];

export function AcademySkillTrack({ nodes }: AcademySkillTrackProps) {
  const copy = copyMatrix.dashboard.academy.journey;
  const activeStepIndex = useMemo(
    () => resolveActiveStepIndex(nodes),
    [nodes],
  );

  return (
    <section aria-labelledby="academy-journey-heading" className="bg-white px-1 pb-6 pt-3">
      <DashboardSectionHeading
        id="academy-journey-heading"
        className="mb-4"
      >
        {copy.heading}
      </DashboardSectionHeading>

      <div className="relative mx-auto flex max-w-sm flex-col py-1">
        {nodes.map((node, index) => {
          const stagger = cycleStagger(STAGGER_PATTERN, index);
          const nextStagger =
            index < nodes.length - 1
              ? cycleStagger(STAGGER_PATTERN, index + 1)
              : null;

          return (
            <Fragment key={node.id}>
              <AcademyNode node={node} stagger={stagger} />
              {nextStagger ? (
                <JourneyPathBridge
                  fromStagger={stagger}
                  toStagger={nextStagger}
                  segmentIndex={index}
                  activeStepIndex={activeStepIndex}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
