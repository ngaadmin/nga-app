"use client";

import Link from "next/link";
import { ShieldIcon } from "@/lib/dashboard/icons";

type MyInfoScreenProps = {
  username: string;
  trackLabel: string | null;
  managedBy: "teacher" | "account_manager";
};

export function MyInfoScreen({ username, trackLabel, managedBy }: MyInfoScreenProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  const teacher = managedBy === "teacher";
  const [trackName, ages] = splitTrack(trackLabel);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-1 py-2 pb-8">
      <Link href="/dashboard/settings" className="font-heading text-sm font-bold text-[#0CC1E0]">
        ← Back to Settings
      </Link>
      <h1 className="mt-2.5 font-heading text-2xl font-extrabold text-[#031F82]">My info</h1>
      <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">This is what the app knows about you.</p>

      <section className="mt-4 rounded-2xl bg-white px-4 shadow-md">
        <div className="flex items-center gap-3 border-b border-[#BDE9FB]/60 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0CC1E0] font-heading text-lg font-extrabold text-white">
            {initial}
          </span>
          <span>
            <span className="block font-sans text-[13px] font-medium text-[#4A5675]">Username</span>
            <span className="block font-heading text-lg font-extrabold text-[#031F82]">{username}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E8F6FC] text-[22px]">
            🔭
          </span>
          <span>
            <span className="block font-sans text-[13px] font-medium text-[#4A5675]">Learning track</span>
            <span className="block font-heading text-[17px] font-extrabold text-[#031F82]">
              {trackName}
              {ages ? (
                <span className="font-sans text-sm font-medium text-[#1E3A5F]"> · {ages}</span>
              ) : null}
            </span>
          </span>
        </div>
      </section>

      <section className="mt-4 flex gap-3.5 rounded-2xl bg-[#E8F6FC] p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0CC1E0]">
          <ShieldIcon className="size-6" />
        </span>
        <div>
          <p className="font-heading text-base font-bold leading-snug text-[#031F82]">
            {teacher ? "Managed by your teacher" : "Managed by your account manager"}
          </p>
          <p className="mt-1 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {teacher
              ? "Your teacher looks after your info for your class. If you want something changed, just ask them."
              : "They look after your info. If you want something changed, just ask them."}
          </p>
        </div>
      </section>
    </div>
  );
}

function splitTrack(label: string | null): [string, string | null] {
  if (!label) return ["Learner", null];
  const parts = label.split(" · ");
  return [parts[0] || label, parts[1] || null];
}
