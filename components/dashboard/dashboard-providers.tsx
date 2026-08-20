"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";
import { useAccountProgressSync } from "@/lib/dashboard/account-progress-sync";
import { useSupabaseAccountSync } from "@/lib/dashboard/use-supabase-account-sync";
import { VaultProfileProvider } from "@/lib/dashboard/vault/vault-profile-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

function AccountSync() {
  useSupabaseAccountSync();
  useAccountProgressSync();
  return null;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>
        <VaultProfileProvider>
          <AccountSync />
          {children}
        </VaultProfileProvider>
      </DashboardWalletProvider>
    </CurrencyProvider>
  );
}
