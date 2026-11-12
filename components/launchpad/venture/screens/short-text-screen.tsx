"use client";

import { useEffect } from "react";
import type { LaunchpadShortTextScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import { fieldsAnswer, fieldsOf } from "@/lib/launchpad/content/answers";
import { applyFieldChange, fieldByName, withFieldDefaults } from "@/lib/launchpad/content/fields";
import { selectionLabels, summaryCatalog } from "@/lib/launchpad/content/summary";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { FieldControl, wideChoice } from "@/components/launchpad/venture/screens/field-control";
import { ScreenGuidance, ScreenIntro, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

/** The values with the currency filled from the Parent Hub preference when the screen has a currency blank still empty. */
export function withCurrency(
  values: Readonly<Record<string, string | number>>,
  currencyField: LaunchpadTextField | undefined,
  preference: () => string = readCurrencyPreference,
): Readonly<Record<string, string | number>> {
  if (!currencyField || values[currencyField.name]) return values;
  return { ...values, [currencyField.name]: preference() };
}

/**
 * Short text box. Goal mode: one sentence with inline blanks. Paragraph
 * mode: the paragraph with text blanks as full-width boxes. Carried values
 * (e.g. the chosen cause) show as a fixed chip; currency is fixed from the
 * Parent Hub preference. Optional "not applicable" greys the inputs out.
 */
/** Sentence punctuation that must stay with the control before it. */
const LEADING_PUNCT = /^[.,!?;:]+/;

export function ShortTextScreen({ screen }: { screen: LaunchpadShortTextScreen }) {
  const { answers, save, floors } = useCaptureAnswer(screen.answerKey);
  const answer = fieldsOf(answers, screen.answerKey);
  const values = answer?.values ?? {};
  // A saved not-applicable flag counts only where the screen still offers the chip.
  const na = !!answer?.notApplicable && !!screen.notApplicableLabel;
  const currencyField = screen.fields.find((f) => f.input === "currency");
  const currencyMissing = !!currencyField && !values[currencyField.name];

  // Currency comes from the Parent Hub preference (browser storage), set once.
  useEffect(() => {
    if (!currencyField || !currencyMissing) return;
    save(fieldsAnswer({ ...values, [currencyField.name]: readCurrencyPreference() }, na));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyField?.name, currencyMissing]);

  // Every save carries the currency too. The effect above saves it after the
  // first paint; a blank typed before that re-render would otherwise save the
  // stale values without it, leaving the chip at "—" and Next stuck off.
  // Defaults (weeks) save with the first edit; a skill pick may fill its success line.
  const setValue = (name: string, v: string | number) =>
    save(fieldsAnswer(applyFieldChange(screen.fields, withFieldDefaults(screen.fields, withCurrency(values, currencyField)), name, v), na));
  const catalog = summaryCatalog(floors);
  const prefix = screen.id;
  const block = screen.mode === "paragraph";
  const control = (field: LaunchpadTextField, blockField = block && field.input === "text") => (
    <FieldControl
      key={field.name}
      field={field}
      value={values[field.name]}
      onChange={(v) => setValue(field.name, v)}
      disabled={na}
      block={blockField}
      idPrefix={prefix}
    />
  );

  return (
    <div className="flex flex-col" data-screen-type="short-text" data-mode={screen.mode} data-not-applicable={na ? "" : undefined}>
      {screen.context && <ScreenIntro context={screen.context} guidance={screen.guidance} />}
      {screen.heading && (
        <ScreenPrompt>
          {screen.heading}
          {screen.optional && (
            <span
              className="ml-2 inline-block rounded-full border border-nga-ink/40 bg-white px-2 py-0.5 align-[2px] font-heading text-[18px] font-semibold leading-none text-nga-ink/70"
              data-optional-tag=""
            >
              Optional
            </span>
          )}
        </ScreenPrompt>
      )}
      {screen.prompt && (screen.heading ? <ScreenGuidance>{screen.prompt}</ScreenGuidance> : <ScreenPrompt>{screen.prompt}</ScreenPrompt>)}
      {screen.guidance && !screen.context && <ScreenGuidance>{optionalGuidance(screen)}</ScreenGuidance>}
      <div className={`mx-5 mt-4 rounded-2xl border-2 border-[#C5D4EA] bg-white px-4 py-3.5 text-[17px] leading-[2.1] ${na ? "text-[#9CA3AF]" : "text-nga-ink"}`} data-sentence="">
        {screen.parts.map((part, i) => {
          // Punctuation right after a control stays on the control's line (no line starts with "."):
          // it is cut from the text that follows and rendered with the control in one unbreakable span.
          const prev = screen.parts[i - 1];
          const prevField = prev?.kind === "field" ? fieldByName(screen, prev.field) : undefined;
          const glued = !block && (prevField || prev?.kind === "carried") && part.kind === "text" ? LEADING_PUNCT.exec(part.text)?.[0] : undefined;
          if (part.kind === "text") {
            const text = glued ? part.text.slice(glued.length) : part.text;
            return text ? <span key={i}>{text}</span> : null;
          }
          if (part.kind === "carried") {
            const label = selectionLabels(catalog, answers, part.answerKey)[0];
            const next = screen.parts[i + 1];
            const carriedPunct = !block && next?.kind === "text" ? LEADING_PUNCT.exec(next.text)?.[0] : undefined;
            const chip = (
              <span key={i} className="mx-0.5 rounded-lg bg-[#EEF7FB] px-2 py-1 font-semibold text-nga-ink" data-carried={part.answerKey} title={part.label}>
                {label ? label.charAt(0).toLowerCase() + label.slice(1) : `[${part.label}]`}
              </span>
            );
            if (!carriedPunct) return chip;
            return (
              <span key={i} className="whitespace-nowrap" data-glued-punct="">
                {chip}
                {carriedPunct}
              </span>
            );
          }
          const field = fieldByName(screen, part.field);
          if (!field) return null;
          const after = screen.parts[i + 1];
          const punct = !block && after?.kind === "text" ? LEADING_PUNCT.exec(after.text)?.[0] : undefined;
          if (!punct) return control(field);
          if (field.input === "text" || (field.input === "choice" && wideChoice(field))) {
            // A full-width inline box or dropdown: the punctuation sits at its end on the same row.
            return (
              <span key={i} className="flex w-full items-center gap-1" data-glued-punct="">
                {control(field)}
                <span>{punct}</span>
              </span>
            );
          }
          // An inline control (dropdown, number): control and punctuation in one nowrap span.
          return (
            <span key={i} className="inline-block whitespace-nowrap" data-glued-punct="">
              {control(field)}
              {punct}
            </span>
          );
        })}
      </div>
      {(screen.extraFields ?? []).length > 0 && (
        <div className="mx-5 mt-3 grid grid-cols-2 gap-2.5" data-extra-fields="">
          {(screen.extraFields ?? []).map((name) => {
            const field = fieldByName(screen, name);
            if (!field) return null;
            return (
              <label key={name} className="flex flex-col gap-1 text-[16px] font-semibold text-nga-slate">
                {field.label}
                {control(field, true)}
              </label>
            );
          })}
        </div>
      )}
      {screen.notApplicableLabel && (
        <button
          type="button"
          aria-pressed={na}
          onClick={() => save(fieldsAnswer({ ...values }, !na))}
          className={`mx-5 mt-3 self-start rounded-full px-3.5 py-2 text-[16px] font-semibold ${na ? "bg-nga-ink text-white" : "bg-[#F3F4F6] text-nga-slate"}`}
        >
          {screen.notApplicableLabel}
        </button>
      )}
      <div className="h-4" />
    </div>
  );
}

/** With the Optional tag by the heading, a leading "Optional." in the guidance is not repeated. */
function optionalGuidance(screen: LaunchpadShortTextScreen): string {
  const g = screen.guidance ?? "";
  return screen.optional ? g.replace(/^Optional\.\s*/, "") : g;
}
