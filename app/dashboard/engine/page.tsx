"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import {
  getComplianceTier,
  readGhostAccessSession,
  type ComplianceTier,
} from "@/lib/onboarding/ghost-session";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
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

type VentureTier = "freemium" | "premium";

type VentureBlueprintId =
  | "dog-walking"
  | "lawn-mowing"
  | "lemonade-stand"
  | "car-wash"
  | "pet-sitting"
  | "handmade-crafts"
  | "furniture-flipping"
  | "digital-art-shop"
  | "tech-support-tutoring";

type BusinessIdea = {
  id: VentureBlueprintId;
  title: string;
  emoji: string;
  tier: VentureTier;
  row: 1 | 2 | 3;
};

type VentureAccessState = "free_launch" | "premium_unlock" | "milestone_locked";

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
  birthYear: number;
  complianceTier: ComplianceTier;
  isPremium: boolean;
};

const DEFAULT_ENGINE_PROFILE: EngineProfile = {
  birthYear: 2013,
  complianceTier: "explorer",
  isPremium: false,
};

const INITIAL_IN_PROGRESS: InProgressVenture[] = [
  { id: "dog-walking", progressPercent: 40 },
  { id: "lawn-mowing", progressPercent: 10 },
];

const BUSINESS_IDEAS: readonly BusinessIdea[] = [
  { id: "dog-walking", title: "Dog Walking", emoji: "🐕", tier: "freemium", row: 1 },
  { id: "lawn-mowing", title: "Lawn Mowing", emoji: "🌿", tier: "freemium", row: 1 },
  {
    id: "lemonade-stand",
    title: "Lemonade Stand",
    emoji: "🍋",
    tier: "freemium",
    row: 1,
  },
  { id: "car-wash", title: "Car Wash", emoji: "🚗", tier: "premium", row: 2 },
  { id: "pet-sitting", title: "Pet Sitting", emoji: "🐾", tier: "premium", row: 2 },
  {
    id: "handmade-crafts",
    title: "Handmade Crafts",
    emoji: "🧁",
    tier: "premium",
    row: 2,
  },
  {
    id: "furniture-flipping",
    title: "Furniture Flipping",
    emoji: "🪑",
    tier: "premium",
    row: 3,
  },
  {
    id: "digital-art-shop",
    title: "Digital Art Shop",
    emoji: "🎨",
    tier: "premium",
    row: 3,
  },
  {
    id: "tech-support-tutoring",
    title: "Tech Support",
    emoji: "💻",
    tier: "premium",
    row: 3,
  },
] as const;

const BUSINESS_IDEA_BRIEFS: Record<VentureBlueprintId, string> = {
  "dog-walking":
    "Finn's take: leashes up, neighborhood mapped, tails wagging - you're about to turn daily walks into steady cash. Low startup, high smiles.",
  "lawn-mowing":
    "Finn's take: grab the mower, quote your first yard, and watch grass clippings turn into green in your pocket. Summer hustle, unlocked.",
  "lemonade-stand":
    "Finn's take: ice cold, price bold, corner claimed - this classic play teaches pricing, pitch, and profit in one sunny afternoon.",
  "car-wash":
    "Finn's take: buckets, suds, shine - neighbors love a clean ride and you'll love repeat bookings. Premium hustle for founders ready to level up.",
  "pet-sitting":
    "Finn's take: trusted sitter energy wins every time. Build a care checklist, earn trust, and stack bookings while pet parents travel stress-free.",
  "handmade-crafts":
    "Finn's take: your creativity is inventory. Prototype one killer product, price it right, and sell at the maker's market like a pro.",
  "furniture-flipping":
    "Finn's take: find the rough gem, restore the glow, flip for profit. Eye for value plus elbow grease equals founder flex.",
  "digital-art-shop":
    "Finn's take: brand your style, upload your art, open shop online - your designs deserve a storefront and your first sale is waiting.",
  "tech-support-tutoring":
    "Finn's take: you already speak tech fluently. Package that skill, help one person, then another - digital helper status incoming.",
};

const VENTURE_JOURNEY_STEPS: Record<
  VentureBlueprintId,
  readonly [string, string, string, string]
> = {
  "dog-walking": [
    "Pick Your Route",
    "Land First Client",
    "Set Walk Rates",
    "Build the Pack",
  ],
  "lawn-mowing": [
    "Gear Check",
    "First Yard Quote",
    "Mow & Collect",
    "Repeat Clients",
  ],
  "lemonade-stand": [
    "Recipe Test",
    "Stand Setup",
    "Price Per Cup",
    "Busy Corner Launch",
  ],
  "car-wash": [
    "Kit Inventory",
    "Practice Wash",
    "Neighborhood Flyers",
    "Premium Detailer",
  ],
  "pet-sitting": [
    "Pet Safety 101",
    "Care Checklist",
    "First Booking",
    "Vacation Pro",
  ],
  "handmade-crafts": [
    "Pick Your Craft",
    "Prototype Product",
    "Price Your Goods",
    "Maker's Market",
  ],
  "furniture-flipping": [
    "Find a Piece",
    "Clean & Repair",
    "List for Sale",
    "Flip Profit Loop",
  ],
  "digital-art-shop": [
    "Style Your Brand",
    "Upload Designs",
    "Open Your Shop",
    "First Online Sale",
  ],
  "tech-support-tutoring": [
    "Skill Audit",
    "Help Session Prep",
    "First Client Call",
    "Digital Helper Pro",
  ],
};

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
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

const greenCtaClass =
  "rounded-nga-lg border-b-4 border-[#15803D] bg-[#22C55E] font-heading text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

const crimsonCtaClass =
  "rounded-nga-lg border-b-4 border-[#991B1B] bg-[#DC2626] font-heading text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

function resolveEngineProfile(): EngineProfile {
  const session = readGhostAccessSession();
  if (!session) return DEFAULT_ENGINE_PROFILE;

  return {
    birthYear: session.birthYear,
    complianceTier: getComplianceTier(session.birthYear, REFERENCE_YEAR),
    isPremium: false,
  };
}

function getVentureAccessState(
  idea: BusinessIdea,
  profile: EngineProfile,
): VentureAccessState {
  if (idea.tier === "freemium") return "free_launch";
  if (idea.row === 3 && profile.complianceTier === "explorer") {
    return "milestone_locked";
  }
  return "premium_unlock";
}

function getBusinessIdeaById(id: VentureBlueprintId): BusinessIdea {
  const match = BUSINESS_IDEAS.find((entry) => entry.id === id);
  if (!match) throw new Error(`Unknown business idea: ${id}`);
  return match;
}

function buildJourneyMilestones(ventureId: VentureBlueprintId): JourneyMilestone[] {
  const steps = VENTURE_JOURNEY_STEPS[ventureId];
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
        className="mb-3"
      >
        In Progress Ventures
      </DashboardSectionHeading>
      {ventures.length === 0 ? (
        <p className="py-3 font-sans text-xs text-[#1E3A5F]/70">
          No active ventures yet - pick a business idea below to launch.
        </p>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ventures.map((venture) => {
            const idea = getBusinessIdeaById(venture.id);
            const isSelected = selectedId === venture.id;

            return (
              <div
                key={venture.id}
                className={cn(
                  "relative w-[5.75rem] shrink-0 snap-center transition-all",
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
                  className="absolute -right-1 -top-1 z-10 flex size-5 items-center justify-center rounded-full bg-white text-[#031F82]/70 shadow-sm transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
                >
                  <CloseIcon className="size-2.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(venture.id)}
                  aria-pressed={isSelected}
                  className="flex w-full flex-col rounded-2xl p-2"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {idea.emoji}
                  </span>
                  <span className="mt-1 line-clamp-2 min-h-[2rem] font-heading text-[10px] font-bold leading-tight text-[#031F82]">
                    {idea.title}
                  </span>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#BDE9FB]">
                    <div
                      className="h-full rounded-full bg-[#0CC1E0] transition-all duration-300"
                      style={{ width: `${venture.progressPercent}%` }}
                    />
                  </div>
                  <span className="mt-1 font-heading text-[9px] font-bold text-[#0CC1E0]">
                    {venture.progressPercent}%
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type BusinessIdeasCarouselProps = {
  ideas: readonly BusinessIdea[];
  accessById: Record<VentureBlueprintId, VentureAccessState>;
  inProgressIds: ReadonlySet<VentureBlueprintId>;
  selectedDiscoveryId: VentureBlueprintId | null;
  onIdeaTap: (idea: BusinessIdea) => void;
};

function BusinessIdeasCarousel({
  ideas,
  accessById,
  inProgressIds,
  selectedDiscoveryId,
  onIdeaTap,
}: BusinessIdeasCarouselProps) {
  return (
    <section
      aria-labelledby="all-business-ideas-heading"
      className="mt-8"
    >
      <DashboardSectionHeading
        id="all-business-ideas-heading"
        className="mb-3"
      >
        All Business Ideas
      </DashboardSectionHeading>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ideas.map((idea) => {
          const accessState = accessById[idea.id];
          const isMilestoneLocked = accessState === "milestone_locked";
          const isPremiumUnlock = accessState === "premium_unlock";
          const isInProgress = inProgressIds.has(idea.id);
          const isDrawerOpen = selectedDiscoveryId === idea.id;

          return (
            <button
              key={idea.id}
              type="button"
              disabled={isMilestoneLocked}
              onClick={() => onIdeaTap(idea)}
              aria-label={idea.title}
              aria-pressed={isDrawerOpen}
              className={cn(
                "relative flex w-[4.75rem] shrink-0 snap-center flex-col items-center justify-center p-2 text-center transition-all",
                floatingTileClass,
                isMilestoneLocked && "pointer-events-none opacity-40",
                isDrawerOpen && "shadow-lg ring-2 ring-[#0CC1E0]/30",
                !isMilestoneLocked && "active:scale-[0.98]",
              )}
            >
              {isPremiumUnlock ? (
                <span className="absolute right-0.5 top-0.5 flex items-center gap-0.5 rounded-full bg-[#DCB766] px-1 py-0.5 shadow-sm">
                  <LockIcon className="size-2 text-[#031F82]" />
                </span>
              ) : null}

              {isMilestoneLocked ? (
                <span className="absolute right-0.5 top-0.5 text-gray-400">
                  <LockIcon className="size-2.5" />
                </span>
              ) : null}

              {isInProgress ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[1px]">
                  <span className="rounded-full bg-[#0CC1E0]/90 px-1.5 py-0.5 font-heading text-[8px] font-bold uppercase tracking-wide text-white">
                    In Progress
                  </span>
                </span>
              ) : null}

              <span className="text-base leading-none" aria-hidden>
                {idea.emoji}
              </span>
              <span className="mt-1 line-clamp-2 w-full font-heading text-[9px] font-bold leading-tight text-[#031F82]">
                {idea.title}
              </span>
            </button>
          );
        })}
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
  venture: BusinessIdea;
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
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          Active Journey
        </p>
        <h2 className="font-heading text-sm font-extrabold text-[#031F82]">
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
                        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
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
      <p className="font-heading text-sm font-extrabold text-[#031F82]">
        Your roadmap is waiting
      </p>
      <p className="mt-2 font-sans text-xs leading-relaxed text-[#1E3A5F]/80">
        Tap any business idea above, read Finn&apos;s brief, and hit launch to
        start building.
      </p>
    </section>
  );
}

type DiscoveryBriefDrawerProps = {
  idea: BusinessIdea;
  isAlreadyInProgress: boolean;
  onClose: () => void;
  onLaunch: (idea: BusinessIdea) => void;
};

function DiscoveryBriefDrawer({
  idea,
  isAlreadyInProgress,
  onClose,
  onLaunch,
}: DiscoveryBriefDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#031F82]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-brief-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-nga-xl rounded-b-nga-lg bg-white p-5 shadow-nga-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#BDE9FB]" />

        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {idea.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              Discovery Brief
            </p>
            <h2
              id="discovery-brief-title"
              className="font-heading text-lg font-extrabold text-[#031F82]"
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

        <p className="mt-4 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {BUSINESS_IDEA_BRIEFS[idea.id]}
        </p>

        {isAlreadyInProgress ? (
          <button
            type="button"
            onClick={() => onLaunch(idea)}
            className={cn(
              "mt-5 h-touch w-full px-6 shadow-nga-pop",
              orangeCtaClass,
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
            )}
          >
            LAUNCH THIS BUSINESS
          </button>
        )}
      </div>
    </div>
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#031F82]/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="close-business-title"
      aria-describedby="close-business-warning"
    >
      <div className="w-full max-w-sm rounded-nga-xl border-2 border-[#FFA503] bg-white p-5 shadow-nga-pop">
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl" aria-hidden>
            ⚠️
          </span>
          <h2
            id="close-business-title"
            className="mt-3 font-heading text-lg font-extrabold text-[#031F82]"
          >
            Close {ventureTitle}?
          </h2>
          <p
            id="close-business-warning"
            className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]"
          >
            {warningLead}
          </p>
        </div>

        <button
          type="button"
          onClick={onKeepBuilding}
          className={cn("mt-5 h-touch w-full px-6 shadow-nga-pop", greenCtaClass)}
        >
          Keep Building
        </button>
        <button
          type="button"
          onClick={onCloseShop}
          className={cn("mt-3 h-touch w-full px-6 shadow-nga-pop", crimsonCtaClass)}
        >
          Close Shop
        </button>
      </div>
    </div>
  );
}

type PaywallModalProps = {
  ventureTitle: string;
  onClose: () => void;
};

function PaywallModal({ ventureTitle, onClose }: PaywallModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#031F82]/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="engine-paywall-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#DCB766]">
          Premium unlock
        </p>
        <h2
          id="engine-paywall-title"
          className="mt-2 font-heading text-xl font-extrabold text-[#031F82] sm:text-2xl"
        >
          Level up {ventureTitle}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          Finn says this business idea runs on premium fuel. Unlock The Engine Pro
          to launch bigger plays, track sharper metrics, and stack XP faster.
        </p>

        <button
          type="button"
          className={cn("mt-5 h-touch w-full px-6 shadow-nga-pop", orangeCtaClass)}
        >
          Unlock Premium Access
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/60"
        >
          Not yet - keep exploring
        </button>
      </div>
    </div>
  );
}

export default function EnginePage() {
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
  const [discoveryIdea, setDiscoveryIdea] = useState<BusinessIdea | null>(null);
  const [closeConfirmId, setCloseConfirmId] =
    useState<VentureBlueprintId | null>(null);
  const [paywallIdea, setPaywallIdea] = useState<BusinessIdea | null>(null);

  useEffect(() => {
    setProfile(resolveEngineProfile());
  }, []);

  const inProgressIds = useMemo(
    () => new Set(inProgressVentures.map((venture) => venture.id)),
    [inProgressVentures],
  );

  const accessById = useMemo(() => {
    const map = {} as Record<VentureBlueprintId, VentureAccessState>;
    for (const idea of BUSINESS_IDEAS) {
      map[idea.id] = getVentureAccessState(idea, profile);
    }
    return map;
  }, [profile]);

  const selectedIdea = useMemo(() => {
    if (!selectedVentureId) return null;
    return getBusinessIdeaById(selectedVentureId);
  }, [selectedVentureId]);

  const journeyMilestones = useMemo(() => {
    if (!selectedVentureId) return [];
    return buildJourneyMilestones(selectedVentureId);
  }, [selectedVentureId]);

  const closeConfirmIdea = useMemo(() => {
    if (!closeConfirmId) return null;
    return getBusinessIdeaById(closeConfirmId);
  }, [closeConfirmId]);

  function handleBusinessIdeaTap(idea: BusinessIdea) {
    const accessState = accessById[idea.id];
    if (accessState === "milestone_locked") return;

    if (accessState === "premium_unlock" && !profile.isPremium) {
      setPaywallIdea(idea);
      return;
    }

    setDiscoveryIdea((current) => (current?.id === idea.id ? null : idea));
  }

  function handleLaunchBusiness(idea: BusinessIdea) {
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
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-x-hidden bg-white px-1 pb-2">
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

      <div className="shrink-0">
        <InProgressCarousel
          ventures={inProgressVentures}
          selectedId={selectedVentureId}
          onSelect={setSelectedVentureId}
          onCloseRequest={setCloseConfirmId}
        />
      </div>

      <div className="shrink-0">
        <BusinessIdeasCarousel
          ideas={BUSINESS_IDEAS}
          accessById={accessById}
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
          className="mb-4"
        >
          Your Venture Journey Map
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
