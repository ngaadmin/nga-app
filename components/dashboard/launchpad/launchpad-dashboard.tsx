"use client";

import { Fragment, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  buildVentureCarouselSlotMap,
  getAllVenturesForCarousel,
  getVentureBlueprintById,
  VENTURE_BLUEPRINTS,
  type VentureBlueprint,
  type VentureBlueprintId,
  type VentureCarouselSlot,
} from "@/lib/engine/venture-blueprints";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { readGhostAccessSession } from "@/lib/onboarding/ghost-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  engineBodyClass,
  engineBodyMutedClass,
  engineCardTitleClass,
  engineCtaLabelClass,
  engineEmptyHelperClass,
  engineEmptyTitleClass,
  engineJourneyEyebrowClass,
  engineModalTitleClass,
  enginePanelTitleClass,
  enginePremiumEyebrowClass,
  engineProgressMetaClass,
  engineSecondaryActionClass,
  engineSectionHeadingClass,
  engineStatusBadgeClass,
} from "@/components/dashboard/engine/engine-dashboard-styles";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  CalendarIcon,
  LightbulbIcon,
  LockIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon,
  ZapIcon,
} from "@/lib/dashboard/icons";
import {
  buildCloseBusinessWarningLead,
  resolveFinnAddressName,
} from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

const REFERENCE_YEAR = 2026;
const DEMO_ACTIVE_STEP_INDEX = 2;

type InProgressVenture = {
  id: VentureBlueprintId;
  progressPercent: number;
};

type JourneyNodeStatus = "completed" | "active" | "locked";

type JourneyMilestone = {
  id: string;
  title: string;
  status: JourneyNodeStatus;
};

type EngineProfile = {
  ageTier: MasteryCohort;
  isPremium: boolean;
};

const DEFAULT_ENGINE_PROFILE: EngineProfile = {
  ageTier: "explorer",
  isPremium: false,
};

function resolveEngineProfile(): EngineProfile {
  const session = readGhostAccessSession();
  if (!session) return DEFAULT_ENGINE_PROFILE;

  return {
    ageTier: getMasteryCohortFromBirthYear(session.birthYear, REFERENCE_YEAR),
    isPremium: false,
  };
}

const INITIAL_IN_PROGRESS: InProgressVenture[] = [
  { id: "dog-walking", progressPercent: 40 },
  { id: "lawn-mowing", progressPercent: 10 },
];

const floatingTileClass = "rounded-2xl border-0 bg-white shadow-md";

/** Sine wave layout - matches Academy floating snake path. */
const SINE_CENTER_X = 50;
const SINE_AMPLITUDE = 16;
const SINE_FREQUENCY = 0.72;
const REGULAR_NODE_SIZE_PX = 48;
const MILESTONE_NODE_SIZE_PX = 61;
const NODE_GAP_PX = 32;

const VENTURE_PATH_THEME = {
  fill: "#FFA503",
  shadow: "#C88202",
  ring: "rgba(255, 165, 3, 0.4)",
};

type VentureLessonIconKind =
  | "target"
  | "lightbulb"
  | "sparkles"
  | "zap"
  | "trending-up"
  | "trophy";

const VENTURE_LESSON_ICON_SEQUENCE: readonly VentureLessonIconKind[] = [
  "target",
  "lightbulb",
  "sparkles",
  "zap",
  "trending-up",
];

const VENTURE_LESSON_ICON_MAP: Record<
  VentureLessonIconKind,
  ComponentType<{ className?: string }>
> = {
  target: TargetIcon,
  lightbulb: LightbulbIcon,
  sparkles: SparklesIcon,
  zap: ZapIcon,
  "trending-up": TrendingUpIcon,
  trophy: TrophyIcon,
};

function ventureSnakeAnchorX(index: number): number {
  if (!Number.isFinite(index) || index < 0) return SINE_CENTER_X;
  const raw = SINE_CENTER_X + SINE_AMPLITUDE * Math.sin(index * SINE_FREQUENCY);
  return Math.min(72, Math.max(28, raw));
}

function isVentureBossMilestone(index: number, total: number): boolean {
  return index === total - 1;
}

function ventureLessonIconKind(
  index: number,
  total: number,
): VentureLessonIconKind {
  if (isVentureBossMilestone(index, total)) return "trophy";
  return (
    VENTURE_LESSON_ICON_SEQUENCE[index % VENTURE_LESSON_ICON_SEQUENCE.length] ??
    "target"
  );
}

function ventureNodeSlotHeightPx(index: number, total: number): number {
  return isVentureBossMilestone(index, total)
    ? MILESTONE_NODE_SIZE_PX
    : REGULAR_NODE_SIZE_PX;
}

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

const greenCtaClass =
  "rounded-nga-lg border-b-4 border-[#15803D] bg-[#22C55E] text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

const crimsonCtaClass =
  "rounded-nga-lg border-b-4 border-[#991B1B] bg-[#DC2626] text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

function buildJourneyMilestones(ventureId: VentureBlueprintId): JourneyMilestone[] {
  const steps = getVentureBlueprintById(ventureId).journeySteps;
  return steps.map((title, index) => ({
    id: `${ventureId}-step-${index + 1}`,
    title,
    status:
      index < DEMO_ACTIVE_STEP_INDEX
        ? "completed"
        : index === DEMO_ACTIVE_STEP_INDEX
          ? "active"
          : "locked",
  }));
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PremiumTierLockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-[#DCB766] p-0.5 shadow-sm",
        className,
      )}
      aria-hidden
    >
      <LockIcon className="size-2.5 text-[#031F82]" />
    </span>
  );
}

function AgeTrackLockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-[#E8F7FC] p-0.5 ring-1 ring-[#BDE9FB]",
        className,
      )}
      aria-hidden
    >
      <CalendarIcon className="size-2.5 text-[#099FB8]" />
    </span>
  );
}

type InProgressCarouselProps = {
  ventures: readonly InProgressVenture[];
  selectedId: VentureBlueprintId | null;
  onSelect: (id: VentureBlueprintId) => void;
  onCloseRequest: (id: VentureBlueprintId) => void;
};

function InProgressCarousel({
  ventures,
  selectedId,
  onSelect,
  onCloseRequest,
}: InProgressCarouselProps) {
  return (
    <section aria-labelledby="in-progress-ventures-heading">
      <DashboardSectionHeading
        id="in-progress-ventures-heading"
        className={cn(engineSectionHeadingClass, "mb-3")}
      >
        In Progress Businesses
      </DashboardSectionHeading>
      {ventures.length === 0 ? (
        <p className={cn("py-3", engineEmptyHelperClass)}>
          No active ventures yet - pick a business idea below to launch.
        </p>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full snap-x snap-mandatory gap-3">
          {ventures.map((venture) => {
            const idea = getVentureBlueprintById(venture.id);
            const isSelected = selectedId === venture.id;

            return (
              <div
                key={venture.id}
                className={cn(
                  "relative w-[7.25rem] shrink-0 snap-center transition-all",
                  floatingTileClass,
                  isSelected && "shadow-lg ring-2 ring-[#0CC1E0]/25",
                )}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseRequest(venture.id);
                  }}
                  aria-label={`Close ${idea.title}`}
                  className="absolute -right-1 -top-1 z-raised flex size-5 items-center justify-center rounded-full bg-white text-[#031F82]/70 shadow-sm transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
                >
                  <CloseIcon className="size-2.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(venture.id)}
                  aria-pressed={isSelected}
                  className="flex w-full flex-col rounded-2xl p-2.5"
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {idea.emoji}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 line-clamp-2 min-h-[2.5rem]",
                      engineCardTitleClass,
                    )}
                  >
                    {idea.title}
                  </span>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#BDE9FB]">
                    <div
                      className="h-full rounded-full bg-[#0CC1E0] transition-all duration-300"
                      style={{ width: `${venture.progressPercent}%` }}
                    />
                  </div>
                  <span className={cn("mt-1", engineProgressMetaClass)}>
                    {venture.progressPercent}%
                  </span>
                </button>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}

type BusinessIdeaTileProps = {
  idea: VentureBlueprint;
  slot: VentureCarouselSlot;
  isInProgress: boolean;
  isDrawerOpen: boolean;
  onTap: (idea: VentureBlueprint) => void;
};

function BusinessIdeaTile({
  idea,
  slot,
  isInProgress,
  isDrawerOpen,
  onTap,
}: BusinessIdeaTileProps) {
  const isPremiumLocked = slot === "premium_locked";
  const isAgeLocked = slot === "age_locked";

  return (
    <button
      type="button"
      onClick={() => onTap(idea)}
      aria-label={idea.title}
      aria-pressed={isDrawerOpen}
      className={cn(
        "relative flex w-[6.25rem] shrink-0 snap-start flex-col items-center justify-center p-2.5 text-center transition-all",
        floatingTileClass,
        isDrawerOpen && "shadow-lg ring-2 ring-[#0CC1E0]/30",
        isAgeLocked && "opacity-55",
        "active:scale-[0.98]",
      )}
    >
      {isPremiumLocked ? (
        <span className="absolute right-0.5 top-0.5">
          <PremiumTierLockBadge />
        </span>
      ) : null}

      {isAgeLocked ? (
        <span className="absolute right-0.5 top-0.5">
          <AgeTrackLockBadge />
        </span>
      ) : null}

      {isInProgress ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[1px]">
          <span className={engineStatusBadgeClass}>In Progress</span>
        </span>
      ) : null}

      <span className="text-xl leading-none" aria-hidden>
        {idea.emoji}
      </span>
      <span className={cn("mt-1.5 line-clamp-2 w-full", engineCardTitleClass)}>
        {idea.title}
      </span>
    </button>
  );
}

type BusinessIdeasCarouselProps = {
  ideas: readonly VentureBlueprint[];
  slotById: Record<VentureBlueprintId, VentureCarouselSlot>;
  inProgressIds: ReadonlySet<VentureBlueprintId>;
  selectedDiscoveryId: VentureBlueprintId | null;
  onIdeaTap: (idea: VentureBlueprint) => void;
};

function BusinessIdeasCarousel({
  ideas,
  slotById,
  inProgressIds,
  selectedDiscoveryId,
  onIdeaTap,
}: BusinessIdeasCarouselProps) {
  return (
    <section
      aria-labelledby="all-business-ideas-heading"
      className="mt-8 min-w-0"
    >
      <DashboardSectionHeading
        id="all-business-ideas-heading"
        className={cn(engineSectionHeadingClass, "mb-1")}
      >
        All Business Ideas
      </DashboardSectionHeading>
      <p className={cn("mb-3", engineProgressMetaClass)}>
        {ideas.length} ventures · swipe to browse
      </p>
      <div
        className="w-full min-w-0 overflow-x-auto overscroll-x-contain px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${VENTURE_BLUEPRINTS.length} business ideas`}
      >
        <div className="flex w-max snap-x snap-mandatory gap-2">
          {ideas.map((idea) => (
            <BusinessIdeaTile
              key={idea.id}
              idea={idea}
              slot={slotById[idea.id]}
              isInProgress={inProgressIds.has(idea.id)}
              isDrawerOpen={selectedDiscoveryId === idea.id}
              onTap={onIdeaTap}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VentureMilestoneIcon({
  kind,
  className,
}: {
  kind: VentureLessonIconKind;
  className?: string;
}) {
  const Icon = VENTURE_LESSON_ICON_MAP[kind] ?? TargetIcon;
  return <Icon className={className} />;
}

type VentureJourneyNodeProps = {
  milestone: JourneyMilestone;
  index: number;
  total: number;
  onLaunch?: () => void;
};

function VentureJourneyNode({
  milestone,
  index,
  total,
  onLaunch,
}: VentureJourneyNodeProps) {
  const isBoss = isVentureBossMilestone(index, total);
  const iconKind = ventureLessonIconKind(index, total);
  const isActive = milestone.status === "active";
  const isCompleted = milestone.status === "completed";
  const isLocked = milestone.status === "locked";
  const showVentureColor = isCompleted || isActive;

  const circleStyle = showVentureColor
    ? {
        backgroundColor: VENTURE_PATH_THEME.fill,
        borderBottomColor: VENTURE_PATH_THEME.shadow,
        boxShadow: isActive
          ? `0 4px 0 ${VENTURE_PATH_THEME.shadow}, 0 0 0 4px ${VENTURE_PATH_THEME.ring}`
          : `0 3px 0 ${VENTURE_PATH_THEME.shadow}`,
      }
    : undefined;

  const circle = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-75",
        isBoss ? "h-[3.8125rem] w-[3.8125rem]" : "h-12 w-12",
        isLocked
          ? "border-0 bg-gray-100 text-gray-400 shadow-sm"
          : "border-0 border-b-[4px] text-white",
        isActive && "group-active:translate-y-[2px] group-active:border-b-[2px]",
      )}
      style={circleStyle}
    >
      <VentureMilestoneIcon
        kind={iconKind}
        className={isBoss ? "size-6" : "size-5"}
      />
      {isLocked ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white text-gray-400 shadow-sm",
            isBoss ? "size-5" : "size-4",
          )}
        >
          <LockIcon className={isBoss ? "size-3" : "size-2.5"} />
        </span>
      ) : null}
    </div>
  );

  if (isActive && onLaunch) {
    return (
      <button
        type="button"
        onClick={onLaunch}
        aria-label={`${milestone.title} - launch now`}
        className="group rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0CC1E0]"
      >
        {circle}
      </button>
    );
  }

  return (
    <div
      className={cn(isLocked && "opacity-55")}
      aria-label={
        isLocked ? `${milestone.title} - locked` : milestone.title
      }
      role="img"
    >
      {circle}
    </div>
  );
}

type VentureJourneyMapProps = {
  venture: VentureBlueprint;
  milestones: readonly JourneyMilestone[];
  onLaunchStep: (ventureId: VentureBlueprintId, stepTitle: string) => void;
};

function VentureJourneyMap({
  venture,
  milestones,
  onLaunchStep,
}: VentureJourneyMapProps) {
  const anchorXs = useMemo(
    () => milestones.map((_, index) => ventureSnakeAnchorX(index)),
    [milestones],
  );

  const trackHeightPx = useMemo(() => {
    if (milestones.length === 0) return 0;
    const slotHeights = milestones.reduce(
      (sum, _, index) => sum + ventureNodeSlotHeightPx(index, milestones.length),
      0,
    );
    return slotHeights + (milestones.length - 1) * NODE_GAP_PX;
  }, [milestones]);

  return (
    <section
      aria-label={`${venture.title} journey map`}
      className={cn("flex h-full min-h-0 flex-col p-3", floatingTileClass)}
    >
      <div className="shrink-0 pb-2">
        <p className={engineJourneyEyebrowClass}>
          Active Journey
        </p>
        <h2 className={enginePanelTitleClass}>
          {venture.emoji} {venture.title}
        </h2>
      </div>

      <div className="relative mt-3 min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white py-1">
        <div className="relative mx-auto w-full max-w-full overflow-x-hidden pt-4">
          <div className="relative w-full" style={{ height: trackHeightPx }}>
            <div className="relative flex w-full flex-col">
              {milestones.map((milestone, index) => {
                const anchorX = anchorXs[index] ?? SINE_CENTER_X;
                const slotHeight = ventureNodeSlotHeightPx(
                  index,
                  milestones.length,
                );

                return (
                  <Fragment key={milestone.id}>
                    <div
                      className="relative w-full shrink-0"
                      style={{ height: slotHeight }}
                    >
                      <div
                        className="absolute top-1/2 z-raised -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${anchorX}%` }}
                      >
                        <VentureJourneyNode
                          milestone={milestone}
                          index={index}
                          total={milestones.length}
                          onLaunch={
                            milestone.status === "active"
                              ? () =>
                                  onLaunchStep(venture.id, milestone.title)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                    {index < milestones.length - 1 ? (
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
      </div>
    </section>
  );
}

function EmptyJourneyPlaceholder() {
  return (
    <section
      aria-label="No active journey"
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center p-6 text-center",
        floatingTileClass,
        "shadow-sm",
      )}
    >
      <p className={engineEmptyTitleClass}>
        Your roadmap is waiting
      </p>
      <p className={cn("mt-2", engineBodyMutedClass)}>
        Tap any business idea above, read Finn&apos;s brief, and hit launch to
        start building.
      </p>
    </section>
  );
}

type DiscoveryBriefDrawerProps = {
  idea: VentureBlueprint;
  isAlreadyInProgress: boolean;
  onClose: () => void;
  onLaunch: (idea: VentureBlueprint) => void;
};

function DiscoveryBriefDrawer({
  idea,
  isAlreadyInProgress,
  onClose,
  onLaunch,
}: DiscoveryBriefDrawerProps) {
  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="discovery-brief-title"
      align="bottom"
      panelClassName="max-w-md rounded-t-nga-xl rounded-b-nga-lg bg-white p-5 shadow-nga-pop"
    >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#BDE9FB]" />

        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {idea.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className={engineJourneyEyebrowClass}>
              Discovery Brief
            </p>
            <h2
              id="discovery-brief-title"
              className={enginePanelTitleClass}
            >
              {idea.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close discovery brief"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#031F82]/60 transition-colors hover:bg-[#BDE9FB]/50 hover:text-[#031F82]"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        <p className={cn("mt-4", engineBodyClass)}>{idea.description}</p>

        {isAlreadyInProgress ? (
          <button
            type="button"
            onClick={() => onLaunch(idea)}
            className={cn(
              "mt-5 h-touch w-full px-6 shadow-nga-pop",
              orangeCtaClass,
              engineCtaLabelClass,
            )}
          >
            View Active Roadmap
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onLaunch(idea)}
            className={cn(
              "mt-5 h-touch w-full px-6 shadow-nga-pop",
              orangeCtaClass,
              engineCtaLabelClass,
            )}
          >
            LAUNCH THIS BUSINESS
          </button>
        )}
    </ModalShell>
  );
}

type CloseBusinessConfirmProps = {
  ventureTitle: string;
  warningLead: string;
  onKeepBuilding: () => void;
  onCloseShop: () => void;
};

function CloseBusinessConfirm({
  ventureTitle,
  warningLead,
  onKeepBuilding,
  onCloseShop,
}: CloseBusinessConfirmProps) {
  return (
    <ModalShell
      isOpen
      align="center"
      dismissOnBackdrop={false}
      role="alertdialog"
      labelledBy="close-business-title"
      describedBy="close-business-warning"
      backdropClassName="bg-[#031F82]/60"
      panelClassName="max-w-sm rounded-nga-xl border-2 border-[#FFA503] bg-white p-5 shadow-nga-pop"
    >
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl" aria-hidden>
            ⚠️
          </span>
          <h2
            id="close-business-title"
            className={cn("mt-3", enginePanelTitleClass)}
          >
            Close {ventureTitle}?
          </h2>
          <p
            id="close-business-warning"
            className={cn("mt-3", engineBodyClass)}
          >
            {warningLead}
          </p>
        </div>

        <button
          type="button"
          onClick={onKeepBuilding}
          className={cn("mt-5 h-touch w-full px-6 shadow-nga-pop", greenCtaClass, engineCtaLabelClass)}
        >
          Keep Building
        </button>
        <button
          type="button"
          onClick={onCloseShop}
          className={cn("mt-3 h-touch w-full px-6 shadow-nga-pop", crimsonCtaClass, engineCtaLabelClass)}
        >
          Close Shop
        </button>
    </ModalShell>
  );
}

type CohortUnavailableModalProps = {
  ventureTitle: string;
  cohortLabel: string;
  onClose: () => void;
};

function CohortUnavailableModal({
  ventureTitle,
  cohortLabel,
  onClose,
}: CohortUnavailableModalProps) {
  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="engine-cohort-unavailable-title"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
    >
      <p className={engineJourneyEyebrowClass}>Learning track</p>
      <h2
        id="engine-cohort-unavailable-title"
        className={cn("mt-2", engineModalTitleClass)}
      >
        Not on your track yet
      </h2>
      <p className={cn("mt-3", engineBodyClass)}>
        {ventureTitle} isn&apos;t available on your current {cohortLabel}{" "}
        learning track. Some business ventures stay locked for age-safety reasons
        until you&apos;re ready — keep leveling up in The Academy to unlock
        more.
      </p>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "mt-5 h-touch w-full px-6 shadow-nga-pop",
          orangeCtaClass,
          engineCtaLabelClass,
        )}
      >
        Got it
      </button>
    </ModalShell>
  );
}

type PaywallModalProps = {
  ventureTitle: string;
  onClose: () => void;
};

function PaywallModal({ ventureTitle, onClose }: PaywallModalProps) {
  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="engine-paywall-title"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
    >
        <p className={enginePremiumEyebrowClass}>
          Premium unlock
        </p>
        <h2
          id="engine-paywall-title"
          className={cn("mt-2", engineModalTitleClass)}
        >
          Level up {ventureTitle}
        </h2>
        <p className={cn("mt-3", engineBodyClass)}>
          This business idea requires a premium subscription. Upgrade your
          account to unlock this venture and start building.
        </p>

        <button
          type="button"
          className={cn("mt-5 h-touch w-full px-6 shadow-nga-pop", orangeCtaClass, engineCtaLabelClass)}
        >
          Unlock Premium Access
        </button>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "mt-3 w-full rounded-nga-lg px-4 py-2.5 transition-colors hover:bg-[#BDE9FB]/60",
            engineSecondaryActionClass,
          )}
        >
          Not yet - keep exploring
        </button>
    </ModalShell>
  );
}

export function EngineDashboard() {
  const { username, isLoading: isUserLoading } = useDashboardUser();
  const finnAddressName = useMemo(
    () => resolveFinnAddressName(username, isUserLoading),
    [username, isUserLoading],
  );
  const closeBusinessWarningLead = useMemo(
    () => buildCloseBusinessWarningLead(finnAddressName),
    [finnAddressName],
  );

  const [profile, setProfile] = useState<EngineProfile>(DEFAULT_ENGINE_PROFILE);
  const [inProgressVentures, setInProgressVentures] =
    useState<InProgressVenture[]>(INITIAL_IN_PROGRESS);
  const [selectedVentureId, setSelectedVentureId] =
    useState<VentureBlueprintId | null>(INITIAL_IN_PROGRESS[0]?.id ?? null);
  const [discoveryIdea, setDiscoveryIdea] = useState<VentureBlueprint | null>(
    null,
  );
  const [closeConfirmId, setCloseConfirmId] =
    useState<VentureBlueprintId | null>(null);
  const [paywallIdea, setPaywallIdea] = useState<VentureBlueprint | null>(null);
  const [cohortBlockedIdea, setCohortBlockedIdea] =
    useState<VentureBlueprint | null>(null);

  useEffect(() => {
    const sync = () => setProfile(resolveEngineProfile());
    sync();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_SESSION_UPDATED_EVENT, sync);
  }, []);

  const inProgressIds = useMemo(
    () => new Set(inProgressVentures.map((venture) => venture.id)),
    [inProgressVentures],
  );

  const sortedVentureIdeas = useMemo(
    () => getAllVenturesForCarousel(profile.ageTier, profile.isPremium),
    [profile.ageTier, profile.isPremium],
  );

  const carouselSlotById = useMemo(
    () => buildVentureCarouselSlotMap(profile.ageTier, profile.isPremium),
    [profile.ageTier, profile.isPremium],
  );

  const selectedIdea = useMemo(() => {
    if (!selectedVentureId) return null;
    return getVentureBlueprintById(selectedVentureId);
  }, [selectedVentureId]);

  const journeyMilestones = useMemo(() => {
    if (!selectedVentureId) return [];
    return buildJourneyMilestones(selectedVentureId);
  }, [selectedVentureId]);

  const closeConfirmIdea = useMemo(() => {
    if (!closeConfirmId) return null;
    return getVentureBlueprintById(closeConfirmId);
  }, [closeConfirmId]);

  function handleBusinessIdeaTap(idea: VentureBlueprint) {
    const slot = carouselSlotById[idea.id];

    if (slot === "age_locked") {
      setCohortBlockedIdea(idea);
      return;
    }

    if (slot === "premium_locked") {
      setPaywallIdea(idea);
      return;
    }

    setDiscoveryIdea((current) => (current?.id === idea.id ? null : idea));
  }

  function handleLaunchBusiness(idea: VentureBlueprint) {
    if (inProgressIds.has(idea.id)) {
      setSelectedVentureId(idea.id);
      setDiscoveryIdea(null);
      return;
    }

    setInProgressVentures((current) => [
      ...current,
      { id: idea.id, progressPercent: 0 },
    ]);
    setSelectedVentureId(idea.id);
    setDiscoveryIdea(null);
  }

  function handleCloseShop() {
    if (!closeConfirmId) return;

    setInProgressVentures((current) => {
      const next = current.filter((venture) => venture.id !== closeConfirmId);
      if (selectedVentureId === closeConfirmId) {
        setSelectedVentureId(next[0]?.id ?? null);
      }
      return next;
    });
    setCloseConfirmId(null);
  }

  function handleLaunchStep(ventureId: VentureBlueprintId, stepTitle: string) {
    console.log(`Engine step launch: ${ventureId} - ${stepTitle}`);
  }

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-md flex-1 flex-col bg-white px-1 pb-2">
      {cohortBlockedIdea ? (
        <CohortUnavailableModal
          ventureTitle={cohortBlockedIdea.title}
          cohortLabel={masteryCohortLabel(profile.ageTier)}
          onClose={() => setCohortBlockedIdea(null)}
        />
      ) : null}

      {paywallIdea ? (
        <PaywallModal
          ventureTitle={paywallIdea.title}
          onClose={() => setPaywallIdea(null)}
        />
      ) : null}

      {discoveryIdea ? (
        <DiscoveryBriefDrawer
          idea={discoveryIdea}
          isAlreadyInProgress={inProgressIds.has(discoveryIdea.id)}
          onClose={() => setDiscoveryIdea(null)}
          onLaunch={handleLaunchBusiness}
        />
      ) : null}

      {closeConfirmIdea ? (
        <CloseBusinessConfirm
          ventureTitle={closeConfirmIdea.title}
          warningLead={closeBusinessWarningLead}
          onKeepBuilding={() => setCloseConfirmId(null)}
          onCloseShop={handleCloseShop}
        />
      ) : null}

      <div className="min-w-0 shrink-0 w-full">
        <InProgressCarousel
          ventures={inProgressVentures}
          selectedId={selectedVentureId}
          onSelect={setSelectedVentureId}
          onCloseRequest={setCloseConfirmId}
        />
      </div>

      <div className="min-w-0 shrink-0 w-full">
        <BusinessIdeasCarousel
          ideas={sortedVentureIdeas}
          slotById={carouselSlotById}
          inProgressIds={inProgressIds}
          selectedDiscoveryId={discoveryIdea?.id ?? null}
          onIdeaTap={handleBusinessIdeaTap}
        />
      </div>

      <section
        aria-labelledby="venture-journey-map-heading"
        className="mt-8 min-h-[50dvh] flex-1"
      >
        <DashboardSectionHeading
          id="venture-journey-map-heading"
          className={cn(engineSectionHeadingClass, "mb-4")}
        >
          Your Business Journey
        </DashboardSectionHeading>
        {selectedIdea ? (
          <VentureJourneyMap
            venture={selectedIdea}
            milestones={journeyMilestones}
            onLaunchStep={handleLaunchStep}
          />
        ) : (
          <EmptyJourneyPlaceholder />
        )}
      </section>
    </div>
  );
}
