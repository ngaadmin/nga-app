import {
  DEFAULT_CURRENCY_CODE,
  resolveCurrency,
  type SupportedCurrencyCode,
} from "@/lib/dashboard/currency/currencies";

export function formatMoney(
  amount: number,
  currencyCode: SupportedCurrencyCode = DEFAULT_CURRENCY_CODE,
): string {
  const currency = resolveCurrency(currencyCode);
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, amount));
}

export function currencySymbol(
  currencyCode: SupportedCurrencyCode = DEFAULT_CURRENCY_CODE,
): string {
  const currency = resolveCurrency(currencyCode);
  const parts = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? "$";
}
