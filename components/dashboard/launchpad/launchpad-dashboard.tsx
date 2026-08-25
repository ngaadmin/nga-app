"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildVentureCarouselSlotMap,
  getAllVenturesForCarousel,
  VENTURE_BLUEPRINTS,
  type VentureBlueprint,
  type VentureBlueprintId,
  type VentureCarouselSlot,
} from "@/lib/launchpad/venture-blueprints";
import { getMasteryCohortFromBirthYear, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { readGuestAccessSession } from "@/lib/onboarding/guest-session";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import {
  launchpadBodyClass,
  launchpadChipTitleClass,
  launchpadCtaLabelClass,
  launchpadEmptyHelperClass,
  launchpadModalTitleClass,
  launchpadProgressMetaClass,
  launchpadSectionHeadingClass,
} from "@/components/dashboard/launchpad/launchpad-dashboard-styles";
import { ModalShell } from "@/components/ui/modal-shell";
import { CalendarIcon, LockIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";

const REFERENCE_YEAR = 2026;

type LaunchpadProfile = {
  ageTier: MasteryCohort;
  isPremium: boolean;
};

const DEFAULT_LAUNCHPAD_PROFILE: LaunchpadProfile = {
  ageTier: "explorer",
  isPremium: false,
};

function resolveLaunchpadProfile(): LaunchpadProfile {
  const session = readGuestAccessSession();
  if (!session) return DEFAULT_LAUNCHPAD_PROFILE;

  return {
    ageTier: getMasteryCohortFromBirthYear(session.birthYear, REFERENCE_YEAR),
    isPremium: false,
  };
}

const floatingTileClass = "rounded-2xl border-0 bg-white shadow-md";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

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

type BusinessIdeaTileProps = {
  idea: VentureBlueprint;
  slot: VentureCarouselSlot;
  onTap: () => void;
};

function BusinessIdeaTile({ idea, slot, onTap }: BusinessIdeaTileProps) {
  const isPremiumLocked = slot === "premium_locked";
  const isAgeLocked = slot === "age_locked";

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={idea.title}
      className={cn(
        "relative flex w-[calc((100cqi-1.5rem)/3.3)] min-w-0 shrink-0 snap-start flex-col items-center justify-center overflow-hidden px-1 py-1.5 text-center transition-all",
        floatingTileClass,
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

      <span className="text-base leading-none" aria-hidden>
        {idea.emoji}
      </span>
      <span className={cn("mt-1 w-full min-w-0", launchpadChipTitleClass)}>
        {idea.title}
      </span>
    </button>
  );
}

type BusinessIdeasCarouselProps = {
  ideas: readonly VentureBlueprint[];
  slotById: Record<VentureBlueprintId, VentureCarouselSlot>;
  onIdeaTap: () => void;
};

function BusinessIdeasCarousel({
  ideas,
  slotById,
  onIdeaTap,
}: BusinessIdeasCarouselProps) {
  return (
    <section aria-labelledby="all-business-ideas-heading" className="min-w-0">
      <DashboardSectionHeading
        id="all-business-ideas-heading"
        className={cn(launchpadSectionHeadingClass, "mb-1")}
      >
        Business Ideas
      </DashboardSectionHeading>
      <p className={cn("mb-3", launchpadProgressMetaClass)}>
        {ideas.length} ventures · swipe to browse
      </p>
      <div
        className="@container w-full min-w-0 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${VENTURE_BLUEPRINTS.length} business ideas`}
      >
        <div className="flex w-max snap-x snap-mandatory gap-2">
          {ideas.map((idea) => (
            <BusinessIdeaTile
              key={idea.id}
              idea={idea}
              slot={slotById[idea.id]}
              onTap={onIdeaTap}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type ComingSoonModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="launchpad-coming-soon-title"
      describedBy="launchpad-coming-soon-body"
      align="center"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
    >
      <h2
        id="launchpad-coming-soon-title"
        className={launchpadModalTitleClass}
      >
        Coming soon
      </h2>
      <p id="launchpad-coming-soon-body" className={cn("mt-3", launchpadBodyClass)}>
        Launchpad is still being built. It isn&apos;t ready for this test round.
        Explore and test the other app features instead.
      </p>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "mt-5 h-touch w-full px-6 shadow-nga-pop",
          orangeCtaClass,
          launchpadCtaLabelClass,
        )}
      >
        Got it
      </button>
    </ModalShell>
  );
}

export function LaunchpadDashboard() {
  const [profile, setProfile] = useState<LaunchpadProfile>(
    DEFAULT_LAUNCHPAD_PROFILE,
  );
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  useEffect(() => {
    const sync = () => setProfile(resolveLaunchpadProfile());
    sync();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_SESSION_UPDATED_EVENT, sync);
  }, []);

  const sortedVentureIdeas = useMemo(
    () => getAllVenturesForCarousel(profile.ageTier, profile.isPremium),
    [profile.ageTier, profile.isPremium],
  );

  const carouselSlotById = useMemo(
    () => buildVentureCarouselSlotMap(profile.ageTier, profile.isPremium),
    [profile.ageTier, profile.isPremium],
  );

  function openComingSoon() {
    setIsComingSoonOpen(true);
  }

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-md flex-1 flex-col bg-white px-1 pb-2">
      <ComingSoonModal
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
      />

      <div className="min-w-0 shrink-0 w-full">
        <BusinessIdeasCarousel
          ideas={sortedVentureIdeas}
          slotById={carouselSlotById}
          onIdeaTap={openComingSoon}
        />
      </div>

      <section
        aria-labelledby="in-progress-ventures-heading"
        className="mt-8 min-w-0 shrink-0"
      >
        <DashboardSectionHeading
          id="in-progress-ventures-heading"
          className={cn(launchpadSectionHeadingClass, "mb-3")}
        >
          In Progress
        </DashboardSectionHeading>
        <button
          type="button"
          onClick={openComingSoon}
          className={cn("text-left", launchpadEmptyHelperClass)}
        >
          No ventures in progress yet.
        </button>
      </section>
    </div>
  );
}
