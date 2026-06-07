"use client";

import {
  cycleStagger,
  type JourneyStaggerSide,
} from "@/lib/dashboard/journey-stagger";
import { copyMatrix } from "@/constants/copyMatrix";
import type { SkillNodeState } from "@/lib/dashboard/home-state";
import { LockIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

type SkillPathTrackProps = {
  nodes: readonly SkillNodeState[];
};

const SKILL_NODE_COPY = copyMatrix.home.skillNodes;

function getSkillCopy(id: string) {
  const node = SKILL_NODE_COPY.find((entry) => entry.id === id);
  return {
    title: node?.title ?? id,
    subtext: node?.subtext ?? "",
  };
}

type SkillNodeProps = {
  node: SkillNodeState;
  stagger: "left" | "right" | "center";
};

function SkillNode({ node, stagger }: SkillNodeProps) {
  const copy = copyMatrix.home.skillTrack;
  const { title, subtext } = getSkillCopy(node.id);
  const isActive = node.status === "active";
  const isLocked = node.status === "locked";

  const alignment =
    stagger === "left"
      ? "self-start"
      : stagger === "right"
        ? "self-end"
        : "self-center";

  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => {
          console.log(`Skill node clicked: ${node.id} — ${title}`);
        }}
        className={cn(
          "group flex w-[min(100%,14rem)] flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary",
          alignment,
        )}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-b-4 border-b-nga-cta-shadow bg-nga-cta font-heading text-white shadow-nga-pop transition-all duration-75 group-active:translate-y-[2px] group-active:border-b-0">
          <span className="text-lg font-extrabold leading-none">
            {node.progressPercent ?? 0}%
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
            {copy.progressLabel}
          </span>
        </div>
        <span className="text-center font-heading text-sm font-bold text-nga-primary">
          {title}
        </span>
        <span className="text-center font-sans text-xs font-normal text-nga-slate">
          {subtext}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn("flex w-[min(100%,14rem)] flex-col items-center gap-2", alignment)}
      aria-label={`${title} — ${copy.lockedLabel}`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-gray-400">
        {isLocked ? <LockIcon className="size-5" /> : null}
      </div>
      <span className="text-center font-heading text-sm font-bold text-gray-400">
        {title}
      </span>
      <span className="text-center font-sans text-xs font-normal text-gray-400">
        {subtext}
      </span>
    </div>
  );
}

const STAGGER_PATTERN: readonly JourneyStaggerSide[] = [
  "left",
  "right",
  "center",
  "left",
  "right",
];

export function SkillPathTrack({ nodes }: SkillPathTrackProps) {
  const copy = copyMatrix.home.skillTrack;

  return (
    <section aria-labelledby="skill-track-heading" className="pb-4">
      <h2
        id="skill-track-heading"
        className="mb-6 text-center font-heading text-xl font-extrabold text-nga-primary sm:text-2xl"
      >
        {copy.heading}
      </h2>

      <div className="relative mx-auto flex max-w-md flex-col gap-10 py-2">
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 top-4 w-0.5 -translate-x-1/2 bg-nga-mist"
          aria-hidden
        />

        {nodes.map((node, index) => (
          <SkillNode
            key={node.id}
            node={node}
            stagger={cycleStagger(STAGGER_PATTERN, index)}
          />
        ))}
      </div>
    </section>
  );
}
