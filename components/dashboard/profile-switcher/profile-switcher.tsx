"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { ProfileAvatarOrInitial } from "@/components/dashboard/profile/profile-avatar";
import { masteryCohortLabel } from "@/lib/dashboard/mastery-cohort";
import {
  PROFILE_AVATAR_CHANGED_EVENT,
  PROFILE_AVATAR_STORAGE_KEY,
  explicitProfileAvatarId,
  readStoredProfileAvatarId,
  type ProfileAvatarId,
} from "@/lib/dashboard/profile-avatar";
import { CheckIcon, TrophyIcon } from "@/lib/dashboard/icons";
import {
  ParentHubTabIconA,
  SettingsTabIconA,
} from "@/lib/dashboard/tab-icons-a";
import {
  PROFILE_SWITCHING_AVAILABLE,
  type HouseholdProfile,
  type HouseholdProfiles,
} from "@/lib/profile-switcher/household-profiles";
import { zLayerStyle } from "@/lib/ui/layers";
import {
  PARENT_ROLE_PILL_CLASS,
  TRACK_PILL_CLASS,
} from "@/lib/dashboard/track-pill";
import { cn } from "@/lib/utils/cn";

export const PROFILE_SWITCHER_COPY = {
  tip: "Tap your avatar to switch profiles",
  viewProfile: "View my profile",
  viewProfileSub: "Achievements & medals",
  settings: "Settings",
  /** Parent menu: their Settings holds both PINs. */
  settingsSubParent: "PINs, account and preferences",
  /** Child and guest menus: no PINs there. */
  settingsSub: "Account and preferences",
  parentHub: "Parent Hub",
  parentHubSub: "Approvals and your child's progress",
  switchHeading: "Switch profile",
  parentTag: "Parent",
  /** Screen-reader label for the check on the current profile. */
  here: "Current profile",
  soon: "Coming soon",
  soonNote: "Switching profiles is coming soon.",
  loading: "Loading profiles…",
} as const;

function ChevronGlyph({ up, className }: { up: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d={up ? "M3 7.5 6 4.5 9 7.5" : "M3 4.5 6 7.5 9 4.5"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small arrow badge on the top-bar avatar. Flips up while the menu is open. */
export function ProfileSwitcherBadge({ open }: { open: boolean }) {
  return (
    <span
      data-profile-switcher-badge={open ? "open" : "closed"}
      aria-hidden
      className={cn(
        "absolute -bottom-0.5 -right-[3px] flex size-[15px] items-center justify-center rounded-full",
        open
          ? "bg-[#031F82] text-white shadow-[0_0_0_1.5px_#fff]"
          : "bg-white text-[#031F82] shadow-[0_0_0_1.5px_#031F82]",
      )}
    >
      <ChevronGlyph up={open} className="size-[11px]" />
    </span>
  );
}

/** One-time tip under the avatar. Positioned by the avatar wrapper. */
export function ProfileSwitcherTip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      data-profile-switcher-tip
      onClick={onDismiss}
      className="absolute left-0 top-[calc(100%+12px)] z-raised whitespace-nowrap rounded-[10px] bg-[#031F82] px-3 py-[7px] text-left text-[12.5px] font-semibold text-white shadow-[0_6px_16px_-4px_rgb(3_31_130/0.5)]"
    >
      <span
        aria-hidden
        className="absolute -top-[5px] left-[13px] size-2.5 rotate-45 rounded-[2px] bg-[#031F82]"
      />
      <span className="relative">{PROFILE_SWITCHER_COPY.tip}</span>
    </button>
  );
}

function useAvatarFor(profile: HouseholdProfile): ProfileAvatarId | null {
  const [avatarId, setAvatarId] = useState<ProfileAvatarId | null>(null);
  useEffect(() => {
    const sync = () => {
      if (profile.role === "child") {
        setAvatarId(
          readStoredProfileAvatarId(profile.userId, profile.cohort ?? "explorer"),
        );
        return;
      }
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY);
      } catch {
        raw = null;
      }
      setAvatarId(explicitProfileAvatarId(raw, profile.userId));
    };
    sync();
    window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, sync);
  }, [profile.cohort, profile.role, profile.userId]);
  return avatarId;
}

export function ProfileRow({
  profile,
  currentAvatarId,
}: {
  profile: HouseholdProfile;
  currentAvatarId: ProfileAvatarId | null;
}) {
  const storedAvatarId = useAvatarFor(profile);
  const avatarId = profile.isCurrent ? currentAvatarId : storedAvatarId;
  const tag =
    profile.role === "parent"
      ? PROFILE_SWITCHER_COPY.parentTag
      : profile.cohort
        ? masteryCohortLabel(profile.cohort)
        : null;
  const disabled = !profile.isCurrent && !PROFILE_SWITCHING_AVAILABLE;

  return (
    <li
      data-profile-switcher-row={profile.userId}
      data-profile-switcher-role={profile.role}
      data-current={profile.isCurrent ? "true" : "false"}
      aria-current={profile.isCurrent ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "flex items-center gap-[11px] rounded-[14px] border-2 px-2.5 py-2",
        profile.isCurrent
          ? "border-[#FFA503] bg-[#FFF4DE]"
          : "border-transparent",
        disabled && "opacity-60",
      )}
    >
      <ProfileAvatarOrInitial
        avatarId={avatarId}
        name={profile.name}
        className="size-10 text-base"
      />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span
          data-profile-switcher-name
          className="line-clamp-2 max-w-full break-words font-heading text-[15px] font-bold leading-tight text-[#031F82]"
        >
          {profile.name}
        </span>
        {tag ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-px font-heading text-[9.5px] font-bold uppercase tracking-[0.4px]",
              profile.role === "parent" ? PARENT_ROLE_PILL_CLASS : TRACK_PILL_CLASS,
            )}
          >
            {tag}
          </span>
        ) : null}
      </span>
      {profile.isCurrent ? (
        <span
          data-profile-switcher-current-check
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FFA503] text-white"
        >
          <CheckIcon className="size-4" />
          <span className="sr-only">{PROFILE_SWITCHER_COPY.here}</span>
        </span>
      ) : disabled ? (
        <span className="shrink-0 text-[11px] font-semibold text-[#64748b]">
          {PROFILE_SWITCHER_COPY.soon}
        </span>
      ) : null}
    </li>
  );
}

type MenuBox = { top: number; left: number; width: number; caretLeft: number };

function measure(anchor: HTMLElement | null): MenuBox | null {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const header = anchor.closest("header") as HTMLElement | null;
  const barBottom = header ? header.getBoundingClientRect().bottom : rect.bottom;
  const viewport = window.innerWidth;
  const width = Math.min(300, viewport - 24);
  const left = Math.max(12, Math.min(rect.left - 4, viewport - width - 12));
  const caretLeft = Math.max(
    12,
    Math.min(rect.left + 16 - left - 8, width - 28),
  );
  return { top: barBottom + 10, left, width, caretLeft };
}

function LoadingRow() {
  return (
    <li
      data-profile-switcher-loading
      role="status"
      aria-live="polite"
      className="flex items-center gap-[11px] rounded-[14px] border-2 border-transparent px-2.5 py-2"
    >
      <span
        aria-hidden
        className="size-10 shrink-0 animate-pulse rounded-full bg-[#E8F6FC]"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          aria-hidden
          className="h-3 w-28 animate-pulse rounded-full bg-[#E8F6FC]"
        />
        <span className="text-[11.5px] font-medium text-[#64748b]">
          {PROFILE_SWITCHER_COPY.loading}
        </span>
      </span>
    </li>
  );
}

/**
 * Dropdown under the top-bar avatar: "View my profile", then the household's
 * profiles with the current one highlighted. No PIN and no lock icons.
 * Always used for the avatar tap: while the household is loading the list
 * shows a loading row; with no linked profiles only "View my profile" shows.
 */
export function ProfileSwitcherMenu({
  open,
  anchorRef,
  household,
  loading = false,
  currentAvatarId,
  onClose,
  onViewProfile,
  onOpenSettings,
  onOpenParentHub,
  isParent = false,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  household: HouseholdProfiles | null;
  loading?: boolean;
  currentAvatarId: ProfileAvatarId | null;
  onClose: () => void;
  onViewProfile: () => void;
  /** Opens Settings. Every profile gets this row. */
  onOpenSettings: () => void;
  /** Only for a parent who can open the Parent Hub. */
  onOpenParentHub?: () => void;
  /** Parents get the PINs subtitle on Settings; children and guests do not. */
  isParent?: boolean;
}) {
  const [box, setBox] = useState<MenuBox | null>(null);
  const [scrimTop, setScrimTop] = useState(0);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const next = measure(anchorRef.current);
      setBox(next);
      setScrimTop(next ? next.top - 10 : 0);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        (anchorRef.current as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anchorRef, onClose, open]);

  if (!open || !box || typeof document === "undefined") return null;
  const profiles = household?.profiles ?? [];
  const hasOthers = profiles.some((profile) => !profile.isCurrent);
  const showList = loading || profiles.length > 0;

  return createPortal(
    <>
      <div
        data-profile-switcher-scrim
        aria-hidden
        onClick={onClose}
        style={{ ...zLayerStyle("overlay"), top: scrimTop }}
        className="fixed inset-x-0 bottom-0 bg-[rgb(3_31_130/0.38)]"
      />
      <div
        id="profile-switcher-menu"
        data-profile-switcher-menu
        role="dialog"
        aria-label="Profiles"
        style={{
          ...zLayerStyle("modal"),
          top: box.top,
          left: box.left,
          width: box.width,
        }}
        className="fixed rounded-[18px] bg-white p-2 shadow-[0_14px_40px_-6px_rgb(3_31_130/0.45)]"
      >
        <span
          aria-hidden
          style={{ left: box.caretLeft }}
          className="absolute -top-[7px] size-4 rotate-45 rounded-[3px] bg-white"
        />
        <button
          ref={firstItemRef}
          type="button"
          data-profile-switcher-view-profile
          onClick={onViewProfile}
          className="relative flex w-full items-center gap-2.5 rounded-xl bg-[#E8F6FC] p-2.5 text-left transition-opacity hover:opacity-90 active:opacity-75"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#FFA503]">
            <TrophyIcon className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading text-sm font-bold text-[#031F82]">
              {PROFILE_SWITCHER_COPY.viewProfile}
            </span>
            <span className="text-[11.5px] font-medium text-[#1E3A5F]">
              {PROFILE_SWITCHER_COPY.viewProfileSub}
            </span>
          </span>
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            className="size-3.5 shrink-0 text-[#0288A3]"
          >
            <path
              d="M4.5 3 7.5 6 4.5 9"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <MenuLinkRow
          data-attr="settings"
          icon={<SettingsTabIconA className="size-5" />}
          title={PROFILE_SWITCHER_COPY.settings}
          sub={
            isParent
              ? PROFILE_SWITCHER_COPY.settingsSubParent
              : PROFILE_SWITCHER_COPY.settingsSub
          }
          onClick={onOpenSettings}
        />
        {onOpenParentHub ? (
          <MenuLinkRow
            data-attr="parent-hub"
            icon={<ParentHubTabIconA className="size-5" />}
            title={PROFILE_SWITCHER_COPY.parentHub}
            sub={PROFILE_SWITCHER_COPY.parentHubSub}
            onClick={onOpenParentHub}
          />
        ) : null}
        {showList ? (
          <>
            <p className="px-2.5 pb-1.5 pt-3 font-heading text-[11px] font-bold uppercase tracking-[0.6px] text-[#64748b]">
              {PROFILE_SWITCHER_COPY.switchHeading}
            </p>
            <ul
              data-profile-switcher-list
              data-profile-switcher-list-state={loading ? "loading" : "ready"}
              aria-busy={loading || undefined}
              className="flex flex-col gap-1"
            >
              {loading ? (
                <LoadingRow />
              ) : (
                profiles.map((profile) => (
                  <ProfileRow
                    key={profile.userId}
                    profile={profile}
                    currentAvatarId={currentAvatarId}
                  />
                ))
              )}
            </ul>
          </>
        ) : null}
        {!loading && hasOthers && !PROFILE_SWITCHING_AVAILABLE ? (
          <p
            data-profile-switcher-soon-note
            className="px-2.5 pb-1 pt-2 text-[11.5px] font-medium leading-snug text-[#64748b]"
          >
            {PROFILE_SWITCHER_COPY.soonNote}
          </p>
        ) : null}
      </div>
    </>,
    document.body,
  );
}

/** Plain menu row under "View my profile": Settings, and the Parent Hub for parents. */
function MenuLinkRow({
  "data-attr": attr,
  icon,
  title,
  sub,
  onClick,
}: {
  "data-attr": "settings" | "parent-hub";
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-profile-switcher-link={attr}
      onClick={onClick}
      className="mt-1 flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[#F2F8FF] active:bg-[#E8F6FC]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-heading text-sm font-bold text-[#031F82]">{title}</span>
        <span className="text-[11.5px] font-medium text-[#1E3A5F]">{sub}</span>
      </span>
      <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3.5 shrink-0 text-[#0288A3]">
        <path
          d="M4.5 3 7.5 6 4.5 9"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
