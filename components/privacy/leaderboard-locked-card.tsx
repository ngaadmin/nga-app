"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LockIcon } from "@/lib/dashboard/icons";

const ASKED_KEY = "nga_leaderboard_asked_v1";

type LeaderboardLockedCardProps = {
  askButton: boolean;
};

/** Locked Community leaderboard. Asking is saved on this device only. */
export function LeaderboardLockedCard({ askButton }: LeaderboardLockedCardProps) {
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    setAsked(window.sessionStorage.getItem(ASKED_KEY) === "1");
  }, []);

  function ask() {
    window.sessionStorage.setItem(ASKED_KEY, "1");
    setAsked(true);
  }

  return (
    <section className="rounded-[20px] border-2 border-[#BDE9FB]/90 bg-[#F2FAFE] px-5 py-[22px] text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-[#031F82] shadow-md">
        <LockIcon className="size-7" />
      </div>
      <p className="mt-3.5 font-heading text-xs font-extrabold uppercase tracking-wide text-[#4A5675]">
        Community Leaderboard
      </p>
      <h2 className="mt-1 font-heading text-xl font-extrabold leading-tight text-[#031F82]">
        Leaderboard is switched off
      </h2>
      <p className="mt-2 font-sans text-[15px] text-[#1E3A5F]">
        Ask your account manager to turn it on.
      </p>
      <div className="mt-3.5 flex items-center justify-center gap-2.5 rounded-[14px] bg-white px-3 py-2.5">
        <span className="text-lg" aria-hidden>
          🏅
        </span>
        <span className="whitespace-nowrap font-sans text-[14.5px] font-semibold text-[#031F82]">
          Your coins and medals still count.
        </span>
      </div>
      {askButton ? (
        asked ? (
          <div className="mt-[18px] flex h-12 translate-y-0.5 items-center justify-center gap-2 rounded-2xl border-2 border-[#0CC1E0]/55 bg-[#E8F6FC] font-heading text-base font-bold text-[#031F82]">
            <CheckIcon className="size-5" />
            Asked!
          </div>
        ) : (
          <button
            type="button"
            onClick={ask}
            className="mt-[18px] inline-flex h-12 w-full items-center justify-center rounded-2xl border-b-4 border-[#0288A3] bg-[#0CC1E0] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82]"
          >
            Ask my account manager
          </button>
        )
      ) : null}
    </section>
  );
}
