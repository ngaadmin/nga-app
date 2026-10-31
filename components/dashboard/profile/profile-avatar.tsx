"use client";

import { useCallback, useEffect, useState } from "react";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  DEFAULT_PROFILE_AVATAR_BY_COHORT,
  PROFILE_AVATAR_CHANGED_EVENT,
  PROFILE_AVATAR_STORAGE_KEY,
  explicitProfileAvatarId,
  profileAvatarOption,
  readStoredProfileAvatarId,
  saveProfileAvatarId,
  type ProfileAvatarId,
} from "@/lib/dashboard/profile-avatar";
import { cn } from "@/lib/utils/cn";

/** Round head crop of a character illustration. Decorative. */
export function ProfileAvatarImage({
  avatarId,
  className,
}: {
  avatarId: ProfileAvatarId;
  className?: string;
}) {
  const option = profileAvatarOption(avatarId);
  const scale = (option.width / option.cropSize) * 100;
  const posX =
    option.width === option.cropSize
      ? 50
      : (option.cropX / (option.width - option.cropSize)) * 100;
  const posY =
    option.height === option.cropSize
      ? 0
      : (option.cropY / (option.height - option.cropSize)) * 100;

  return (
    <span
      aria-hidden
      data-profile-avatar={avatarId}
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-full bg-[#FFE7B8] bg-no-repeat",
        className,
      )}
      style={{
        backgroundImage: `url(${option.src})`,
        backgroundSize: `${scale}% auto`,
        backgroundPosition: `${posX}% ${posY}%`,
      }}
    />
  );
}

/** Chosen avatar for this profile on this device, or the track default. */
export function useProfileAvatar(profileKey: string, cohort: MasteryCohort) {
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>(
    DEFAULT_PROFILE_AVATAR_BY_COHORT[cohort],
  );
  const [chosenAvatarId, setChosenAvatarId] = useState<ProfileAvatarId | null>(null);

  useEffect(() => {
    const sync = () => {
      setAvatarId(readStoredProfileAvatarId(profileKey, cohort));
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY);
      } catch {
        raw = null;
      }
      setChosenAvatarId(explicitProfileAvatarId(raw, profileKey));
    };
    sync();
    window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [profileKey, cohort]);

  const chooseAvatar = useCallback(
    (id: ProfileAvatarId) => {
      setAvatarId(id);
      setChosenAvatarId(id);
      saveProfileAvatarId(profileKey, id);
    },
    [profileKey],
  );

  /** chosenAvatarId is null until this profile picks one (track default otherwise). */
  return { avatarId, chosenAvatarId, chooseAvatar };
}

/**
 * Avatar art, or the first letter of the name when there is no art to show.
 * Parents get the letter until they pick a picture, so a parent never shows
 * up as a child character such as Lars.
 */
export function ProfileAvatarOrInitial({
  avatarId,
  name,
  className,
}: {
  avatarId: ProfileAvatarId | null;
  name: string;
  className?: string;
}) {
  if (avatarId) {
    return <ProfileAvatarImage avatarId={avatarId} className={className} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || "P";
  return (
    <span
      aria-hidden
      data-profile-avatar="initial"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[#031F82] font-heading font-extrabold leading-none text-white",
        className,
      )}
    >
      <span className="text-[0.95em]">{initial}</span>
    </span>
  );
}
