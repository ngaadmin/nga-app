"use client";

import { useEffect, useId, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  PROFILE_SWITCHER_COPY,
  ProfileRow,
} from "@/components/dashboard/profile-switcher/profile-switcher";
import { ParentHubTabIconA } from "@/lib/dashboard/tab-icons-a";
import {
  PROFILE_SWITCHING_AVAILABLE,
  householdChildCount,
  type HouseholdProfiles,
} from "@/lib/profile-switcher/household-profiles";
import { parentHubSubtitle } from "@/lib/parent/pin-copy";
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
  /**
   * Parent account. Parents never get a profile switcher here: a parent must
   * not be able to switch into a child profile (COPPA; parent-targeted ads
   * must never reach kids). Their children live in the Parent Hub instead.
   */
  isParent?: boolean;
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
 * (child, parent, teacher, guest) uses this same template: a header with the
 * avatar (pencil to change it), the username and the track or role line,
 * then Achievements (medals), collapsed by default. The avatar picker only
 * opens from the pencil; it is never shown open on the profile itself.
 */
export function ProfilePanel({
  displayName,
  trackLabel,
  avatarId,
  onChooseAvatar,
  roleLabel = null,
  household = null,
  isParent = false,
  onOpenParentHub,
  achievementsInitiallyOpen = false,
}: ProfilePanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Parents never get a profile list: no parent-to-child switching (COPPA).
  const profiles = isParent ? [] : (household?.profiles ?? []);
  const hasOthers = profiles.some((profile) => !profile.isCurrent);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div
        data-profile-header
        className="flex flex-col items-center gap-2 text-center"
      >
        <div className="relative">
          <ProfileAvatarOrInitial
            avatarId={avatarId}
            name={displayName}
            className="size-[88px] text-[34px] ring-4 ring-[#FFA503] shadow-md"
          />
          <button
            type="button"
            data-profile-avatar-edit
            aria-label="Change your avatar"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen(true)}
            // 44px tap area (invisible padding) around a 28px navy circle that
            // sits on the avatar's top-right edge.
            className="group absolute -top-3 left-[56px] flex size-11 items-center justify-center rounded-full"
          >
            <span
              data-profile-avatar-edit-circle
              className="flex size-7 items-center justify-center rounded-full bg-[#031F82] text-white shadow-md ring-2 ring-white transition-transform group-active:scale-95"
            >
              <PencilIcon />
            </span>
          </button>
        </div>
        <p
          data-profile-name
          className="max-w-full truncate font-heading text-2xl font-extrabold text-[#031F82]"
        >
          {displayName}
        </p>
        {/*
          TODO(role pill): the line under a parent's username still reads
          "Parent". Cath is deciding what it should say; change it here (and
          the matching roleLabel passed from DashboardStatusHeader) once decided.
        */}
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
              {parentHubSubtitle(householdChildCount(household))}
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

      <AchievementsSection initiallyOpen={achievementsInitiallyOpen} />

      <AvatarPickerModal
        isOpen={pickerOpen}
        avatarId={avatarId}
        onChoose={(id) => {
          onChooseAvatar(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

/**
 * The avatar picker, opened only from the pencil on the profile avatar.
 * A pick replaces the avatar, saves it the same way as before (this device),
 * and closes the picker.
 */
function AvatarPickerModal({
  isOpen,
  avatarId,
  onChoose,
  onClose,
}: {
  isOpen: boolean;
  avatarId: ProfileAvatarId | null;
  onChoose: (id: ProfileAvatarId) => void;
  onClose: () => void;
}) {
  // Escape closes only the picker, not the Profile panel underneath.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, onClose]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      align="center"
      labelledBy="profile-avatar-heading"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-md rounded-[24px] bg-white p-4 shadow-md"
    >
      <div data-profile-avatar-picker>
        <div className="flex items-center justify-between gap-2">
          <h2
            id="profile-avatar-heading"
            className="font-heading text-base font-extrabold text-[#031F82]"
          >
            Choose your avatar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#031F82]/70 transition-colors hover:bg-[#BDE9FB]/50 hover:text-[#031F82]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="size-4"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="profile-avatar-heading"
          className="mt-2 grid grid-cols-3 gap-3"
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
                onClick={() => onChoose(option.id)}
                className="flex flex-col items-center gap-1 rounded-xl p-1 transition-transform active:scale-95"
              >
                <ProfileAvatarImage
                  avatarId={option.id}
                  className={cn(
                    "size-16",
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
        <p className="mt-2 text-center font-sans text-[11px] text-[#8FA3B0]">
          Saved on this device.
        </p>
      </div>
    </ModalShell>
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
