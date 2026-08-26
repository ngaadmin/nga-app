"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type RefObject,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AcademyModuleSignpost, ACADEMY_MODULE_SIGNPOST_GAP_PX } from "@/components/academy/academy-module-signpost";
import { resolveActiveStepIndex, resolveContinueMilestoneId } from "@/lib/dashboard/resolve-active-step-index";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  getAcademyPhaseTheme,
  isFirstMilestoneInModule,
  isPhaseCloserMilestone,
  isRenderableAcademyMilestone,
  lessonIconKindForMilestone,
  type AcademyLessonIconKind,
  type AcademyLessonMilestoneNode,
} from "@/lib/dashboard/academy-state";
import {
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  LightbulbIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon,
  ZapIcon,
} from "@/lib/dashboard/icons";
import { canLaunchAcademyLesson } from "@/lib/academy/lessons/registry";
import { useLessonMasteryCohort } from "@/lib/academy/lessons/hooks/use-lesson-cohort";
import { cn } from "@/lib/utils/cn";

type AcademySkillTrackProps = {
  milestones?: readonly AcademyLessonMilestoneNode[];
  scrollContainerRef?: RefObject<HTMLElement | null>;
};

/** Sine wave layout - centered, gentle swing, never hugs screen edges. */
const SINE_CENTER_X = 50;
const SINE_AMPLITUDE = 18;
const SINE_FREQUENCY = 0.78;

const LESSON_NODE_SIZE_PX = 84;
const NODE_GAP_PX = 8;
/** WebP has transparent padding — box is larger so the coin body matches the node. */
const PENNY_SIZE_PX = Math.round(LESSON_NODE_SIZE_PX * 1.5);
const PENNY_NODE_GAP_PX = 0;

/** Smooth horizontal offset (0–100%) from node index. */
function academySnakeAnchorX(index: number): number {
  if (!Number.isFinite(index) || index < 0) return SINE_CENTER_X;
  const raw = SINE_CENTER_X + SINE_AMPLITUDE * Math.sin(index * SINE_FREQUENCY);
  return Math.min(70, Math.max(30, raw));
}

const LESSON_ICON_MAP: Record<
  AcademyLessonIconKind,
  ComponentType<{ className?: string }>
> = {
  target: TargetIcon,
  lightbulb: LightbulbIcon,
  sparkles: SparklesIcon,
  zap: ZapIcon,
  "trending-up": TrendingUpIcon,
  trophy: TrophyIcon,
};

function nodeSlotHeightPx(_milestone: AcademyLessonMilestoneNode): number {
  return LESSON_NODE_SIZE_PX;
}

function resolveMilestoneIconKind(
  milestone: AcademyLessonMilestoneNode,
): AcademyLessonIconKind {
  if (isPhaseCloserMilestone(milestone)) {
    return "trophy";
  }
  return lessonIconKindForMilestone(milestone);
}

function MilestoneIcon({
  kind,
  className,
}: {
  kind: AcademyLessonIconKind;
  className?: string;
}) {
  const Icon = LESSON_ICON_MAP[kind] ?? TargetIcon;
  return <Icon className={className} />;
}

function milestoneAriaLabel(milestone: AcademyLessonMilestoneNode): string {
  const copy = copyMatrix.dashboard.academy.journey;
  const isPhaseCloser = isPhaseCloserMilestone(milestone);

  if (milestone.status === "locked") {
    if (isPhaseCloser) {
      return `Level ${milestone.levelGroup} milestone - ${copy.lockedLabel}`;
    }
    return `Academy step ${milestone.id} - ${copy.lockedLabel}`;
  }

  if (isPhaseCloser) {
    return `Level ${milestone.levelGroup} milestone`;
  }

  return `Academy step ${milestone.id}`;
}

type AcademyNodeProps = {
  milestone: AcademyLessonMilestoneNode;
  masteryCohort: MasteryCohort;
  showContinuePulse?: boolean;
  onLaunch?: (milestoneId: number) => void;
};

function AcademyNode({
  milestone,
  masteryCohort,
  showContinuePulse = false,
  onLaunch,
}: AcademyNodeProps) {
  if (!isRenderableAcademyMilestone(milestone)) {
    return null;
  }

  const phase = getAcademyPhaseTheme(milestone.levelGroup);
  const iconKind = resolveMilestoneIconKind(milestone);
  const isActive = milestone.status === "active";
  const isCompleted = milestone.status === "completed";
  const isLocked = milestone.status === "locked";
  const showPhaseFill = isCompleted || isActive;

  const circleStyle = showPhaseFill
    ? {
        backgroundColor: phase.fill,
        borderBottomColor: phase.shadow,
        boxShadow: `0 4px 0 ${phase.shadow}`,
      }
    : isLocked
      ? {
          backgroundColor: "#D5DAE2",
        }
      : undefined;

  const circle = (
    <div className="relative flex items-center justify-center">
      {showContinuePulse ? (
        <span
          className="pointer-events-none absolute -inset-2 rounded-full border-2 border-[#FFA503] animate-academy-active-pulse"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-75",
          isLocked
            ? "border-0 text-gray-400"
            : "border-0 border-b-[4px]",
          showPhaseFill && "text-white",
          isActive && !isCompleted && "group-active:translate-y-[2px] group-active:border-b-[2px]",
        )}
        style={{
          height: LESSON_NODE_SIZE_PX,
          width: LESSON_NODE_SIZE_PX,
          ...circleStyle,
        }}
      >
        <span className="flex items-center justify-center">
          <MilestoneIcon
            kind={iconKind}
            className={cn(
              "size-8",
              showPhaseFill
                ? "text-white"
                : "text-gray-400",
            )}
          />
        </span>
      </div>
    </div>
  );

  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => onLaunch?.(milestone.id)}
        aria-label={milestoneAriaLabel(milestone)}
        className="group rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary"
      >
        {circle}
      </button>
    );
  }

  if (canLaunchAcademyLesson(milestone.id, milestone.status, masteryCohort)) {
    return (
      <button
        type="button"
        onClick={() => onLaunch?.(milestone.id)}
        aria-label={`Replay ${milestoneAriaLabel(milestone)}`}
        className="group rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nga-secondary"
      >
        {circle}
      </button>
    );
  }

  return (
    <div
      aria-label={milestoneAriaLabel(milestone)}
      role="img"
    >
      {circle}
    </div>
  );
}

function focusActiveNodeInScrollContainer(
  scrollContainer: HTMLElement,
  activeNode: HTMLElement,
): void {
  const mapViewportCenter = scrollContainer.clientHeight / 2;

  const containerRect = scrollContainer.getBoundingClientRect();
  const activeRect = activeNode.getBoundingClientRect();
  const activeCenterFromContainerTop =
    activeRect.top - containerRect.top + activeRect.height / 2;

  const scrollOffset =
    scrollContainer.scrollTop +
    activeCenterFromContainerTop -
    mapViewportCenter;

  scrollContainer.scrollTo({
    top: Math.max(0, scrollOffset),
    behavior: "auto",
  });
}

const PENNY_POINT_SRC =
  "/assets/illustrations/characters/penny/penny_point.webp";

export function AcademySkillTrack({
  milestones = [],
  scrollContainerRef,
}: AcademySkillTrackProps) {
  const router = useRouter();
  const activeNodeRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedStepRef = useRef<number | null>(null);
  const masteryCohort = useLessonMasteryCohort();

  const safeMilestones = useMemo(
    () => milestones.filter(isRenderableAcademyMilestone),
    [milestones],
  );

  const activeStepIndex = useMemo(
    () => resolveActiveStepIndex(safeMilestones),
    [safeMilestones],
  );

  const continueMilestoneId = useMemo(
    () => resolveContinueMilestoneId(safeMilestones),
    [safeMilestones],
  );

  const continueStepIndex = useMemo(() => {
    if (continueMilestoneId == null) return activeStepIndex;
    const index = safeMilestones.findIndex(
      (milestone) => milestone.id === continueMilestoneId,
    );
    return index >= 0 ? index : activeStepIndex;
  }, [activeStepIndex, continueMilestoneId, safeMilestones]);

  const anchorXs = useMemo(
    () => safeMilestones.map((_, index) => academySnakeAnchorX(index)),
    [safeMilestones],
  );

  useEffect(() => {
    if (safeMilestones.length === 0) return;
    if (lastFocusedStepRef.current === continueStepIndex) return;

    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer) return;

    let cancelled = false;
    let frame2 = 0;

    const runFocus = () => {
      if (cancelled) return;
      const activeEl = activeNodeRef.current;
      if (!activeEl) return;
      focusActiveNodeInScrollContainer(scrollContainer, activeEl);
      lastFocusedStepRef.current = continueStepIndex;
    };

    // Layout may still be settling after hydration / module signposts.
    runFocus();
    const frame1 = requestAnimationFrame(() => {
      runFocus();
      frame2 = requestAnimationFrame(runFocus);
    });
    const settleTimer = window.setTimeout(runFocus, 120);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      window.clearTimeout(settleTimer);
    };
  }, [continueStepIndex, safeMilestones.length, scrollContainerRef]);

  const handleLaunchLesson = (milestoneId: number) => {
    const milestone = safeMilestones.find((node) => node.id === milestoneId);
    if (!milestone) return;
    if (canLaunchAcademyLesson(milestoneId, milestone.status, masteryCohort)) {
      router.push(`/dashboard/academy/lesson/${milestoneId}`);
    }
  };

  return (
    <section
      aria-label="Academy journey map"
      className="relative z-base w-full max-w-full bg-white pb-4"
    >
      <div className="relative mx-auto w-full max-w-full">
        <div className="relative flex w-full flex-col">
            {safeMilestones.map((milestone, index) => {
              const anchorX = anchorXs[index] ?? SINE_CENTER_X;
              const isContinueTarget = milestone.id === continueMilestoneId;
              const isActiveNode = isContinueTarget;
              const slotHeight = nodeSlotHeightPx(milestone);
              const isModuleStart = isFirstMilestoneInModule(milestone.id);
              const showPennyBesideNode = isActiveNode;
              const nodeOnRight = anchorX >= SINE_CENTER_X;
              const pennyOffsetPx = nodeOnRight
                ? -(LESSON_NODE_SIZE_PX / 2 + PENNY_NODE_GAP_PX + PENNY_SIZE_PX)
                : LESSON_NODE_SIZE_PX / 2 + PENNY_NODE_GAP_PX;

              return (
                <Fragment key={milestone.id}>
                  {isModuleStart ? (
                    <>
                      <div className="relative z-base -mx-4 w-[calc(100%+2rem)] shrink-0 sm:-mx-6 sm:w-[calc(100%+3rem)]">
                        <AcademyModuleSignpost
                          moduleNumber={milestone.levelGroup}
                          milestones={safeMilestones}
                          masteryCohort={masteryCohort}
                        />
                      </div>
                      <div
                        className="shrink-0"
                        style={{ height: ACADEMY_MODULE_SIGNPOST_GAP_PX }}
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <div
                    ref={isActiveNode ? activeNodeRef : undefined}
                    className="relative z-raised w-full shrink-0"
                    style={{ height: slotHeight }}
                  >
                    {showPennyBesideNode ? (
                      <div
                        className="pointer-events-none absolute top-1/2 z-raised"
                        style={{
                          left: `calc(${anchorX}% + ${pennyOffsetPx}px)`,
                          width: PENNY_SIZE_PX,
                          height: PENNY_SIZE_PX,
                          transform: "translateY(-50%)",
                        }}
                        aria-hidden
                      >
                        <Image
                          src={PENNY_POINT_SRC}
                          alt=""
                          width={126}
                          height={126}
                          className={cn(
                            "h-full w-full object-contain object-center",
                            !nodeOnRight && "-scale-x-100",
                          )}
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2",
                        isActiveNode && "z-chrome",
                      )}
                      style={{
                        left: `${anchorX}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <AcademyNode
                        milestone={milestone}
                        masteryCohort={masteryCohort}
                        showContinuePulse={isActiveNode}
                        onLaunch={handleLaunchLesson}
                      />
                    </div>
                  </div>
                  {index < safeMilestones.length - 1 ? (
                    <div
                      className="shrink-0"
                      style={{ height: NODE_GAP_PX }}
                      aria-hidden
                    />
                  ) : null}
                </Fragment>
              );
            })}
        </div>
      </div>
    </section>
  );
}
