"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import type {
  LedgerCategory,
  LedgerEntry,
  LedgerFlow,
} from "@/lib/dashboard/vault-ledger";

type AppendLedgerOptions = {
  category: LedgerCategory;
  highlight?: boolean;
  amount?: number;
  flow?: LedgerFlow;
};

type VaultLedgerContextValue = {
  ledger: LedgerEntry[];
  appendLedger: (message: string, options: AppendLedgerOptions) => void;
};

const VaultLedgerContext = createContext<VaultLedgerContextValue | null>(null);

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type VaultLedgerProviderProps = {
  children: ReactNode;
};

export function VaultLedgerProvider({ children }: VaultLedgerProviderProps) {
  const welcomeMessage = copyMatrix.dashboard.vault.ledger.welcomeMessage;
  const ledgerCounter = useRef(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: "ledger-welcome",
      message: welcomeMessage,
      category: "info",
      timestamp: Date.now(),
    },
  ]);

  const appendLedger = useCallback(
    (message: string, options: AppendLedgerOptions) => {
      ledgerCounter.current += 1;
      setLedger((current) => [
        {
          id: `ledger-${ledgerCounter.current}-${createLedgerId()}`,
          message,
          category: options.category,
          highlight: options.highlight,
          timestamp: Date.now(),
          amount: options.amount,
          flow: options.flow,
        },
        ...current,
      ]);
    },
    [],
  );

  return (
    <VaultLedgerContext.Provider value={{ ledger, appendLedger }}>
      {children}
    </VaultLedgerContext.Provider>
  );
}

export function useVaultLedger(): VaultLedgerContextValue {
  const context = useContext(VaultLedgerContext);
  if (!context) {
    throw new Error("useVaultLedger must be used within VaultLedgerProvider");
  }
  return context;
}
