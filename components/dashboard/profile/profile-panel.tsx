"use client";

import { MedalsIntro } from "@/components/achievements/medals-intro";
import { SkillsCollectionPanel } from "@/components/achievements/skills-collection-panel";
import { ProfileAvatarImage } from "@/components/dashboard/profile/profile-avatar";
import {
  PROFILE_AVATAR_OPTIONS,
  type ProfileAvatarId,
} from "@/lib/dashboard/profile-avatar";
import { cn } from "@/lib/utils/cn";

type ProfilePanelProps = {
  displayName: string;
  /** Track name (Explorer, Pathfinder, Maverick). Null for parents and teachers. */
  trackLabel: string | null;
  avatarId: ProfileAvatarId;
  onChooseAvatar: (id: ProfileAvatarId) => void;
};

function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="font-heading text-sm font-extrabold text-[#031F82]">
      {children}
    </h3>
  );
}

/** Body of the profile panel opened from the top-bar avatar. */
export function ProfilePanel({
  displayName,
  trackLabel,
  avatarId,
  onChooseAvatar,
}: ProfilePanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ProfileAvatarImage
          avatarId={avatarId}
          className="size-24 ring-4 ring-[#FFA503] shadow-md"
        />
        <p
          data-profile-name
          className="max-w-full truncate font-heading text-2xl font-extrabold text-[#031F82]"
        >
          {displayName}
        </p>
        {trackLabel ? (
          <p
            data-profile-track
            className="rounded-full bg-[#F7FBFF] px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-[#0288A3]"
          >
            {trackLabel}
          </p>
        ) : null}
      </div>

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

      <section aria-labelledby="medals-collection-title">
        <div className="flex items-center gap-2">
          <SectionLabel id="medals-collection-title">Medals</SectionLabel>
          <MedalsIntro />
        </div>
        <div className="mt-2">
          <SkillsCollectionPanel />
        </div>
      </section>
    </div>
  );
}
