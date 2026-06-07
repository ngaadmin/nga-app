"use client";

import { DashboardWalletProvider } from "@/lib/dashboard/dashboard-wallet-context";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return <DashboardWalletProvider>{children}</DashboardWalletProvider>;
}
