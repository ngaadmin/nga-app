"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";
import { VaultProfileProvider } from "@/lib/dashboard/vault/vault-profile-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>
        <VaultProfileProvider>{children}</VaultProfileProvider>
      </DashboardWalletProvider>
    </CurrencyProvider>
  );
}
