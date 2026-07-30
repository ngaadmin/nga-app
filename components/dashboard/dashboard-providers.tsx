"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";
import { VaultV2ProfileProvider } from "@/lib/dashboard/vault-v2/vault-v2-profile-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>
        <VaultV2ProfileProvider>{children}</VaultV2ProfileProvider>
      </DashboardWalletProvider>
    </CurrencyProvider>
  );
}
