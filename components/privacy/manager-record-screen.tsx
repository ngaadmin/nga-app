"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DownloadIcon, LockIcon, MailIcon, TrashIcon, UserIcon } from "@/lib/dashboard/icons";
import type { HistoryEntry } from "@/lib/privacy/data-controls";
import { NavyButton, NavyOutlineButton, noteClass } from "@/components/privacy/data-buttons";
import { HistoryDisclosure } from "@/components/privacy/history-disclosure";

type ChildLink = {
  userId: string;
  username: string;
  trackLabel: string | null;
};

type ManagerRecordScreenProps = {
  kind: "parent" | "teacher";
  backHref: string;
  email: string;
  username?: string;
  classLabel?: string;
  studentCount?: number;
  linkedChildren?: ChildLink[];
  historyTitle: string;
  historySummary: string;
  history: HistoryEntry[];
  historyOpen?: boolean;
  onDownload: () => void;
  onDelete: () => void;
  downloading?: boolean;
};

export function ManagerRecordScreen({
  kind,
  backHref,
  email,
  username,
  classLabel,
  studentCount = 0,
  linkedChildren = [],
  historyTitle,
  historySummary,
  history,
  historyOpen = false,
  onDownload,
  onDelete,
  downloading = false,
}: ManagerRecordScreenProps) {
  const childNames = linkedChildren.map((child) => child.username);
  const named =
    childNames.length === 0
      ? ""
      : childNames.length === 1
        ? childNames[0]
        : `${childNames.slice(0, -1).join(", ")} and ${childNames[childNames.length - 1]}`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-1 py-2 pb-8">
      <Link href={backHref} className="font-heading text-sm font-bold text-[#0CC1E0]">
        ← {kind === "parent" ? "Parent Hub" : "Back to Settings"}
      </Link>
      <h1 className="mt-2.5 font-heading text-2xl font-extrabold text-[#031F82]">My account</h1>
      <p className="mt-0.5 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {kind === "parent"
          ? "What NextGenAchiever$ keeps about you, the account manager."
          : "What NextGenAchiever$ keeps about you, the teacher."}
      </p>

      <section className="mt-3.5 rounded-2xl bg-white px-4 py-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <p className="font-heading text-xs font-extrabold uppercase tracking-wide text-[#4A5675]">
            Your details
          </p>
          <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-[#EAF0FF] px-2.5 font-heading text-xs font-bold text-[#031F82]">
            <LockIcon className="size-3.5" />
            View only
          </span>
        </div>
        {kind === "teacher" ? (
          <DetailRow icon={<UserIcon className="size-5" />} label="Username" value={username || ""} />
        ) : null}
        <DetailRow icon={<MailIcon className="size-5" />} label={kind === "parent" ? "Parent email" : "Email"} value={email} />
        {kind === "teacher" ? (
          <DetailRow
            icon={<span className="text-lg">🏫</span>}
            label="Classes"
            value={`${classLabel || "Class"} · ${studentCount} ${studentCount === 1 ? "student" : "students"}`}
          />
        ) : null}
      </section>

      {kind === "parent" ? (
        <section className="mt-5">
          <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#031F82]">
            Linked children
          </h2>
          <div className="mt-2.5 rounded-2xl bg-white px-3.5 shadow-md">
            {linkedChildren.length === 0 ? (
              <p className="py-3 font-sans text-sm text-[#4A5675]">No linked children yet.</p>
            ) : (
              linkedChildren.map((child, index) => (
                <Link
                  key={child.userId}
                  href={`/dashboard/settings/child-data?child=${child.userId}`}
                  className={`flex items-center gap-3 py-2.5 ${index > 0 ? "border-t border-[#BDE9FB]/60" : ""}`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-[15px] font-extrabold text-white ${
                      index % 2 === 0 ? "bg-[#0CC1E0]" : "bg-[#7C8CF0]"
                    }`}
                  >
                    {child.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-[15px] font-bold text-[#031F82]">
                      {child.username}
                    </span>
                    <span className="block font-sans text-[13px] font-medium text-[#4A5675]">
                      {child.trackLabel}
                    </span>
                  </span>
                  <span className="text-xl text-[#9AA8CC]" aria-hidden>
                    ›
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      ) : null}

      <div className="mt-5 rounded-2xl bg-white p-3 shadow-md">
        <HistoryDisclosure
          title={historyTitle}
          summary={historySummary}
          entries={history}
          defaultOpen={historyOpen}
        />
      </div>

      <div className="mt-6">
        <NavyButton onClick={onDownload} disabled={downloading}>
          <DownloadIcon className="size-5" />
          Download my data
        </NavyButton>
        <p className={`mt-1.5 ${noteClass()}`}>
          {kind === "parent"
            ? "One plain data file: your email, linked children and consent history."
            : "One plain data file about your teacher account."}
        </p>
        <div className="mt-4">
          <NavyOutlineButton onClick={onDelete}>
            <TrashIcon className="size-5" />
            Delete my account
          </NavyOutlineButton>
        </div>
        {kind === "parent" ? (
          <div className="mt-2.5 flex gap-2.5 rounded-xl bg-[#EAF0FF] px-3 py-2.5">
            <LockIcon className="mt-0.5 size-4 shrink-0 text-[#031F82]" />
            <p className="font-sans text-[13px] font-medium leading-snug text-[#14213D]">
              {named
                ? `This also deletes your children's accounts (${named}) and everything in them. You'll be asked to confirm first.`
                : "This also deletes your children's accounts and everything in them. You'll be asked to confirm first."}
            </p>
          </div>
        ) : (
          <p className={`mt-1.5 ${noteClass()}`}>This also removes your class and its student logins.</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-[#BDE9FB]/60 py-3 first:border-t-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/35 text-[#0CC1E0]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[13px] font-medium text-[#4A5675]">{label}</span>
        <span className="block break-all font-sans text-[15px] font-semibold text-[#031F82]">{value}</span>
      </span>
    </div>
  );
}
