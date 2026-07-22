import { Suspense } from "react";
import { VaultDashboard } from "@/components/dashboard/vault/vault-dashboard";

export default function VaultPage() {
  return (
    <Suspense fallback={null}>
      <VaultDashboard />
    </Suspense>
  );
}
