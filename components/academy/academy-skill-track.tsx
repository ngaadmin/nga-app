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
  ACADEMY_MODULE_SIGNPOST_GAP_PX,
  ACADEMY_MODULE_SIGNPOST_HEIGHT_PX,
} from "@/components/academy/academy-module-signpost";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { resolveActiveStepIndex } from "@/lib/dashboard/resolve-active-step-index";
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
  hudBannerRef?: RefObject<HTMLDivElement | null>;
};

/** Sine wave layout - centered, gentle swing, never hugs screen edges. */
const SINE_CENTER_X = 50;
const SINE_AMPLITUDE = 16;
const SINE_FREQUENCY = 0.72;

const REGULAR_NODE_SIZE_PX = 48;
/** Level closers: ~27% larger than regular nodes (48 → 61px). */
const MILESTONE_NODE_SIZE_PX = 61;
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

function nodeSlotHeightPx(milestone: AcademyLessonMilestoneNode): number {
  return isPhaseCloserMilestone(milestone)
    ? MILESTONE_NODE_SIZE_PX
    : REGULAR_NODE_SIZE_PX;
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
  onLaunch?: (milestoneId: number) => void;
};

function AcademyNode({ milestone, masteryCohort, onLaunch }: AcademyNodeProps) {
  if (!isRenderableAcademyMilestone(milestone)) {
    return null;
  }

  const phase = getAcademyPhaseTheme(milestone.levelGroup);
  const isPhaseCloser = isPhaseCloserMilestone(milestone);
  const iconKind = resolveMilestoneIconKind(milestone);
  const isActive = milestone.status === "active";
  const isCompleted = milestone.status === "completed";
  const isLocked = milestone.status === "locked";
  const showPhaseColor = isCompleted || isActive;

  const circleStyle = showPhaseColor
    ? {
        backgroundColor: phase.fill,
        borderBottomColor: phase.shadow,
        boxShadow: isActive
          ? `0 4px 0 ${phase.shadow}, 0 0 0 4px ${phase.ring}`
          : `0 3px 0 ${phase.shadow}`,
      }
    : undefined;

  const circle = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-75",
        isPhaseCloser ? "h-[3.8125rem] w-[3.8125rem]" : "h-12 w-12",
        isLocked
          ? "border-0 bg-gray-100 text-gray-400 shadow-sm"
          : "border-0 border-b-[4px] text-white",
        isActive && "group-active:translate-y-[2px] group-active:border-b-[2px]",
      )}
      style={circleStyle}
    >
      <MilestoneIcon
        kind={iconKind}
        className={isPhaseCloser ? "size-6" : "size-5"}
      />
      {isLocked ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white text-gray-400 shadow-sm",
            isPhaseCloser ? "size-5" : "size-4",
          )}
        >
          <LockIcon className={isPhaseCloser ? "size-3" : "size-2.5"} />
        </span>
      ) : null}
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
  hudBannerHeight: number,
): void {
  const mapViewportCenter =
    hudBannerHeight + (scrollContainer.clientHeight - hudBannerHeight) / 2;

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
  hudBannerRef,
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

  const anchorXs = useMemo(
    () => safeMilestones.map((_, index) => academySnakeAnchorX(index)),
    [safeMilestones],
  );

  const moduleSignpostCount = useMemo(
    () =>
      safeMilestones.filter((milestone) =>
        isFirstMilestoneInModule(milestone.id),
      ).length,
    [safeMilestones],
  );

  const trackHeightPx = useMemo(() => {
    if (safeMilestones.length === 0) return 0;

    const slotHeights = safeMilestones.reduce(
      (sum, milestone) => sum + nodeSlotHeightPx(milestone),
      0,
    );
    const nodeGaps = (safeMilestones.length - 1) * NODE_GAP_PX;
    const signpostBlocks =
      moduleSignpostCount *
      (ACADEMY_MODULE_SIGNPOST_HEIGHT_PX + ACADEMY_MODULE_SIGNPOST_GAP_PX);

    return slotHeights + nodeGaps + signpostBlocks;
  }, [safeMilestones, moduleSignpostCount]);

  useEffect(() => {
    if (lastFocusedStepRef.current === activeStepIndex) return;

    const activeEl = activeNodeRef.current;
    const scrollContainer = scrollContainerRef?.current;
    if (!activeEl || !scrollContainer) return;

    const runFocus = () => {
      const bannerHeight = hudBannerRef?.current?.offsetHeight ?? 0;
      focusActiveNodeInScrollContainer(
        scrollContainer,
        activeEl,
        bannerHeight,
      );
    };

    runFocus();
    const frame = requestAnimationFrame(() => {
      runFocus();
      lastFocusedStepRef.current = activeStepIndex;
    });

    return () => cancelAnimationFrame(frame);
  }, [activeStepIndex, scrollContainerRef, hudBannerRef]);

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
      <DashboardSectionHeading id="academy-journey-heading" className="mb-3 px-1">
        {copy.heading}
      </DashboardSectionHeading>

      <div className="relative mx-auto w-full max-w-full px-1 pt-4">
        <div
          className="relative w-full"
          style={{ height: trackHeightPx }}
        >
          <div className="relative flex w-full flex-col">
            {safeMilestones.map((milestone, index) => {
              const anchorX = anchorXs[index] ?? SINE_CENTER_X;
              const isActiveNode = milestone.status === "active";
              const slotHeight = nodeSlotHeightPx(milestone);
              const showModuleSignpost = isFirstMilestoneInModule(milestone.id);

              return (
                <Fragment key={milestone.id}>
                  {showModuleSignpost ? (
                    <>
                      <AcademyModuleSignpost
                        moduleNumber={milestone.levelGroup}
                        milestones={safeMilestones}
                        masteryCohort={masteryCohort}
                      />
                      <div
                        className="shrink-0"
                        style={{ height: ACADEMY_MODULE_SIGNPOST_GAP_PX }}
                        aria-hidden
                      />
                    </>
                  ) : null}
                  <div
                    ref={isActiveNode ? activeNodeRef : undefined}
                    className="relative w-full shrink-0"
                    style={{ height: slotHeight }}
                  >
                    <div
                      className="absolute top-1/2 z-base -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${anchorX}%` }}
                    >
                      <AcademyNode
                        milestone={milestone}
                        masteryCohort={masteryCohort}
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
