import type { LaunchpadShortTextScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import type { FieldsAnswer } from "@/lib/launchpad/content/answers";
import { isSupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";

/**
 * Short-text field rules shared by the template (typing), the gate (Next)
 * and the summaries. Text folds line breaks and runs of spaces and is capped
 * at maxLength; integers are whole numbers inside min..max; currency is a
 * supported currency code (from the Parent Hub preference); choice is one of
 * the field's option ids.
 */

/** Cleans what the learner typed into a stored value ("" means empty). */
export function sanitizeFieldInput(field: LaunchpadTextField, raw: string): string | number {
  switch (field.input) {
    case "text": {
      const folded = raw.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").replace(/^ +/, "");
      return Array.from(folded).slice(0, field.maxLength ?? 280).join("");
    }
    case "integer": {
      const digits = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
      if (!digits) return "";
      const max = field.max ?? Number.MAX_SAFE_INTEGER;
      // Keep at most as many digits as the max allows (7 digits for money).
      const capped = digits.slice(0, String(max).length);
      return Number(capped);
    }
    case "currency":
      return isSupportedCurrencyCode(raw) ? raw : "";
    case "choice":
      return field.options?.some((o) => o.id === raw) ? raw : "";
  }
}

/** True when the stored value is valid for the field (empty counts only when optional). */
export function isFieldValueValid(field: LaunchpadTextField, value: string | number | undefined): boolean {
  if (value === undefined || value === "") return !!field.optional;
  switch (field.input) {
    case "text":
      return typeof value === "string" && !!value.trim() && Array.from(value).length <= (field.maxLength ?? 280);
    case "integer":
      return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= (field.min ?? 0) &&
        value <= (field.max ?? Number.MAX_SAFE_INTEGER)
      );
    case "currency":
      return typeof value === "string" && isSupportedCurrencyCode(value);
    case "choice":
      return typeof value === "string" && !!field.options?.some((o) => o.id === value);
  }
}

/**
 * Fields that must hold a valid value before Next. An optional screen needs
 * nothing, but a value it does hold must still be valid. "Not applicable"
 * (when the screen offers it) answers the page.
 */
export function isShortTextAnswered(screen: LaunchpadShortTextScreen, answer: FieldsAnswer | undefined): boolean {
  if (answer?.notApplicable && screen.notApplicableLabel) return true;
  const values = answer?.values ?? {};
  return screen.fields.every((f) => {
    const v = values[f.name];
    const empty = v === undefined || v === "";
    if (empty) return !!(screen.optional || f.optional);
    return isFieldValueValid(f, v);
  });
}

export function fieldByName(screen: LaunchpadShortTextScreen, name: string): LaunchpadTextField | undefined {
  return screen.fields.find((f) => f.name === name);
}

/** A stored value as shown in a sentence or summary (numbers with separators, choices by label). */
export function displayFieldValue(field: LaunchpadTextField, value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  if (field.input === "integer" && typeof value === "number") return value.toLocaleString("en-US");
  if (field.input === "choice") return field.options?.find((o) => o.id === value)?.label ?? "";
  return String(value).trim();
}
