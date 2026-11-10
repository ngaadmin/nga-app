"use client";

import type { LaunchpadTextField } from "@/lib/launchpad/content/types";
import { sanitizeFieldInput } from "@/lib/launchpad/content/fields";

const BOX =
  "rounded-xl bg-white font-sans text-[18px] font-medium leading-[26px] text-nga-ink shadow-[inset_0_0_0_1.5px_#C5D4EA] outline-none placeholder:font-normal placeholder:text-[#9CA3AF] focus:shadow-[inset_0_0_0_2px_#3FB7DA] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:shadow-[inset_0_0_0_1.5px_#E5E7EB]";

/** A dropdown whose options are phrases (row 7 benefits, row 8 skills) takes the full line so the pick is readable. */
export function wideChoice(field: LaunchpadTextField): boolean {
  return (field.options ?? []).some((o) => o.label.length > 12);
}

/** Rough inline width for a goal blank, in ch. */
function inlineWidth(field: LaunchpadTextField): string {
  // Wide enough for the largest value and the bracketed hint ("[1–99]"), so the placeholder is not clipped.
  if (field.input === "integer") return `${Math.max(String(field.max ?? 99).length, field.hint ? field.hint.length + 2 : 0, 3) + 2}ch`;
  return "100%";
}

/**
 * One short-text blank: text, whole number, dropdown, or the currency chip.
 * `block` renders text as a full-width box (paragraph mode and the wrap-up
 * editor); otherwise blanks sit inline in the sentence. Values are cleaned
 * as typed (sanitizeFieldInput); "" means empty.
 */
export function FieldControl({
  field,
  value,
  onChange,
  disabled,
  block,
  idPrefix,
  appearance = "box",
}: {
  field: LaunchpadTextField;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  block?: boolean;
  idPrefix: string;
  /** `inline` is the small Know sentence box. `underline` is a Deliver pick. */
  appearance?: "box" | "inline" | "underline";
}) {
  const id = `${idPrefix}-${field.name}`;
  const shown = value === undefined ? "" : String(value);
  const placeholder = field.hint ? `[${field.hint}]` : undefined;
  switch (field.input) {
    case "currency":
      // Fixed from the Parent Hub preference; never typed or picked here.
      return (
        <span
          id={id}
          aria-label={`${field.label}: ${shown || "not set"}`}
          className="mx-0.5 inline-flex h-9 items-center rounded-lg bg-[#EEF7FB] px-2.5 align-middle font-sans text-[18px] font-bold leading-[26px] tracking-wide text-nga-ink"
          data-currency-chip=""
        >
          {shown || "—"}
        </span>
      );
    case "choice": {
      const inline = appearance === "inline";
      const underline = appearance === "underline";
      const choiceClass = underline
        ? "mx-0.5 appearance-none border-b-[1.5px] border-[#0CC1E0] bg-transparent pr-4 font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] outline-none"
        : inline
          ? "mx-0.5 inline-flex h-9 appearance-none rounded-lg border-[1.5px] border-[#D5DAE3] bg-[#EEF1F5] px-2 align-middle font-sans text-[18px] leading-[26px] text-[#19347D] outline-none"
          : `${BOX} ${block || wideChoice(field) ? "my-1 h-[42px] w-full px-2" : "mx-0.5 h-[38px] max-w-full px-2 align-middle"} appearance-auto`;
      return (
        <span className={underline ? "relative inline-flex items-center" : "inline"}>
        <select
          id={id}
          aria-label={field.label}
          value={shown || field.defaultValue || ""}
          disabled={disabled}
          onChange={(e) => onChange(sanitizeFieldInput(field, e.target.value))}
          className={choiceClass}
          data-field={field.name}
        >
          {/* A defaulted dropdown (weeks/months) never shows an empty "Choose" row. */}
          {!field.defaultValue && <option value="">{field.hint ? `[${field.hint}]` : "Choose"}</option>}
          {(field.options ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {underline ? (
          <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="pointer-events-none -ml-3">
            <path d="M1 1l4 4 4-4" fill="none" stroke="#19347D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        </span>
      );
    }
    case "integer":
      return (
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={field.label}
          placeholder={appearance === "inline" ? undefined : placeholder}
          value={shown}
          disabled={disabled}
          onChange={(e) => onChange(sanitizeFieldInput(field, e.target.value))}
          style={block || appearance === "inline" ? undefined : { width: inlineWidth(field) }}
          className={
            appearance === "inline"
              ? "mx-0.5 inline-block h-9 w-10 rounded-lg border-[1.5px] border-[#D5DAE3] text-center align-middle font-sans text-[18px] leading-[26px] text-[#19347D] outline-none"
              : `${BOX} ${block ? "h-[48px] w-full px-3" : "mx-0.5 h-[38px] px-2 text-center align-middle"}`
          }
        />
      );
    case "text":
      if (block || field.multiline) {
        return (
          <textarea
            id={id}
            aria-label={field.label}
            placeholder={placeholder}
            value={shown}
            rows={field.maxLength && field.maxLength > 120 ? 3 : 2}
            data-field={field.name}
            maxLength={field.maxLength}
            disabled={disabled}
            onChange={(e) => onChange(sanitizeFieldInput(field, e.target.value))}
            className={`${BOX} w-full resize-none px-3 py-2.5 leading-[1.4]`}
          />
        );
      }
      return (
        <input
          id={id}
          type="text"
          autoComplete="off"
          aria-label={field.label}
          placeholder={placeholder}
          value={shown}
          maxLength={field.maxLength}
          disabled={disabled}
          onChange={(e) => onChange(sanitizeFieldInput(field, e.target.value))}
          className={`${BOX} my-1 h-[40px] w-full px-3`}
        />
      );
  }
}
