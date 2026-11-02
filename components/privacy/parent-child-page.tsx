"use client";

import { useEffect, useState } from "react";
import { ParentDataPinGate } from "@/components/privacy/parent-data-pin-gate";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadParentChildBundle,
  parentDataGrantActive,
  setChildLeaderboard,
  unlockParentDataView,
} from "@/lib/privacy/account-data-server";
import type { LearnerDataView } from "@/lib/privacy/data-controls";
import { downloadAccountFile } from "@/lib/privacy/download-account-file";
import { LearnerDataScreen } from "@/components/privacy/learner-data-screen";
import { RemovalConfirmSheet, type RemovalItem } from "@/components/privacy/removal-confirm-sheet";
import { isFourDigitPin } from "@/lib/validation/pin";

type ChildChip = { userId: string; username: string; trackLabel: string | null };

export function ParentChildPage() {
  const router = useRouter();
  const search = useSearchParams();
  const requested = search.get("child") ?? "";
  const [pin, setPin] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildChip[]>([]);
  const [view, setView] = useState<LearnerDataView | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [switchBusy, setSwitchBusy] = useState(false);

  async function load(childId: string) {
    const result = await loadParentChildBundle(childId);
    if (!result.ok) {
      setError(result.error);
      setView(null);
      return;
    }
    setError(null);
    setChildren(result.children);
    setView(result.view);
  }

  useEffect(() => {
    let cancelled = false;
    void parentDataGrantActive().then((active) => {
      if (cancelled) return;
      setReady(active);
      setChecking(false);
      if (active) void load(requested);
    });
    return () => {
      cancelled = true;
    };
    // The PIN grant is checked once. Child switches call load directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(enteredPin: string): Promise<string | null> {
    const result = await unlockParentDataView(enteredPin);
    if (!result.ok) return result.error;
    setPin(enteredPin);
    setReady(true);
    await load(requested);
    return null;
  }

  if (checking) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">Loading…</p>;
  }

  if (!ready) {
    return (
      <ParentDataPinGate kind="child" onUnlock={unlock} />
    );
  }

  if (!view) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">{error || "Loading…"}</p>;
  }

  const activePin = pin || confirmPin;

  return (
    <>
      <LearnerDataScreen
        view={view}
        mode="privacy"
        title={
          children.length > 1
            ? "Your children's data and privacy"
            : "Your child's data and privacy"
        }
        subtitle="Leaderboard visibility, their data file and deleting their account. Their progress is in the Parent Hub."
        backHref="/dashboard/settings"
        backLabel="Back to Settings"
        siblings={children}
        activeChildId={view.userId}
        onSelectChild={(childId) => {
          void load(childId);
        }}
        showLeaderboardSwitch
        leaderboardBusy={switchBusy}
        onLeaderboardChange={(enabled) => {
          setSwitchBusy(true);
          void setChildLeaderboard(view.userId, enabled).then((result) => {
            setSwitchBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setView({ ...view, leaderboardEnabled: enabled });
          });
        }}
        downloading={downloading}
        deleteLabel="Delete account"
        onDownload={() => {
          setDownloading(true);
          void downloadAccountFile({ kind: "child", childId: view.userId }).then((message) => {
            setDownloading(false);
            if (message) setError(message);
          });
        }}
        onDelete={() => {
          setConfirmError(null);
          setConfirmOpen(true);
        }}
      />
      {error ? (
        <p role="alert" className="px-2 text-center font-sans text-sm text-[#031F82]">
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
        confirmDisabled={!pin && !isFourDigitPin(confirmPin)}
        pinLabel={pin ? undefined : "Parent PIN"}
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
            body: JSON.stringify({ childId: view.userId, parentPin: activePin }),
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
              const remaining = children.filter((child) => child.userId !== view.userId);
              if (remaining.length === 0) {
                router.push("/dashboard/settings");
                return;
              }
              setConfirmOpen(false);
              setDeleting(false);
              await load(remaining[0]?.userId ?? "");
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

function childRemovalItems(): RemovalItem[] {
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
