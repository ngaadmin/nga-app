"use client";

import { usePathname } from "next/navigation";
import { ExplorerPendingConsentView } from "@/components/onboarding/explorer-pending-consent-view";
import { ModalShell } from "@/components/ui/modal-shell";
import { isDevAcademyDesignShellPath } from "@/lib/academy/lessons/lesson-availability";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { shouldBlockExplorerPendingPlay } from "@/lib/onboarding/explorer-pending-consent";

/** Blocks Academy and other dashboard play until Explorer VPC is approved. */
export function ExplorerPendingConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const session = useUserSession();
  const declined =
    session?.accessMode === "registered" && session.accountStatus === "DECLINED";
  const blocking =
    !isDevAcademyDesignShellPath(pathname) &&
    (declined || shouldBlockExplorerPendingPlay(session));

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
        {declined ? (
          <div className="space-y-4 text-center">
            <h1
              id="explorer-pending-heading"
              className="font-heading text-3xl font-extrabold leading-tight text-nga-primary"
            >
              Your account wasn&apos;t approved
            </h1>
            <p
              id="explorer-pending-body"
              className="font-sans text-sm leading-relaxed text-nga-ink"
            >
              Your account manager didn&apos;t approve this profile. You can close this and try again later with them.
            </p>
          </div>
        ) : (
          <ExplorerPendingConsentView approved={false} session={session} />
        )}
      </ModalShell>
    </>
  );
}
