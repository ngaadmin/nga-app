"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AcademyModuleSignpost, ACADEMY_MODULE_SIGNPOST_GAP_PX } from "@/components/academy/academy-module-signpost";
import {
  PENNY_JOURNEY_SIZE_PX,
  PENNY_NODE_GAP_PX,
  placePennyBesideNode,
} from "@/lib/dashboard/place-penny-beside-node";
import {
  resolveActiveStepIndex,
  resolveContinueMilestoneId,
  resolvePennyMilestoneId,
} from "@/lib/dashboard/resolve-active-step-index";
import { copyMatrix } from "@/constants/copyMatrix";
import { ACADEMY_MODULE_CLOSER_THEME } from "@/lib/dashboard/academy-content";
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
};

/** Sine wave layout - centered, gentle swing, never hugs screen edges. */
const SINE_CENTER_X = 50;
const SINE_AMPLITUDE = 18;
const SINE_FREQUENCY = 0.78;

const LESSON_NODE_SIZE_PX = 84;
/** Pulse ring uses -inset-2 (8px). Gap must exceed that so the ring does not touch the previous tile. */
const NODE_GAP_PX = 20;
const PENNY_SIZE_PX = PENNY_JOURNEY_SIZE_PX;

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
    if (milestone.status === "completed") {
      return `Module ${milestone.levelGroup} complete`;
    }
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
  const isGoldModuleNode =
    isPhaseCloserMilestone(milestone) && isCompleted;
  const showPhaseFill = isCompleted || isActive;
  const nodeFill = isGoldModuleNode
    ? ACADEMY_MODULE_CLOSER_THEME
    : phase;

  const circleStyle = showPhaseFill
    ? {
        backgroundColor: nodeFill.fill,
        borderBottomColor: nodeFill.shadow,
        boxShadow: `0 4px 0 ${nodeFill.shadow}`,
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
          showPhaseFill && (isGoldModuleNode ? "text-[#031F82]" : "text-white"),
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
                ? isGoldModuleNode
                  ? "text-[#031F82]"
                  : "text-white"
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

const PENNY_JOURNEY_SRC =
  "/assets/illustrations/characters/penny/penny-journey-512.webp";

function pennyFallbackOffsetPx(nodeOnRight: boolean): number {
  return nodeOnRight
    ? -(LESSON_NODE_SIZE_PX / 2 + PENNY_NODE_GAP_PX + PENNY_SIZE_PX)
    : LESSON_NODE_SIZE_PX / 2 + PENNY_NODE_GAP_PX;
}

function PennyBesideActiveNode({
  slotRef,
  nodeRef,
  fallbackAnchorX,
}: {
  slotRef: RefObject<HTMLElement | null>;
  nodeRef: RefObject<HTMLElement | null>;
  fallbackAnchorX: number;
}) {
  const fallbackNodeOnRight = fallbackAnchorX >= SINE_CENTER_X;
  const [placement, setPlacement] = useState<{
    leftPx: number;
    topPx: number;
    nodeOnRight: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let raf = 0;
    let retries = 0;

    const update = () => {
      if (cancelled) return;
      const slot = slotRef.current;
      const node = nodeRef.current;
      if (!slot || !node) {
        if (retries < 30) {
          retries += 1;
          raf = requestAnimationFrame(update);
        }
        return;
      }

      const slotRect = slot.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      if (slotRect.width <= 0 || nodeRect.width <= 0) {
        if (retries < 30) {
          retries += 1;
          raf = requestAnimationFrame(update);
        }
        return;
      }

      const placed = placePennyBesideNode({
        slotWidth: slotRect.width,
        nodeLeft: nodeRect.left - slotRect.left,
        nodeTop: nodeRect.top - slotRect.top,
        nodeWidth: nodeRect.width,
        nodeHeight: nodeRect.height,
      });
      setPlacement(placed);

      if (!observer) {
        observer = new ResizeObserver(update);
        observer.observe(slot);
        observer.observe(node);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [nodeRef, slotRef]);

  const nodeOnRight = placement?.nodeOnRight ?? fallbackNodeOnRight;
  const left =
    placement != null
      ? placement.leftPx
      : `calc(${fallbackAnchorX}% + ${pennyFallbackOffsetPx(fallbackNodeOnRight)}px)`;
  const top = placement != null ? placement.topPx : "50%";

  return (
    <div
      className="pointer-events-none absolute z-chrome"
      style={{
        left,
        top,
        width: PENNY_SIZE_PX,
        height: PENNY_SIZE_PX,
        transform: "translateY(-50%)",
      }}
      aria-hidden
    >
      <Image
        src={PENNY_JOURNEY_SRC}
        alt=""
        width={PENNY_SIZE_PX}
        height={PENNY_SIZE_PX}
        priority
        className={cn(
          "h-full w-full object-contain object-center",
          // Art points to the viewer's left; mirror it when Penny sits left of the tile.
          nodeOnRight && "-scale-x-100",
        )}
        unoptimized
      />
    </div>
  );
}

export function AcademySkillTrack({
  milestones = [],
}: AcademySkillTrackProps) {
  const router = useRouter();
  const activeNodeRef = useRef<HTMLDivElement | null>(null);
  const activeNodeBoxRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (continueMilestoneId == null) return;
    const milestone = safeMilestones.find((node) => node.id === continueMilestoneId);
    if (!milestone) return;
    if (!canLaunchAcademyLesson(continueMilestoneId, milestone.status, masteryCohort)) {
      return;
    }
    router.prefetch(`/dashboard/academy/lesson/${continueMilestoneId}`);
  }, [continueMilestoneId, masteryCohort, router, safeMilestones]);

  const pennyMilestoneId = useMemo(
    () => resolvePennyMilestoneId(safeMilestones),
    [safeMilestones],
  );


  const continueStepIndex = useMemo(() => {
    const targetId = pennyMilestoneId ?? continueMilestoneId;
    if (targetId == null) return activeStepIndex;
    const index = safeMilestones.findIndex((milestone) => milestone.id === targetId);
    return index >= 0 ? index : activeStepIndex;
  }, [activeStepIndex, continueMilestoneId, pennyMilestoneId, safeMilestones]);

  const anchorXs = useMemo(
    () => safeMilestones.map((_, index) => academySnakeAnchorX(index)),
    [safeMilestones],
  );

  useEffect(() => {
    if (safeMilestones.length === 0) return;
    if (lastFocusedStepRef.current === continueStepIndex) return;

    let cancelled = false;
    let frame2 = 0;

    const runFocus = () => {
      if (cancelled) return;
      const activeEl = activeNodeRef.current;
      if (!activeEl) return;
      // The page itself scrolls, not the map's inner box, so scroll the
      // nearest real scroller (window or main) until this tile is centered.
      activeEl.scrollIntoView({ block: "center", inline: "nearest" });
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
  }, [continueStepIndex, safeMilestones.length]);

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
      className="relative z-base w-full max-w-full overflow-visible bg-white pb-4"
    >
      <div className="relative mx-auto w-full max-w-full">
        <div className="relative flex w-full flex-col">
            {safeMilestones.map((milestone, index) => {
              const anchorX = anchorXs[index] ?? SINE_CENTER_X;
              const isActiveNode = milestone.id === pennyMilestoneId;
              const slotHeight = nodeSlotHeightPx(milestone);
              const isModuleStart = isFirstMilestoneInModule(milestone.id);
              const showPennyBesideNode = isActiveNode;

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
                    className={cn(
                      "relative w-full shrink-0 overflow-visible",
                      isActiveNode ? "z-chrome" : "z-raised",
                    )}
                    style={{ height: slotHeight }}
                  >
                    <div
                      ref={isActiveNode ? activeNodeBoxRef : undefined}
                      className="absolute"
                      style={{
                        left: `${anchorX}%`,
                        top: "50%",
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
                    {showPennyBesideNode ? (
                      <PennyBesideActiveNode
                        slotRef={activeNodeRef}
                        nodeRef={activeNodeBoxRef}
                        fallbackAnchorX={anchorX}
                      />
                    ) : null}
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
