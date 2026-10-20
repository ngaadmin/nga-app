"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadTeacherStudent } from "@/lib/privacy/account-data-server";
import type { LearnerDataView } from "@/lib/privacy/data-controls";
import { downloadAccountFile } from "@/lib/privacy/download-account-file";
import { LearnerDataScreen } from "@/components/privacy/learner-data-screen";
import { RemovalConfirmSheet, type RemovalItem } from "@/components/privacy/removal-confirm-sheet";

export function TeacherStudentPage({ username }: { username: string }) {
  const router = useRouter();
  const [view, setView] = useState<LearnerDataView | null>(null);
  const [className, setClassName] = useState("class");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadTeacherStudent(username).then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setView(result.view);
      setClassName(result.className);
    });
  }, [username]);

  if (!view) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">{error || "Loading…"}</p>;
  }

  return (
    <>
      <LearnerDataScreen
        view={view}
        title="Student data"
        backHref="/dashboard/class"
        backLabel={`Back to ${className}`}
        deleteLabel="Delete student"
        vaultNote="Vault amounts are what this student tracks in the app. The app doesn't hold or move money."
        onDownload={() => {
          void downloadAccountFile({ kind: "student", username: view.username }).then((message) => {
            if (message) setError(message);
          });
        }}
        onDelete={() => setConfirmOpen(true)}
      />
      {error ? <p role="alert" className="px-2 text-center font-sans text-sm text-[#031F82]">{error}</p> : null}
      <RemovalConfirmSheet
        open={confirmOpen}
        title={`Delete ${view.username}?`}
        body="This removes the student and everything below for good. It can't be undone."
        items={studentRemovalItems(view.username)}
        footnote="Want a copy first? Tap Cancel, then Download data."
        confirmLabel={`Delete ${view.username}`}
        busy={busy}
        error={error}
        onClose={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => {
          setBusy(true);
          void fetch("/api/school/class-seats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scope: "one", username: view.username }),
          })
            .then(async (response) => {
              const payload = (await response.json().catch(() => null)) as {
                success?: boolean;
                error?: string;
              } | null;
              if (!response.ok || !payload?.success) {
                setError(payload?.error || "Could not remove that user. Try again.");
                setBusy(false);
                return;
              }
              router.push("/dashboard/class");
            })
            .catch(() => {
              setError("Could not remove that user. Try again.");
              setBusy(false);
            });
        }}
      />
    </>
  );
}

function studentRemovalItems(username: string): RemovalItem[] {
  return [
    { emoji: "🔑", title: "Login", detail: `The username ${username} and its class seat` },
    { emoji: "🎓", title: "Progress", detail: "Lessons and day streak" },
    { emoji: "⭐", title: "Lifetime XP", detail: "The Lifetime XP total" },
    { emoji: "🪙", title: "Coins", detail: "The coins balance" },
    { emoji: "🏅", title: "Medals", detail: "Every bronze, silver and gold medal" },
    { emoji: "🏦", title: "Vault jars and goals", detail: "All jars, amounts and savings goals" },
    { emoji: "🕐", title: "Activity", detail: "The recent activity history" },
  ];
}
