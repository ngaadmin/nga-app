"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DownloadIcon,
  LockIcon,
  TrashIcon,
} from "@/lib/dashboard/icons";
import { useCurrency } from "@/lib/dashboard/currency-context";
import type { LearnerDataView } from "@/lib/privacy/data-controls";
import { NavyButton, NavyOutlineButton, noteClass } from "@/components/privacy/data-buttons";
import { LeaderboardSwitch } from "@/components/privacy/leaderboard-switch";
import { ProfileAvatarImage } from "@/components/dashboard/profile/profile-avatar";
import type { ProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import { MedalCountChip, SkillTile } from "@/components/achievements/skills-collection-panel";
import { ACTIVITY_ICONS, GradCapIconA, JAR_ICONS } from "@/lib/dashboard/progress-icons-a";
import { CoinsIconA, StreakIconA } from "@/lib/dashboard/tab-icons-a";

/** Soft peach discs with orange duotone, same as the top bar's coin and streak. */
const STAT_DISC = "bg-[#FFE7B8] text-[#031F82] [--tab-icon-fill:#FFA503]";
import { getVaultSkillTrophyById } from "@/lib/dashboard/skill-trophies";
import { cn } from "@/lib/utils/cn";

/**
 * "full": everything (teacher's student record).
 * "progress": the Parent Hub's read-only view (progress, medals, Vault,
 *   recent activity). No privacy controls.
 * "privacy": the child's privacy controls only (leaderboard switch,
 *   download, delete).
 * "hub": the Parent Hub child page. Progress first, then a "Data & privacy"
 *   section with the leaderboard switch, the data file and delete.
 */
export type LearnerDataScreenMode = "full" | "progress" | "privacy" | "hub";

type LearnerDataScreenProps = {
  view: LearnerDataView;
  mode?: LearnerDataScreenMode;
  title?: string;
  subtitle?: string;
  /** Link back. Ignored when onBack is set. */
  backHref?: string;
  /** In-page back (e.g. the Parent Hub, which must stay unlocked). */
  onBack?: () => void;
  backLabel: string;
  siblings?: { userId: string; username: string }[];
  activeChildId?: string;
  onSelectChild?: (userId: string) => void;
  showLeaderboardSwitch?: boolean;
  onLeaderboardChange?: (enabled: boolean) => void;
  leaderboardBusy?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  downloading?: boolean;
  vaultNote?: string;
  /** The learner's chosen avatar. Without it, the first letter shows. */
  avatarId?: ProfileAvatarId;
};

export function LearnerDataScreen({
  view,
  mode = "full",
  title = "Your child's data",
  subtitle = "Everything NextGenAchievers keeps about this account.",
  backHref = "/dashboard/settings",
  onBack,
  backLabel,
  siblings = [],
  activeChildId,
  onSelectChild,
  showLeaderboardSwitch = false,
  onLeaderboardChange,
  leaderboardBusy = false,
  onDownload,
  onDelete,
  deleteLabel = "Delete account",
  downloading = false,
  vaultNote = "Vault amounts are what you and your child track in the app. The app doesn't hold or move money.",
  avatarId,
}: LearnerDataScreenProps) {
  const { formatMoney } = useCurrency();
  const initial = view.username.trim().charAt(0).toUpperCase() || "?";
  const showProgress = mode !== "privacy";
  const showControls = mode !== "progress";
  const hubPrivacy = mode === "hub";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-1 py-2 pb-8">
      {onBack ? (
        <button
          type="button"
          data-learner-data-back
          onClick={onBack}
          className="self-start font-heading text-sm font-bold text-[#0CC1E0]"
        >
          ← {backLabel}
        </button>
      ) : (
        <Link
          href={backHref}
          data-learner-data-back
          className="font-heading text-sm font-bold text-[#0CC1E0]"
        >
          ← {backLabel}
        </Link>
      )}
      <h1 className="mt-2.5 font-heading text-2xl font-extrabold text-[#031F82]">
        {title}
      </h1>
      <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {subtitle}
      </p>

      {siblings.length > 1 ? (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {siblings.map((child) => {
            const active = child.userId === (activeChildId ?? view.userId);
            return (
              <button
                key={child.userId}
                type="button"
                onClick={() => onSelectChild?.(child.userId)}
                className={
                  active
                    ? "inline-flex h-[30px] items-center rounded-full bg-[#031F82] px-3 font-heading text-[13px] font-bold text-white"
                    : "inline-flex h-[30px] items-center rounded-full border-2 border-[#031F82]/25 bg-white px-3 font-heading text-[13px] font-bold text-[#031F82]/60"
                }
              >
                {child.username}
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="mt-3.5 rounded-2xl bg-white p-4 shadow-md">
        <div className="flex items-center gap-3.5">
          {avatarId ? (
            <ProfileAvatarImage
              avatarId={avatarId}
              className="size-[52px] shadow-md"
            />
          ) : (
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#0CC1E0] font-heading text-[22px] font-extrabold text-white shadow-md">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="break-words font-heading text-xl font-extrabold leading-tight text-[#031F82]">
              {view.username}
            </p>
            {view.trackLabel ? (
              <p className="mt-0.5 font-sans text-[13px] font-medium text-[#4A5675]">
                {view.trackLabel}
              </p>
            ) : null}
            {/* Below the name, so a long name gets the whole row. */}
            <span
              data-learner-data-view-only
              className="mt-1.5 inline-flex h-[26px] items-center gap-1 rounded-full bg-[#EAF0FF] px-2.5 font-heading text-xs font-bold text-[#031F82]"
            >
              <LockIcon className="size-3.5" />
              View only
            </span>
          </div>
        </div>
        {view.accountLine ? (
          <div className="mt-3.5 border-t border-[#BDE9FB]/60 pt-3">
            <p className="font-sans text-[13px] font-medium text-[#4A5675]">Account type</p>
            <p className="mt-px font-sans text-[15px] font-semibold text-[#031F82]">
              {view.accountLine}
            </p>
          </div>
        ) : null}
        {view.linkedParentEmail ? (
          <div className="mt-3.5 border-t border-[#BDE9FB]/60 pt-3">
            <p className="font-sans text-[13px] font-medium text-[#4A5675]">Linked parent email</p>
            <p className="mt-px font-sans text-[15px] font-semibold text-[#031F82]">
              {view.linkedParentEmail}
            </p>
          </div>
        ) : null}
      </section>

      {showProgress ? (
        <div data-learner-data-progress>
      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Progress
        </h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <StatTile
            icon={<GradCapIconA className="size-[18px]" />}
            iconClass={STAT_DISC}
            value={String(view.lessonsDone)}
            label="Lessons done"
            note="Finished in the Academy"
          />
          <StatTile
            icon={<StreakIconA className="size-[18px]" />}
            iconClass={STAT_DISC}
            value={String(view.dayStreak)}
            unit={view.dayStreak === 1 ? "day" : "days"}
            label="Day streak"
            note={`Best ever: ${view.bestStreak} ${view.bestStreak === 1 ? "day" : "days"}`}
          />
        </div>
        <WideStat
          icon={<CoinsIconA className="size-5" />}
          label="Coins balance"
          note="Ready to cash in."
          value={`${view.coins.toLocaleString()} coins`}
        />
        <WideStat
          icon={<CoinsIconA className="size-5" />}
          label="Lifetime coins"
          note="The total coins this account has earned."
          value={`${view.lifetimeXp.toLocaleString()} coins`}
        />
      </section>

      <AchievementsSection view={view} />

      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Vault
        </h2>
        <div className="mt-2.5 rounded-2xl bg-white px-3.5 pb-1 pt-3.5 shadow-md">
          <p className="font-heading text-[13px] font-bold text-[#4A5675]">Jars</p>
          <div className="mt-2.5 grid grid-cols-4 gap-1 pb-3">
            {view.jars.map((jar) => {
              const { Icon, toneClassName } = JAR_ICONS[jar.id];
              return (
              <div key={jar.id} data-learner-data-jar={jar.id} className="min-w-0 text-center">
                <div
                  className={cn(
                    "mx-auto flex size-[52px] items-center justify-center rounded-full",
                    toneClassName,
                  )}
                >
                  <Icon className="size-7" />
                </div>
                <p className="mt-1.5 whitespace-nowrap font-heading text-[12.5px] font-bold text-[#031F82]">
                  {jar.name}
                </p>
                <p className="font-sans text-[12.5px] font-semibold tabular-nums text-[#4A5675]">
                  {formatMoney(jar.amount)}
                </p>
              </div>
              );
            })}
          </div>
          {view.goals.length > 0 ? (
            <>
              <p className="mb-0.5 font-heading text-[13px] font-bold text-[#4A5675]">Savings goals</p>
              {view.goals.map((goal) => {
                const width = goal.target > 0 ? Math.min(100, (goal.balance / goal.target) * 100) : 0;
                return (
                  <div key={goal.name} className="flex items-center gap-3 border-t border-[#BDE9FB]/60 py-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6FC] text-lg">
                      {goal.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-heading text-sm font-bold text-[#031F82]">{goal.name}</p>
                        <p className="whitespace-nowrap font-sans text-[13px] font-semibold tabular-nums text-[#4A5675]">
                          {formatMoney(goal.balance)} of {formatMoney(goal.target)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-[#E8F6FC]">
                        <div className="h-2 rounded-full bg-[#0CC1E0]" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="border-t border-[#BDE9FB]/60 py-2.5 font-sans text-[13px] text-[#4A5675]">
              No savings goals yet.
            </p>
          )}
        </div>
        <p className="mt-1.5 font-sans text-xs font-medium leading-snug text-[#4A5675]">
          {vaultNote}
        </p>
      </section>

      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Recent activity
        </h2>
        <div className="mt-2.5 rounded-2xl bg-white px-3.5 py-1 shadow-md">
          {view.activity.length === 0 ? (
            <p className="py-3 font-sans text-sm text-[#4A5675]">No activity yet.</p>
          ) : (
            view.activity.map((item, index) => {
              const { Icon, toneClassName } = ACTIVITY_ICONS[item.icon];
              return (
              <div
                key={`${item.title}-${index}`}
                data-learner-data-activity={item.icon}
                className={`flex items-center gap-3 py-2.5 ${index > 0 ? "border-t border-[#E1E8F6]" : ""}`}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    toneClassName,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-[#031F82]">{item.title}</p>
                  <p className="font-sans text-[12.5px] font-medium text-[#4A5675]">{item.detail}</p>
                </div>
                <p className="whitespace-nowrap font-sans text-[12.5px] font-semibold text-[#4A5675]">
                  {item.when}
                </p>
              </div>
              );
            })
          )}
        </div>
      </section>

        </div>
      ) : null}

      {hubPrivacy ? (
        <section data-child-data-privacy className="mt-6">
          <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
            Data &amp; privacy
          </h2>
          <p className="mt-1 font-sans text-[13px] leading-snug text-[#4A5675]">
            Leaderboard visibility, {view.username}&apos;s data file and deleting their account.
          </p>
        </section>
      ) : null}

      {showControls && showLeaderboardSwitch && onLeaderboardChange ? (
        <div className={hubPrivacy ? "mt-3" : "mt-5"}>
          <LeaderboardSwitch
            enabled={view.leaderboardEnabled}
            scope="child"
            disabled={leaderboardBusy}
            onChange={onLeaderboardChange}
          />
        </div>
      ) : null}

      {showControls && (onDownload || onDelete) ? (
        <div className={hubPrivacy ? "mt-4" : "mt-6"} data-learner-data-controls>
          {onDownload ? (
            <>
              <NavyButton onClick={onDownload} disabled={downloading}>
                <DownloadIcon className="size-5" />
                Download data
              </NavyButton>
              <p className={`mt-1.5 ${noteClass()}`}>
                {mode === "privacy" || mode === "hub"
                  ? "One plain data file with everything kept about this account, progress included."
                  : "One plain data file with everything on this page."}
              </p>
            </>
          ) : null}
          {onDelete ? (
            <>
              <div className="mt-4">
                <NavyOutlineButton onClick={onDelete}>
                  <TrashIcon className="size-5" />
                  {deleteLabel}
                </NavyOutlineButton>
              </div>
              <p className={`mt-1.5 ${noteClass()}`}>You&apos;ll be asked to confirm first.</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatTile({
  icon,
  iconClass = "bg-[#031F82] text-white",
  value,
  unit,
  label,
  note,
}: {
  icon: ReactNode;
  iconClass?: string;
  value: string;
  unit?: string;
  label: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          {icon}
        </span>
        <p className="font-heading text-[22px] font-extrabold leading-none tabular-nums text-[#031F82]">
          {value}
          {unit ? <span className="font-sans text-[13px] font-semibold text-[#4A5675]"> {unit}</span> : null}
        </p>
      </div>
      <p className="font-heading text-[13px] font-bold leading-tight text-[#031F82]">{label}</p>
      <p className="font-sans text-xs font-medium text-[#4A5675]">{note}</p>
    </div>
  );
}

function WideStat({
  icon,
  iconClass = STAT_DISC,
  label,
  note,
  value,
  accent = false,
}: {
  icon: ReactNode;
  iconClass?: string;
  label: string;
  note: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`mt-2.5 flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 ${
        accent ? "border-[#0CC1E0]/35 bg-[#F2FBFD]" : "border-[#BDE9FB]/70 bg-[#F7FBFF]"
      }`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[13px] font-bold text-[#031F82]">{label}</p>
        <p className="font-sans text-xs font-medium text-[#4A5675]">{note}</p>
      </div>
      <p className="whitespace-nowrap font-heading text-[22px] font-extrabold tabular-nums text-[#031F82]">
        {value}
      </p>
    </div>
  );
}

/**
 * Medals, collapsed by default like the profile's Achievements section:
 * the total in the header row; counts and the flat medal art when opened.
 */
function AchievementsSection({ view }: { view: LearnerDataView }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const total = view.medals.bronze + view.medals.silver + view.medals.gold;
  const skills = view.earnedSkills
    .map((entry) => {
      const trophy = getVaultSkillTrophyById(entry.slug);
      return trophy ? { ...trophy, tier: entry.tier } : null;
    })
    .filter((skill): skill is NonNullable<typeof skill> => skill !== null);

  return (
    <section
      data-learner-data-achievements
      data-learner-data-achievements-state={open ? "open" : "closed"}
      className="mt-5 rounded-2xl bg-white px-3.5 shadow-md"
    >
      <button
        type="button"
        data-learner-data-achievements-toggle
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 py-3.5 text-left"
      >
        <h2 className="flex-1 font-heading text-[15px] font-bold text-[#031F82]">
          Achievements
        </h2>
        <span className="font-sans text-[12.5px] font-semibold text-[#4A5675]">
          {total} {total === 1 ? "medal" : "medals"}
        </span>
        <svg
          viewBox="0 0 12 12"
          width="14"
          height="14"
          aria-hidden
          className={cn(
            "shrink-0 text-[#0288A3] transition-transform",
            open && "rotate-180",
          )}
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div id={panelId} className="border-t border-[#BDE9FB]/60 pb-3.5 pt-3">
          <div aria-label="Medal counts" className="flex w-full items-stretch gap-2">
            <MedalCountChip
              label="Bronze"
              value={view.medals.bronze}
              toneClassName="text-[#CD7F32]"
            />
            <MedalCountChip
              label="Silver"
              value={view.medals.silver}
              toneClassName="text-[#8FA3B0]"
            />
            <MedalCountChip
              label="Gold"
              value={view.medals.gold}
              toneClassName="text-[#FFA503]"
            />
          </div>
          {skills.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4">
              {skills.map((skill) => (
                <SkillTile key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <p className="mt-3 font-sans text-[13px] text-[#4A5675]">No medals yet.</p>
          )}
          <p className="mt-3 font-sans text-xs font-medium text-[#4A5675]">
            Total ever earned, across all modules.
          </p>
        </div>
      ) : null}
    </section>
  );
}
