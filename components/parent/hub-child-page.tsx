"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cashRateSettingsHref } from "@/lib/parent/cash-rate-return";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { readStoredProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import { setChildLeaderboard } from "@/lib/privacy/account-data-server";
import type { LearnerDataView } from "@/lib/privacy/data-controls";
import { downloadAccountFile } from "@/lib/privacy/download-account-file";
import { isFourDigitPin } from "@/lib/validation/pin";
import { LearnerDataScreen } from "@/components/privacy/learner-data-screen";
import { RemovalConfirmSheet, type RemovalItem } from "@/components/privacy/removal-confirm-sheet";

/** Everything deleting a child's account removes. Shown in the confirm sheet. */
export function childRemovalItems(): RemovalItem[] {
  return [
    { icon: "profile", title: "Profile", detail: "Username, track and settings" },
    { icon: "lessons", title: "Progress", detail: "Lessons and day streak" },
    { icon: "lifetime-coins", title: "Lifetime coins", detail: "The Lifetime coins total" },
    { icon: "coins", title: "Coins", detail: "The coins balance" },
    { icon: "medals", title: "Medals", detail: "Every bronze, silver and gold medal" },
    { icon: "vault", title: "Vault jars and goals", detail: "All jars, amounts and savings goals" },
    { icon: "activity", title: "Activity", detail: "The recent activity history" },
  ];
}

/**
 * A child's page in the Parent Hub: lessons, streak and the cashable coins
 * balance, then "Data & privacy"
 * (leaderboard switch, data file, delete). Opening the Hub with the Parent
 * PIN also opened the data grant, so no second PIN is asked here. Deleting
 * still goes through the confirm sheet and asks for the Parent PIN again.
 */
export function HubChildPage({
  initialView,
  cohort,
  onBack,
  onDeleted,
}: {
  initialView: LearnerDataView;
  cohort: MasteryCohort | null;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [error, setError] = useState<string | null>(null);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <LearnerDataScreen
        view={view}
        mode="hub"
        avatarId={readStoredProfileAvatarId(view.userId, cohort ?? "explorer")}
        title={`${view.username}'s progress`}
        subtitle="What they've learned and done in the app."
        onBack={onBack}
        backLabel="Back to Parent Hub"
        onSetCashRate={() => router.push(cashRateSettingsHref(view.userId))}
        showLeaderboardSwitch
        leaderboardBusy={switchBusy}
        onLeaderboardChange={(enabled) => {
          setSwitchBusy(true);
          setError(null);
          void setChildLeaderboard(view.userId, enabled).then((result) => {
            setSwitchBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setView((current) => ({ ...current, leaderboardEnabled: enabled }));
          });
        }}
        downloading={downloading}
        deleteLabel="Delete account"
        onDownload={() => {
          setDownloading(true);
          setError(null);
          void downloadAccountFile({ kind: "child", childId: view.userId }).then((message) => {
            setDownloading(false);
            if (message) setError(message);
          });
        }}
        onDelete={() => {
          setConfirmError(null);
          setConfirmPin("");
          setConfirmOpen(true);
        }}
      />
      {error ? (
        <p role="alert" className="px-2 pb-4 text-center font-sans text-sm text-[#031F82]">
          {error}
        </p>
      ) : null}
      <RemovalConfirmSheet
        open={confirmOpen}
        title={`Delete ${view.username}'s account?`}
        body="This removes everything below for good. It can't be undone."
        items={childRemovalItems()}
        footnote="Want a copy first? Tap Cancel, then Download data."
        confirmLabel={`Delete ${view.username}'s account`}
        confirmDisabled={!isFourDigitPin(confirmPin)}
        pinLabel="Parent PIN"
        pinValue={confirmPin}
        onPinChange={setConfirmPin}
        error={confirmError}
        busy={deleting}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={() => {
          setDeleting(true);
          void fetch("/api/account/delete-child", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId: view.userId, parentPin: confirmPin }),
          })
            .then(async (response) => {
              const payload = (await response.json().catch(() => null)) as {
                success?: boolean;
                error?: string;
              } | null;
              if (!response.ok || !payload?.success) {
                setConfirmError(payload?.error || "We could not delete this learner. Try again.");
                setDeleting(false);
                return;
              }
              setConfirmOpen(false);
              setDeleting(false);
              onDeleted();
            })
            .catch(() => {
              setConfirmError("We could not delete this learner. Try again.");
              setDeleting(false);
            });
        }}
      />
    </>
  );
}
