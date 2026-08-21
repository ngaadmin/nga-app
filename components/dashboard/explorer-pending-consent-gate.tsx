"use client";

import { useState } from "react";
import { ExplorerPendingConsentView } from "@/components/onboarding/explorer-pending-consent-view";
import { ModalShell } from "@/components/ui/modal-shell";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { shouldBlockExplorerPendingPlay } from "@/lib/onboarding/explorer-pending-consent";
import { readUserSession } from "@/lib/onboarding/guest-session";

/** Blocks Academy and other dashboard play until Explorer VPC is approved. */
export function ExplorerPendingConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const live = useUserSession();
  const [bootSession] = useState(() =>
    typeof window === "undefined" ? null : readUserSession(),
  );
  const session = live ?? bootSession;
  const blocking = shouldBlockExplorerPendingPlay(session);

  return (
    <>
      {blocking ? (
        <div className="min-h-dvh w-full bg-white" aria-hidden />
      ) : (
        children
      )}
      <ModalShell
        isOpen={blocking}
        dismissOnBackdrop={false}
        role="alertdialog"
        align="center"
        labelledBy="explorer-pending-heading"
        describedBy="explorer-pending-body"
        panelClassName="rounded-nga-xl border-2 border-[#BDE9FB] bg-white p-6 shadow-nga-pop"
      >
        <ExplorerPendingConsentView approved={false} session={session} />
      </ModalShell>
    </>
  );
}
