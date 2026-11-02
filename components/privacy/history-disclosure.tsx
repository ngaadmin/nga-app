"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/lib/privacy/data-controls";
import { formatHistoryDate } from "@/lib/privacy/data-controls";

type HistoryDisclosureProps = {
  title: string;
  summary: string;
  entries: HistoryEntry[];
  defaultOpen?: boolean;
};

export function HistoryDisclosure({
  title,
  summary,
  entries,
  defaultOpen = false,
}: HistoryDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-sm font-extrabold text-[#031F82]">{title}</span>
          <span className="mt-0.5 block font-sans text-sm leading-snug text-[#1E3A5F]">{summary}</span>
        </span>
        <svg
          viewBox="0 0 12 12"
          data-history-chevron
          className={`size-3.5 shrink-0 text-[#0288A3] transition-transform ${
            open ? "-rotate-90" : "rotate-90"
          }`}
          fill="none"
          aria-hidden
        >
          <path
            d="M4.5 3 7.5 6 4.5 9"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul className="border-t border-[#BDE9FB]/60 px-3 py-2">
          {entries.map((entry, index) => (
            <li key={`${entry.at}-${entry.title}-${index}`} className="flex gap-3 py-2">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#0CC1E0]" aria-hidden />
              <span>
                <span className="block font-sans text-[13px] text-[#4A5675]">
                  {formatHistoryDate(entry.at)}
                </span>
                <span className="block font-heading text-sm font-extrabold text-[#031F82]">
                  {entry.title}
                </span>
                {entry.detail ? (
                  <span className="block font-sans text-[13px] text-[#1E3A5F]">{entry.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
