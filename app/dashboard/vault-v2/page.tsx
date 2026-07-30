import type { Metadata } from "next";
import { VaultV2Dashboard } from "@/components/dashboard/vault-v2/vault-v2-dashboard";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";

export const metadata: Metadata = {
  title: vaultV2Copy.title,
  description: vaultV2Copy.description,
};

export default function VaultV2Page() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-md flex-1 flex-col overflow-x-clip bg-white">
      <VaultV2Dashboard />
    </div>
  );
}
