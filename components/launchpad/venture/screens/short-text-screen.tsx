"use client";

import { useEffect } from "react";
import type { LaunchpadShortTextScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import { fieldsAnswer, fieldsOf } from "@/lib/launchpad/content/answers";
import { fieldByName } from "@/lib/launchpad/content/fields";
import { selectionLabels, summaryCatalog } from "@/lib/launchpad/content/summary";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { ScreenGuidance, ScreenIntro, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

/**
 * Short text box. Goal mode: one sentence with inline blanks. Paragraph
 * mode: the paragraph with text blanks as full-width boxes. Carried values
 * (e.g. the chosen cause) show as a fixed chip; currency is fixed from the
 * Parent Hub preference. Optional "not applicable" greys the inputs out.
 */
export function ShortTextScreen({ screen }: { screen: LaunchpadShortTextScreen }) {
  const { answers, save, floors } = useCaptureAnswer(screen.answerKey);
  const answer = fieldsOf(answers, screen.answerKey);
  const values = answer?.values ?? {};
  const na = !!answer?.notApplicable;
  const currencyField = screen.fields.find((f) => f.input === "currency");
  const currencyMissing = !!currencyField && !values[currencyField.name];

  // Currency comes from the Parent Hub preference (browser storage), set once.
  useEffect(() => {
    if (!currencyField || !currencyMissing) return;
    save(fieldsAnswer({ ...values, [currencyField.name]: readCurrencyPreference() }, na));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyField?.name, currencyMissing]);

  const setValue = (name: string, v: string | number) => save(fieldsAnswer({ ...values, [name]: v }, na));
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
      {screen.heading && <ScreenPrompt>{screen.heading}</ScreenPrompt>}
      {screen.prompt && (screen.heading ? <ScreenGuidance>{screen.prompt}</ScreenGuidance> : <ScreenPrompt>{screen.prompt}</ScreenPrompt>)}
      {screen.guidance && !screen.context && <ScreenGuidance>{screen.guidance}</ScreenGuidance>}
      <div className={`mx-5 mt-4 rounded-2xl border-2 border-[#C5D4EA] bg-white px-4 py-3.5 text-[17px] leading-[2.1] ${na ? "text-[#9CA3AF]" : "text-nga-ink"}`} data-sentence="">
        {screen.parts.map((part, i) => {
          if (part.kind === "text") return <span key={i}>{part.text}</span>;
          if (part.kind === "carried") {
            const label = selectionLabels(catalog, answers, part.answerKey)[0];
            return (
              <span key={i} className="mx-0.5 rounded-lg bg-[#EEF7FB] px-2 py-1 font-semibold text-nga-ink" data-carried={part.answerKey} title={part.label}>
                {label ? label.charAt(0).toLowerCase() + label.slice(1) : `[${part.label}]`}
              </span>
            );
          }
          const field = fieldByName(screen, part.field);
          if (!field) return null;
          return control(field);
        })}
      </div>
      {(screen.extraFields ?? []).length > 0 && (
        <div className="mx-5 mt-3 grid grid-cols-2 gap-2.5" data-extra-fields="">
          {(screen.extraFields ?? []).map((name) => {
            const field = fieldByName(screen, name);
            if (!field) return null;
            return (
              <label key={name} className="flex flex-col gap-1 text-[13px] font-semibold text-nga-slate">
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
          className={`mx-5 mt-3 self-start rounded-full px-3.5 py-2 text-[13px] font-semibold ${na ? "bg-nga-ink text-white" : "bg-[#F3F4F6] text-nga-slate"}`}
        >
          {screen.notApplicableLabel}
        </button>
      )}
      <div className="h-4" />
    </div>
  );
}
