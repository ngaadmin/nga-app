"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  DownloadIcon,
  FlameIcon,
  GoldCoinIcon,
  LockIcon,
  TrashIcon,
  XpStarIcon,
} from "@/lib/dashboard/icons";
import { useCurrency } from "@/lib/dashboard/currency-context";
import type { LearnerDataView } from "@/lib/privacy/data-controls";
import { NavyButton, NavyOutlineButton, noteClass } from "@/components/privacy/data-buttons";
import { LeaderboardSwitch } from "@/components/privacy/leaderboard-switch";

type LearnerDataScreenProps = {
  view: LearnerDataView;
  title?: string;
  backHref: string;
  backLabel: string;
  siblings?: { userId: string; username: string }[];
  activeChildId?: string;
  onSelectChild?: (userId: string) => void;
  showLeaderboardSwitch?: boolean;
  onLeaderboardChange?: (enabled: boolean) => void;
  leaderboardBusy?: boolean;
  onDownload: () => void;
  onDelete: () => void;
  deleteLabel: string;
  downloading?: boolean;
  vaultNote?: string;
};

export function LearnerDataScreen({
  view,
  title = "My child's data",
  backHref,
  backLabel,
  siblings = [],
  activeChildId,
  onSelectChild,
  showLeaderboardSwitch = false,
  onLeaderboardChange,
  leaderboardBusy = false,
  onDownload,
  onDelete,
  deleteLabel,
  downloading = false,
  vaultNote = "Vault amounts are what you and your child track in the app. The app doesn't hold or move money.",
}: LearnerDataScreenProps) {
  const { formatMoney } = useCurrency();
  const initial = view.username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-1 py-2 pb-8">
      <Link href={backHref} className="font-heading text-sm font-bold text-[#0CC1E0]">
        ← {backLabel}
      </Link>
      <h1 className="mt-2.5 font-heading text-2xl font-extrabold text-[#031F82]">
        {title}
      </h1>
      <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        Everything NextGenAchiever$ keeps about this account.
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
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#0CC1E0] font-heading text-[22px] font-extrabold text-white shadow-md">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xl font-extrabold leading-tight text-[#031F82]">
              {view.username}
            </p>
            {view.trackLabel ? (
              <p className="mt-0.5 font-sans text-[13px] font-medium text-[#4A5675]">
                {view.trackLabel}
              </p>
            ) : null}
          </div>
          <span className="inline-flex h-[26px] shrink-0 items-center gap-1 rounded-full bg-[#EAF0FF] px-2.5 font-heading text-xs font-bold text-[#031F82]">
            <LockIcon className="size-3.5" />
            View only
          </span>
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

      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Progress
        </h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <StatTile
            icon={<BookOpenIcon className="size-4" />}
            value={String(view.lessonsDone)}
            label="Lessons done"
            note="Finished in the Academy"
          />
          <StatTile
            icon={<FlameIcon className="size-4" />}
            iconClass="bg-[#FFA503] text-[#031F82]"
            value={String(view.dayStreak)}
            unit="days"
            label="Day streak"
            note={`Best ever: ${view.bestStreak} days`}
          />
        </div>
        <WideStat
          icon={<GoldCoinIcon className="size-5" />}
          label="Coins balance"
          note="Ready to cash in."
          value={`${view.coins.toLocaleString()} coins`}
        />
        <WideStat
          icon={<XpStarIcon className="size-5 text-white" />}
          iconClass="bg-[#0CC1E0] text-white"
          label="Lifetime XP"
          note="A separate total. Cashing in never lowers it."
          value={`${view.lifetimeXp.toLocaleString()} XP`}
          accent
        />
      </section>

      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Medals
        </h2>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <MedalTile emoji="🥉" count={view.medals.bronze} label="Bronze" />
          <MedalTile emoji="🥈" count={view.medals.silver} label="Silver" />
          <MedalTile emoji="🥇" count={view.medals.gold} label="Gold" />
        </div>
        <p className="mt-1.5 font-sans text-xs font-medium text-[#4A5675]">
          Total ever earned, across all modules.
        </p>
      </section>

      <section className="mt-5">
        <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
          Vault
        </h2>
        <div className="mt-2.5 rounded-2xl bg-white px-3.5 pb-1 pt-3.5 shadow-md">
          <p className="font-heading text-[13px] font-bold text-[#4A5675]">Jars</p>
          <div className="mt-2.5 grid grid-cols-4 gap-1 pb-3">
            {view.jars.map((jar) => (
              <div key={jar.name} className="min-w-0 text-center">
                <div className="mx-auto flex size-[52px] items-center justify-center rounded-full bg-[#E8F6FC] text-[26px]">
                  {jar.emoji}
                </div>
                <p className="mt-1.5 whitespace-nowrap font-heading text-[12.5px] font-bold text-[#031F82]">
                  {jar.name}
                </p>
                <p className="font-sans text-[12.5px] font-semibold tabular-nums text-[#4A5675]">
                  {formatMoney(jar.amount)}
                </p>
              </div>
            ))}
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
            view.activity.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`flex items-center gap-3 py-2.5 ${index > 0 ? "border-t border-[#E1E8F6]" : ""}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-lg">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold text-[#031F82]">{item.title}</p>
                  <p className="font-sans text-[12.5px] font-medium text-[#4A5675]">{item.detail}</p>
                </div>
                <p className="whitespace-nowrap font-sans text-[12.5px] font-semibold text-[#4A5675]">
                  {item.when}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {showLeaderboardSwitch && onLeaderboardChange ? (
        <div className="mt-5">
          <LeaderboardSwitch
            enabled={view.leaderboardEnabled}
            scope="child"
            disabled={leaderboardBusy}
            onChange={onLeaderboardChange}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <NavyButton onClick={onDownload} disabled={downloading}>
          <DownloadIcon className="size-5" />
          Download data
        </NavyButton>
        <p className={`mt-1.5 ${noteClass()}`}>One plain data file with everything on this page.</p>
        <div className="mt-4">
          <NavyOutlineButton onClick={onDelete}>
            <TrashIcon className="size-5" />
            {deleteLabel}
          </NavyOutlineButton>
        </div>
        <p className={`mt-1.5 ${noteClass()}`}>You&apos;ll be asked to confirm first.</p>
      </div>
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
  iconClass = "bg-[#FFA503] text-[#031F82]",
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

function MedalTile({ emoji, count, label }: { emoji: string; count: number; label: string }) {
  return (
    <div className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF] px-1.5 py-2.5 text-center">
      <div className="text-[26px] leading-none">{emoji}</div>
      <p className="mt-1 font-heading text-xl font-extrabold tabular-nums text-[#031F82]">{count}</p>
      <p className="font-sans text-xs font-semibold text-[#4A5675]">{label}</p>
    </div>
  );
}
