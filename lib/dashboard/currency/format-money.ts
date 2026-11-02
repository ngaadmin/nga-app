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

/** Vault balances / totals — whole dollars only (no cents). */
export function formatWholeMoney(
  amount: number,
  currencyCode: SupportedCurrencyCode = DEFAULT_CURRENCY_CODE,
): string {
  const currency = resolveCurrency(currencyCode);
  const whole = Math.round(Math.max(0, amount));
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(whole);
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

/**
 * Tight spaces such as the four Vault jar columns. Below 1,000 it shows full
 * cents ($12.50); from 1,000 up it is compact with at most one decimal
 * ($1.2K, $300M), so large amounts never run into the next column.
 */
export function formatCompactMoney(
  amount: number,
  currencyCode: SupportedCurrencyCode = DEFAULT_CURRENCY_CODE,
): string {
  const value = Math.max(0, Number.isFinite(amount) ? amount : 0);
  if (Math.round(value * 100) / 100 < 1000) return formatMoney(value, currencyCode);
  const currency = resolveCurrency(currencyCode);
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}
