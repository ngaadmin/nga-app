"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ExplorerPendingConsentView } from "@/components/onboarding/explorer-pending-consent-view";
import { DeclinedNoticeDialog } from "@/components/onboarding/parent-decline-dialogs";
import { ModalShell } from "@/components/ui/modal-shell";
import { isDevAcademyDesignShellPath } from "@/lib/academy/lessons/lesson-availability";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { shouldBlockExplorerPendingPlay } from "@/lib/onboarding/explorer-pending-consent";
import { ONBOARDING_START_PATH } from "@/lib/onboarding/guest-session";
import { signOutApp } from "@/lib/onboarding/sign-out";

/** Where a declined learner goes after closing the notice: a fresh sign-up start. */
export const DECLINED_LEARNER_CLOSE_PATH = `${ONBOARDING_START_PATH}?fresh=1`;

/** Blocks Academy and other dashboard play until Explorer VPC is approved. */
export function ExplorerPendingConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useUserSession();
  const [leaving, setLeaving] = useState(false);
  const declined =
    session?.accessMode === "registered" && session.accountStatus === "DECLINED";
  const blocking =
    !isDevAcademyDesignShellPath(pathname) &&
    (declined || shouldBlockExplorerPendingPlay(session));

  async function closeDeclined() {
    if (leaving) return;
    setLeaving(true);
    try {
      // The account is being deleted, so leave it fully on this device too.
      await signOutApp();
    } finally {
      router.replace(DECLINED_LEARNER_CLOSE_PATH);
    }
  }

  return (
    <>
      {blocking ? (
        <div className="min-h-dvh w-full bg-white" aria-hidden />
      ) : (
        children
      )}
      {declined ? (
        <DeclinedNoticeDialog
          isOpen={blocking && !leaving}
          onClose={() => void closeDeclined()}
        />
      ) : (
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
      )}
    </>
  );
}
