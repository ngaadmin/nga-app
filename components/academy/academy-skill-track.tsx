"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
  AcademyModuleSignpost,
  ACADEMY_JOURNEY_ENTRY_MILESTONE_ID,
  ACADEMY_MODULE_ONE_SIGNPOST_GAP_PX,
  ACADEMY_MODULE_SIGNPOST_GAP_PX,
  ACADEMY_MODULE_SIGNPOST_HEIGHT_PX,
} from "@/components/academy/academy-module-signpost";
import { AcademyJourneyDirectionSign } from "@/components/academy/academy-journey-sign";
import { academyJourneyHeadingClass } from "@/components/academy/academy-journey-styles";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
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
  LockIcon,
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
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

/** Sine wave layout - centered, gentle swing, never hugs screen edges. */
const SINE_CENTER_X = 50;
const SINE_AMPLITUDE = 16;
const SINE_FREQUENCY = 0.72;

const LESSON_NODE_SIZE_PX = 61;
const NODE_GAP_PX = 32;

/** Smooth horizontal offset (0–100%) from node index. */
function academySnakeAnchorX(index: number): number {
  if (!Number.isFinite(index) || index < 0) return SINE_CENTER_X;
  const raw = SINE_CENTER_X + SINE_AMPLITUDE * Math.sin(index * SINE_FREQUENCY);
  return Math.min(72, Math.max(28, raw));
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
  const showPhaseFill = isCompleted;

  const circleStyle = showPhaseFill
    ? {
        backgroundColor: phase.fill,
        borderBottomColor: phase.shadow,
        boxShadow: `0 3px 0 ${phase.shadow}`,
      }
    : isActive
      ? {
          backgroundColor: "#ffffff",
          borderBottomColor: phase.shadow,
          boxShadow: `0 4px 0 ${phase.shadow}`,
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
          "h-[3.8125rem] w-[3.8125rem]",
          isLocked
            ? "border-0 bg-gray-100 text-gray-400 shadow-sm"
            : "border-0 border-b-[4px]",
          showPhaseFill && "text-white",
          isActive && !isCompleted && "group-active:translate-y-[2px] group-active:border-b-[2px]",
        )}
        style={circleStyle}
      >
        <span
          className="flex items-center justify-center"
          style={
            isActive && !showPhaseFill ? { color: phase.fill } : undefined
          }
        >
          <MilestoneIcon
            kind={iconKind}
            className={cn(
              "size-6",
              showPhaseFill
                ? "text-white"
                : isActive
                  ? "text-current"
                  : "text-gray-400",
            )}
          />
        </span>
        {isLocked ? (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white text-gray-400 shadow-sm",
              "size-5",
            )}
          >
            <LockIcon className="size-3" />
          </span>
        ) : null}
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
      className={cn(isLocked && "opacity-55")}
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

export function AcademySkillTrack({
  milestones = [],
  scrollContainerRef,
}: AcademySkillTrackProps) {
  const router = useRouter();
  const copy = copyMatrix.dashboard.academy.journey;
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

  const trackHeightPx = useMemo(() => {
    if (safeMilestones.length === 0) return 0;

    const slotHeights = safeMilestones.reduce(
      (sum, milestone) => sum + nodeSlotHeightPx(milestone),
      0,
    );
    const nodeGaps = (safeMilestones.length - 1) * NODE_GAP_PX;
    const signpostBlocks = safeMilestones.reduce((sum, milestone) => {
      if (!isFirstMilestoneInModule(milestone.id)) return sum;
      const gapPx =
        milestone.levelGroup === 1
          ? ACADEMY_MODULE_ONE_SIGNPOST_GAP_PX
          : ACADEMY_MODULE_SIGNPOST_GAP_PX;
      return sum + ACADEMY_MODULE_SIGNPOST_HEIGHT_PX + gapPx;
    }, 0);

    return slotHeights + nodeGaps + signpostBlocks;
  }, [safeMilestones]);

  useEffect(() => {
    if (lastFocusedStepRef.current === continueStepIndex) return;

    const activeEl = activeNodeRef.current;
    const scrollContainer = scrollContainerRef?.current;
    if (!activeEl || !scrollContainer) return;

    const runFocus = () => {
      focusActiveNodeInScrollContainer(scrollContainer, activeEl);
    };

    runFocus();
    const frame = requestAnimationFrame(() => {
      runFocus();
      lastFocusedStepRef.current = continueStepIndex;
    });

    return () => cancelAnimationFrame(frame);
  }, [continueStepIndex, scrollContainerRef]);

  const showStartHereSign =
    continueMilestoneId === ACADEMY_JOURNEY_ENTRY_MILESTONE_ID;

  const handleLaunchLesson = (milestoneId: number) => {
    const milestone = safeMilestones.find((node) => node.id === milestoneId);
    if (!milestone) return;
    if (canLaunchAcademyLesson(milestoneId, milestone.status, masteryCohort)) {
      router.push(`/dashboard/academy/lesson/${milestoneId}`);
    }
  };

  return (
    <section
      aria-labelledby="academy-journey-heading"
      className="relative z-base w-full max-w-full bg-white pb-4"
    >
      <div className="mb-3 w-full px-4 text-center">
        <DashboardSectionHeading
          id="academy-journey-heading"
          className={academyJourneyHeadingClass}
        >
          {copy.heading}
        </DashboardSectionHeading>
      </div>

      <div className="relative mx-auto w-full max-w-full px-1 pt-4">
        <div
          className="relative w-full"
          style={{ height: trackHeightPx }}
        >
          <div className="relative flex w-full flex-col">
            {safeMilestones.map((milestone, index) => {
              const anchorX = anchorXs[index] ?? SINE_CENTER_X;
              const isContinueTarget = milestone.id === continueMilestoneId;
              const isActiveNode = isContinueTarget;
              const slotHeight = nodeSlotHeightPx(milestone);
              const showModuleSignpost = isFirstMilestoneInModule(milestone.id);
              const showStartHereOnNode =
                showStartHereSign &&
                milestone.id === ACADEMY_JOURNEY_ENTRY_MILESTONE_ID;

              return (
                <Fragment key={milestone.id}>
                  {showModuleSignpost ? (
                    <>
                      <div
                        className={cn(
                          "relative flex w-full justify-center px-2",
                          milestone.levelGroup === 1 && "-mt-3",
                        )}
                      >
                        <AcademyModuleSignpost
                          moduleNumber={milestone.levelGroup}
                          milestones={safeMilestones}
                          masteryCohort={masteryCohort}
                        />
                      </div>
                      <div
                        className="shrink-0"
                        style={{
                          height:
                            milestone.levelGroup === 1
                              ? ACADEMY_MODULE_ONE_SIGNPOST_GAP_PX
                              : ACADEMY_MODULE_SIGNPOST_GAP_PX,
                        }}
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <div
                    ref={isActiveNode ? activeNodeRef : undefined}
                    className="relative z-raised w-full shrink-0"
                    style={{ height: slotHeight }}
                  >
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
                      {showStartHereOnNode ? (
                        <div className="absolute left-full top-1/2 z-chrome ml-2 -translate-y-1/2">
                          <AcademyJourneyDirectionSign side="right" />
                        </div>
                      ) : null}
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
      </div>
    </section>
  );
}
