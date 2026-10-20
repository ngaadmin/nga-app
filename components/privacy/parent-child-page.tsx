"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  const [gatePin, setGatePin] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
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

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setGateBusy(true);
    const result = await unlockParentDataView(gatePin);
    setGateBusy(false);
    if (!result.ok) {
      setGateError(result.error);
      return;
    }
    setPin(gatePin);
    setReady(true);
    await load(requested);
  }

  if (checking) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">Loading…</p>;
  }

  if (!ready) {
    return (
      <form onSubmit={unlock} className="mx-auto flex w-full max-w-md flex-col gap-3 px-1 py-6">
        <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">Enter your parent PIN</h1>
        <p className="font-sans text-sm text-[#1E3A5F]">
          This page shows your child&apos;s data. It is view only until you confirm a delete.
        </p>
        <input
          value={gatePin}
          onChange={(event) => setGatePin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          aria-label="Parent PIN"
          className="h-12 rounded-2xl border-2 border-[#BDE9FB] px-3 font-heading text-lg tracking-[0.3em] text-[#031F82] outline-none"
        />
        {gateError ? (
          <p role="alert" className="font-sans text-sm text-[#031F82]">
            {gateError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={gateBusy || !isFourDigitPin(gatePin)}
          className="h-12 rounded-2xl border-b-4 border-[#021558] bg-[#031F82] font-heading text-sm font-bold uppercase tracking-wide text-white disabled:opacity-40"
        >
          Continue
        </button>
      </form>
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
        backHref="/dashboard/settings"
        backLabel="Parent Hub"
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
    { emoji: "👤", title: "Profile", detail: "Username, track and settings" },
    { emoji: "🎓", title: "Progress", detail: "Lessons and day streak" },
    { emoji: "⭐", title: "Lifetime XP", detail: "The Lifetime XP total" },
    { emoji: "🪙", title: "Coins", detail: "The coins balance" },
    { emoji: "🏅", title: "Medals", detail: "Every bronze, silver and gold medal" },
    { emoji: "🏦", title: "Vault jars and goals", detail: "All jars, amounts and savings goals" },
    { emoji: "🕐", title: "Activity", detail: "The recent activity history" },
  ];
}
