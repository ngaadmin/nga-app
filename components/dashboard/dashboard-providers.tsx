"use client";

import { CurrencyProvider } from "@/lib/dashboard/currency-context";
import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";
import { ExplorerPendingConsentGate } from "@/components/dashboard/explorer-pending-consent-gate";
import { useAccountProgressSync } from "@/lib/dashboard/account-progress-sync";
import { useSupabaseAccountSync } from "@/lib/dashboard/use-supabase-account-sync";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { VaultProfileProvider } from "@/lib/dashboard/vault/vault-profile-context";
import { isExplorerPendingConsent } from "@/lib/onboarding/explorer-pending-consent";
import { readUserSession } from "@/lib/onboarding/guest-session";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

function AccountSync() {
  const session = useUserSession() ?? readUserSession();
  useSupabaseAccountSync({
    intervalMs: isExplorerPendingConsent(session) ? 8000 : undefined,
  });
  useAccountProgressSync();
  return null;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <CurrencyProvider>
      <DashboardWalletProvider>
        <VaultProfileProvider>
          <AccountSync />
          <ExplorerPendingConsentGate>{children}</ExplorerPendingConsentGate>
        </VaultProfileProvider>
      </DashboardWalletProvider>
    </CurrencyProvider>
  );
}
