"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";
import { useSupabaseAccountSync } from "@/lib/dashboard/use-supabase-account-sync";
import { VaultProfileProvider } from "@/lib/dashboard/vault/vault-profile-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

function SupabaseAccountSync() {
  useSupabaseAccountSync();
  return null;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>
        <VaultProfileProvider>
          <SupabaseAccountSync />
          {children}
        </VaultProfileProvider>
      </DashboardWalletProvider>
    </CurrencyProvider>
  );
}
