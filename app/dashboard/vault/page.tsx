import type { Metadata } from "next";
import { Suspense } from "react";
import { VaultDashboard } from "@/components/dashboard/vault/vault-dashboard";
import { vaultCopy } from "@/lib/dashboard/vault/copy";

export const metadata: Metadata = {
  title: vaultCopy.title,
  description: vaultCopy.description,
};

export default function VaultPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-md overflow-x-clip bg-white">
      <Suspense fallback={null}>
        <VaultDashboard />
      </Suspense>
    </div>
  );
}
