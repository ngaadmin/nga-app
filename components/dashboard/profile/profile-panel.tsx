"use client";

import { useId, useState } from "react";
import {
  PROFILE_SWITCHER_COPY,
  ProfileRow,
} from "@/components/dashboard/profile-switcher/profile-switcher";
import { ParentHubTabIconA } from "@/lib/dashboard/tab-icons-a";
import {
  PROFILE_SWITCHING_AVAILABLE,
  type HouseholdProfiles,
} from "@/lib/profile-switcher/household-profiles";
import { MedalsIntro } from "@/components/achievements/medals-intro";
import { SkillsCollectionPanel } from "@/components/achievements/skills-collection-panel";
import { ProfileAvatarImage, ProfileAvatarOrInitial } from "@/components/dashboard/profile/profile-avatar";
import {
  PROFILE_AVATAR_OPTIONS,
  type ProfileAvatarId,
} from "@/lib/dashboard/profile-avatar";
import { cn } from "@/lib/utils/cn";
import {
  PARENT_ROLE_PILL_CLASS,
  TRACK_PILL_CLASS,
} from "@/lib/dashboard/track-pill";

type ProfilePanelProps = {
  displayName: string;
  /** Track name (Explorer, Pathfinder, Maverick). Null for parents and teachers. */
  trackLabel: string | null;
  /** Null shows the first letter of the name until a picture is picked. */
  avatarId: ProfileAvatarId | null;
  onChooseAvatar: (id: ProfileAvatarId) => void;
  /** Role pill for parents ("Parent"). Children use the track pill instead. */
  roleLabel?: string | null;
  /** Linked profiles. Shown as the same switcher list as the avatar menu. */
  household?: HouseholdProfiles | null;
  /** Parent Hub entry. Only for a parent who can open the Hub. */
  onOpenParentHub?: () => void;
  /** Opens with Achievements expanded (old /dashboard/achievements links). */
  achievementsInitiallyOpen?: boolean;
};

function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="font-heading text-sm font-extrabold text-[#031F82]">
      {children}
    </h3>
  );
}

/**
 * Body of the profile panel opened from the top-bar avatar. Every profile
 * (child, parent, teacher, guest) uses this same template: who you are,
 * your avatar, and your Achievements (medals), collapsed by default.
 */
export function ProfilePanel({
  displayName,
  trackLabel,
  avatarId,
  onChooseAvatar,
  roleLabel = null,
  household = null,
  onOpenParentHub,
  achievementsInitiallyOpen = false,
}: ProfilePanelProps) {
  const profiles = household?.profiles ?? [];
  const hasOthers = profiles.some((profile) => !profile.isCurrent);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ProfileAvatarOrInitial
          avatarId={avatarId}
          name={displayName}
          className="size-24 text-4xl ring-4 ring-[#FFA503] shadow-md"
        />
        <p
          data-profile-name
          className="max-w-full truncate font-heading text-2xl font-extrabold text-[#031F82]"
        >
          {displayName}
        </p>
        {roleLabel ? (
          <p
            data-profile-role
            className={cn(
              "rounded-full px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide",
              PARENT_ROLE_PILL_CLASS,
            )}
          >
            {roleLabel}
          </p>
        ) : null}
        {trackLabel ? (
          <p
            data-profile-track
            className={cn(
              "rounded-full px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide",
              TRACK_PILL_CLASS,
            )}
          >
            {trackLabel}
          </p>
        ) : null}
      </div>

      {onOpenParentHub ? (
        <button
          type="button"
          data-profile-parent-hub
          onClick={onOpenParentHub}
          className="flex w-full items-center gap-2.5 rounded-2xl bg-[#F7FBFF] p-3 text-left transition-colors hover:bg-[#E8F6FC]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]">
            <ParentHubTabIconA className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading text-sm font-bold text-[#031F82]">
              {PROFILE_SWITCHER_COPY.parentHub}
            </span>
            <span className="text-[11.5px] font-medium text-[#1E3A5F]">
              {PROFILE_SWITCHER_COPY.parentHubSub}
            </span>
          </span>
          <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3.5 shrink-0 text-[#0288A3]">
            <path d="M4.5 3 7.5 6 4.5 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      {profiles.length > 1 ? (
        <section aria-labelledby="profile-switch-heading" data-profile-switcher-section>
          <SectionLabel id="profile-switch-heading">
            {PROFILE_SWITCHER_COPY.switchHeading}
          </SectionLabel>
          <ul className="mt-2 flex flex-col gap-1 rounded-2xl bg-[#F7FBFF] p-2">
            {profiles.map((profile) => (
              <ProfileRow
                key={profile.userId}
                profile={profile}
                currentAvatarId={avatarId}
              />
            ))}
          </ul>
          {hasOthers && !PROFILE_SWITCHING_AVAILABLE ? (
            <p className="mt-1.5 font-sans text-[11px] text-[#8FA3B0]">
              {PROFILE_SWITCHER_COPY.soonNote}
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="profile-avatar-heading">
        <SectionLabel id="profile-avatar-heading">Choose your avatar</SectionLabel>
        <div
          role="radiogroup"
          aria-labelledby="profile-avatar-heading"
          className="mt-2 grid grid-cols-3 gap-3 rounded-2xl bg-[#F7FBFF] p-3 min-[400px]:grid-cols-6"
        >
          {PROFILE_AVATAR_OPTIONS.map((option) => {
            const selected = option.id === avatarId;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.name}
                data-avatar-option={option.id}
                onClick={() => onChooseAvatar(option.id)}
                className="flex flex-col items-center gap-1 rounded-xl p-1 transition-transform active:scale-95"
              >
                <ProfileAvatarImage
                  avatarId={option.id}
                  className={cn(
                    "size-12",
                    selected
                      ? "ring-[3px] ring-[#031F82] ring-offset-2"
                      : "opacity-80",
                  )}
                />
                <span
                  className={cn(
                    "font-heading text-[11px] font-bold",
                    selected ? "text-[#031F82]" : "text-[#8FA3B0]",
                  )}
                >
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 font-sans text-[11px] text-[#8FA3B0]">
          Saved on this device.
        </p>
      </section>

      <AchievementsSection initiallyOpen={achievementsInitiallyOpen} />
    </div>
  );
}

/** Medals live in a collapsible Achievements section, closed by default. */
function AchievementsSection({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const bodyId = useId();
  return (
    <section
      id="achievements"
      aria-labelledby="medals-collection-title"
      data-profile-achievements={open ? "open" : "closed"}
      className="rounded-2xl bg-[#F7FBFF] p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          data-profile-achievements-toggle
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 flex-1 items-center justify-between gap-2 text-left"
        >
          <SectionLabel id="medals-collection-title">Achievements</SectionLabel>
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-[#0288A3] transition-transform",
              open && "rotate-180",
            )}
          >
            <path
              d="M3 4.5 6 7.5 9 4.5"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <MedalsIntro />
      </div>
      <div id={bodyId} hidden={!open} className="mt-2">
        {open ? <SkillsCollectionPanel /> : null}
      </div>
    </section>
  );
}
