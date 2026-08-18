export type SupportedCurrencyCode =
  | "AUD"
  | "USD"
  | "GBP"
  | "CAD"
  | "NZD"
  | "EUR"
  | "SGD"
  | "HKD"
  | "INR"
  | "ZAR";

export type SupportedCurrency = {
  code: SupportedCurrencyCode;
  label: string;
  locale: string;
  flag: string;
};

/** Top currencies across English-speaking target markets. */
export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  { code: "AUD", label: "Australian Dollar", locale: "en-AU", flag: "🇦🇺" },
  { code: "CAD", label: "Canadian Dollar", locale: "en-CA", flag: "🇨🇦" },
  { code: "EUR", label: "Euro", locale: "en-IE", flag: "🇮🇪" },
  { code: "GBP", label: "British Pound", locale: "en-GB", flag: "🇬🇧" },
  { code: "HKD", label: "Hong Kong Dollar", locale: "en-HK", flag: "🇭🇰" },
  { code: "INR", label: "Indian Rupee", locale: "en-IN", flag: "🇮🇳" },
  { code: "NZD", label: "New Zealand Dollar", locale: "en-NZ", flag: "🇳🇿" },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG", flag: "🇸🇬" },
  { code: "USD", label: "US Dollar", locale: "en-US", flag: "🇺🇸" },
  { code: "ZAR", label: "South African Rand", locale: "en-ZA", flag: "🇿🇦" },
] as const;

export const DEFAULT_CURRENCY_CODE: SupportedCurrencyCode = "USD";

export function isSupportedCurrencyCode(
  value: string,
): value is SupportedCurrencyCode {
  return SUPPORTED_CURRENCIES.some((entry) => entry.code === value);
}

export function resolveCurrency(
  code: SupportedCurrencyCode,
): SupportedCurrency {
  const match = SUPPORTED_CURRENCIES.find((entry) => entry.code === code);
  return match ?? SUPPORTED_CURRENCIES[0]!;
}
