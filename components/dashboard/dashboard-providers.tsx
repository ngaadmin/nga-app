"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>{children}</DashboardWalletProvider>
    </CurrencyProvider>
  );
}
