"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_CURRENCY_CODE,
  resolveCurrency,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  type SupportedCurrencyCode,
} from "@/lib/dashboard/currency/currencies";
import {
  readCurrencyPreference,
  saveCurrencyPreference,
} from "@/lib/dashboard/currency/currency-storage";
import {
  currencySymbol,
  formatMoney,
  formatWholeMoney,
} from "@/lib/dashboard/currency/format-money";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  currencyCode: SupportedCurrencyCode;
  supportedCurrencies: readonly SupportedCurrency[];
  setCurrencyCode: (code: SupportedCurrencyCode) => void;
  formatMoney: (amount: number) => string;
  /** Vault balances — whole dollars only (no cents). */
  formatWholeMoney: (amount: number) => string;
  currencySymbol: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

type CurrencyProviderProps = {
  children: ReactNode;
};

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currencyCode, setCurrencyCodeState] = useState<SupportedCurrencyCode>(
    DEFAULT_CURRENCY_CODE,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrencyCodeState(readCurrencyPreference());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCurrencyPreference(currencyCode);
  }, [currencyCode, hydrated]);

  const setCurrencyCode = useCallback((code: SupportedCurrencyCode) => {
    setCurrencyCodeState(code);
  }, []);

  const currency = useMemo(() => resolveCurrency(currencyCode), [currencyCode]);

  const formatMoneyForCurrency = useCallback(
    (amount: number) => formatMoney(amount, currencyCode),
    [currencyCode],
  );

  const formatWholeMoneyForCurrency = useCallback(
    (amount: number) => formatWholeMoney(amount, currencyCode),
    [currencyCode],
  );

  const symbol = useMemo(() => currencySymbol(currencyCode), [currencyCode]);

  const value = useMemo(
    () => ({
      currency,
      currencyCode,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      setCurrencyCode,
      formatMoney: formatMoneyForCurrency,
      formatWholeMoney: formatWholeMoneyForCurrency,
      currencySymbol: symbol,
    }),
    [
      currency,
      currencyCode,
      formatMoneyForCurrency,
      formatWholeMoneyForCurrency,
      setCurrencyCode,
      symbol,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
