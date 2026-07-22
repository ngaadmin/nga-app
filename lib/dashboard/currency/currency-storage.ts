import {
  DEFAULT_CURRENCY_CODE,
  isSupportedCurrencyCode,
  type SupportedCurrencyCode,
} from "@/lib/dashboard/currency/currencies";
import {
  readPersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const CURRENCY_PREFERENCE_STORAGE_KEY = "nga_currency_preference";

export function readCurrencyPreference(): SupportedCurrencyCode {
  const raw = readPersisted(CURRENCY_PREFERENCE_STORAGE_KEY);
  if (!raw || !isSupportedCurrencyCode(raw)) {
    return DEFAULT_CURRENCY_CODE;
  }
  return raw;
}

export function saveCurrencyPreference(code: SupportedCurrencyCode): void {
  writePersisted(CURRENCY_PREFERENCE_STORAGE_KEY, code);
}
