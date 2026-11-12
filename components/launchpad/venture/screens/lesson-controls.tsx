"use client";

import { useState } from "react";
import {
  AVAILABILITY_COLUMNS,
  AVAILABILITY_ROWS,
  availabilitySlotId,
} from "@/lib/launchpad/content/planning/catalog";
import { LESSON_HINT, LESSON_TICK_LABEL } from "@/components/launchpad/venture/screens/screen-ui";

function OrangeCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l5 5L19 7" />
    </svg>
  );
}

/** Offer chip, or a full-width tick row. The "I've read this" box is a separate control. */
export function Chip({
  selected,
  label,
  onClick,
  variant = "pill",
  dashed = false,
  muted = false,
  tag,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  variant?: "pill" | "lined";
  /** Dashed outline, for an "Add your own" chip. */
  dashed?: boolean;
  /** A win or an already-offered service: shown, not tappable. */
  muted?: boolean;
  /** Right-side timing tag on an Improve row. */
  tag?: string;
}) {
  if (variant === "lined") {
    return (
      <button
        type="button"
        aria-pressed={selected}
        disabled={muted}
        onClick={onClick}
        className="flex min-h-[42px] w-full items-start gap-3 border-b border-dashed border-[#F4D5A7] py-1.5 text-left disabled:cursor-default"
      >
        <span className={`mt-1 flex size-5 flex-none items-center justify-center rounded-[4px] border-2 ${selected && !muted ? "border-[#FFA503] bg-[#FFA503]" : "border-[#C5CDD8] bg-white"}`}>
          {selected && !muted ? <OrangeCheck size={16} /> : null}
        </span>
        <span className={muted ? "min-w-0 flex-1 font-sans text-[18px] font-normal leading-[26px] text-[#8A94A8] opacity-70" : `min-w-0 flex-1 ${LESSON_TICK_LABEL}`}>{label}</span>
        {tag ? <span className="flex-none font-sans text-[18px] leading-[26px] text-[#8A94A8]">{tag}</span> : null}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 font-sans text-[18px] leading-[26px] text-[#19347D] ${dashed ? "border-dashed" : ""} ${selected ? "border-[#0CC1E0] bg-[#F2FBFD]" : "border-[#D5DAE3] bg-white"}`}
    >
      {selected ? (
        <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full bg-[#0CC1E0] text-white">
          <OrangeCheck size={16} />
        </span>
      ) : null}
      {label}
    </button>
  );
}

/** Centered "I've read this": 28px, radius 7, orange border even when empty. */
export function ReadTick({ pressed, label, onClick }: { pressed: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="mx-auto mt-5 flex items-center gap-3">
      <span className={`flex size-7 flex-none items-center justify-center rounded-[7px] border-2 border-[#FFA503] ${pressed ? "bg-[#FFA503]" : "bg-white"}`}>
        {pressed ? <OrangeCheck size={14} /> : null}
      </span>
      <span className="font-sans text-[16px] font-medium leading-[22px] text-[#19347D]">{label}</span>
    </button>
  );
}

/**
 * Weekdays | Weekend days by Morning, Midday, Afternoon, Evening.
 * Extracted from When can you work. The same table is the customer times screen.
 */
export function AvailabilityTable({
  selected,
  onToggle,
  addLabel,
  extra,
  onExtra,
  helper,
  extraLabel = "Another time",
}: {
  selected: readonly string[];
  onToggle: (id: string) => void;
  addLabel: string;
  extra: string;
  onExtra: (value: string) => void;
  helper?: string;
  extraLabel?: string;
}) {
  const [open, setOpen] = useState(extra.trim().length > 0);
  return (
    <div>
      <table className="mt-4 w-full table-fixed border-collapse text-left font-sans text-[16px] text-[#19347D]" data-availability-table="">
        <thead>
          <tr>
            <th scope="col" className="w-[32%] py-2 pr-2 text-left font-sans text-[18px] font-semibold leading-[26px]">
              Time
            </th>
            {AVAILABILITY_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className="w-[34%] border-l border-[#E5E8EE] px-2 py-2 text-center font-sans text-[18px] font-semibold leading-[26px]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AVAILABILITY_ROWS.map((row, rowIndex) => (
            <tr key={row.key}>
              <th scope="row" className={`border-t border-[#F4D5A7] py-3 pr-2 text-left font-sans text-[18px] font-normal leading-[26px] ${rowIndex === AVAILABILITY_ROWS.length - 1 ? "border-b border-b-[#F4D5A7]" : ""}`}>
                {row.label}
              </th>
              {AVAILABILITY_COLUMNS.map((column) => {
                const id = availabilitySlotId(column.key, row.key);
                const on = selected.includes(id);
                return (
                  <td key={id} className={`border-l border-t border-[#E5E8EE] border-t-[#F4D5A7] px-2 py-3 text-center ${rowIndex === AVAILABILITY_ROWS.length - 1 ? "border-b border-b-[#F4D5A7]" : ""}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`${row.label}, ${column.label}`}
                      onClick={() => onToggle(id)}
                      className={`inline-flex size-5 items-center justify-center rounded-[4px] border-2 ${on ? "border-[#FFA503] bg-[#FFA503]" : "border-[#D0D6DF] bg-white"}`}
                    >
                      {on ? <OrangeCheck /> : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="mt-3.5 font-sans text-[16px] font-semibold text-[#0CC1E0]" onClick={() => setOpen((value) => !value)}>
        {addLabel}
      </button>
      {open && (
        <input
          aria-label={extraLabel}
          maxLength={80}
          value={extra}
          onChange={(event) => onExtra(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl px-3 font-sans text-[16px] text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none"
        />
      )}
      {helper ? <p className={`mt-4 ${LESSON_HINT}`}>{helper}</p> : null}
    </div>
  );
}
