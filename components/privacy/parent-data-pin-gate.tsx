"use client";

import Link from "next/link";
import { ParentPinGate } from "@/components/parent/parent-pin-gate";

/**
 * Full-page Parent PIN gate for My account and Your data & privacy. It is
 * the same shared "Parent PIN" gate as the Parent Hub: one PIN, one look.
 * A correct PIN also sets the short data grant, so the page can load.
 */
export function ParentDataPinGate({
  kind,
  onUnlocked,
}: {
  kind: "account" | "privacy";
  onUnlocked: () => void | Promise<void>;
}) {
  const body =
    kind === "account"
      ? "Enter your Parent PIN to see your account."
      : "Enter your Parent PIN to see your data and privacy controls.";

  return (
    <div data-parent-data-gate={kind} className="mx-auto w-full max-w-md px-1 pt-2">
      <Link
        href="/dashboard/settings"
        data-parent-data-gate-back
        className="font-heading text-sm font-bold text-[#0CC1E0]"
      >
        ← Back to Settings
      </Link>
      <ParentPinGate
        parentName=""
        enterBody={body}
        headingLevel="h1"
        className="mx-0"
        onUnlocked={() => onUnlocked()}
      />
    </div>
  );
}
