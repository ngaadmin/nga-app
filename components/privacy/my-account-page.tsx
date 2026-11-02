"use client";

import { useEffect, useState } from "react";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { ParentDataPinGate } from "@/components/privacy/parent-data-pin-gate";
import { deleteHouseholdMasterAccount } from "@/lib/onboarding/delete-household-master";
import { signOutApp, redirectToHomeAfterSignOut } from "@/lib/onboarding/sign-out";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import {
  loadParentOwnRecord,
  loadTeacherOwnRecord,
  parentDataGrantActive,
  unlockParentDataView,
} from "@/lib/privacy/account-data-server";
import type { HistoryEntry } from "@/lib/privacy/data-controls";
import { deleteTeacherPhraseAccepted, formatStudentLoginSummary } from "@/lib/privacy/data-controls";
import { downloadAccountFile } from "@/lib/privacy/download-account-file";
import { ManagerRecordScreen } from "@/components/privacy/manager-record-screen";
import { RemovalConfirmSheet } from "@/components/privacy/removal-confirm-sheet";
import { isFourDigitPin } from "@/lib/validation/pin";

type ParentRecord = {
  email: string;
  children: {
    userId: string;
    username: string;
    trackLabel: string | null;
    cohort?: MasteryCohort | null;
  }[];
  history: HistoryEntry[];
  historyTitle: string;
  historySummary: string;
};

type TeacherRecord = {
  username: string;
  email: string;
  classLabel: string;
  studentCount: number;
  students: { userId: string; username: string }[];
  history: HistoryEntry[];
  historyTitle: string;
  historySummary: string;
};

export function MyAccountPage({ historyOpen = false }: { historyOpen?: boolean }) {
  const session = useUserSession();
  const isTeacher = session?.accountRole === "teacher" || session?.isTeacher === true;
  const isParent = session?.accountRole === "parent_master";
  const joinDate = session?.createdAt ?? null;
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState("");
  const [parentRecord, setParentRecord] = useState<ParentRecord | null>(null);
  const [teacherRecord, setTeacherRecord] = useState<TeacherRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (isTeacher) {
      void loadTeacherOwnRecord().then((result) => {
        setChecking(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setTeacherRecord(result);
        setReady(true);
      });
      return;
    }
    if (!isParent) {
      setChecking(false);
      return;
    }
    void parentDataGrantActive().then(async (active) => {
      setChecking(false);
      if (!active) return;
      const result = await loadParentOwnRecord();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setParentRecord(result);
      setReady(true);
    });
  }, [session, isTeacher, isParent]);

  async function unlock(enteredPin: string): Promise<string | null> {
    const unlocked = await unlockParentDataView(enteredPin);
    if (!unlocked.ok) return unlocked.error;
    setPin(enteredPin);
    const result = await loadParentOwnRecord();
    if (!result.ok) {
      setError(result.error);
      return result.error;
    }
    setParentRecord(result);
    setReady(true);
    return null;
  }

  if (!session || checking) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">Loading…</p>;
  }

  if (!isParent && !isTeacher) {
    return (
      <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">
        This page is for a parent or a teacher.
      </p>
    );
  }

  if (isParent && !ready) {
    return (
      <ParentDataPinGate kind="account" onUnlock={unlock} />
    );
  }

  if (isTeacher && teacherRecord) {
    const count = teacherRecord.studentCount;
    const names = formatStudentLoginSummary(teacherRecord.students.map((student) => student.username));
    return (
      <>
        <ManagerRecordScreen
          kind="teacher"
          backHref="/dashboard/settings"
          email={teacherRecord.email}
          joined={joinDate}
          username={teacherRecord.username}
          classLabel={teacherRecord.classLabel}
          studentCount={count}
          history={teacherRecord.history}
          historyTitle={teacherRecord.historyTitle}
          historySummary={teacherRecord.historySummary}
          historyOpen={historyOpen}
          onDownload={() => {
            void downloadAccountFile({ kind: "teacher" }).then((message) => {
              if (message) setError(message);
            });
          }}
          onDelete={() => {
            setPhrase("");
            setConfirmError(null);
            setConfirmOpen(true);
          }}
        />
        {error ? <p role="alert" className="px-2 text-center font-sans text-sm text-[#031F82]">{error}</p> : null}
        <RemovalConfirmSheet
          open={confirmOpen}
          title="Delete your teacher account?"
          body={`This deletes your classes and all ${count} student logins in them. Students can't log in again and their progress is gone for good.`}
          items={[
            {
              icon: "profile",
              title: "Your teacher account",
              detail: `Username ${teacherRecord.username}, email and history`,
            },
            {
              icon: "class",
              title: "Your class",
              detail: `${teacherRecord.classLabel} and its class password`,
            },
            {
              icon: "students",
              title: `All ${count} student logins`,
              detail: names ? `${names}, and everything in their accounts` : "No student logins",
            },
          ]}
          footnote="Want a copy first? Tap Cancel, then Export whole class."
          phraseLabel="Type DELETE to confirm"
          phraseValue={phrase}
          onPhraseChange={setPhrase}
          confirmLabel={`Delete account, class and ${count} ${count === 1 ? "student" : "students"}`}
          confirmDisabled={!deleteTeacherPhraseAccepted(phrase)}
          error={confirmError}
          busy={busy}
          onClose={() => {
            if (!busy) setConfirmOpen(false);
          }}
          onConfirm={() => {
            setBusy(true);
            void fetch("/api/account/delete-teacher", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phrase }),
            })
              .then(async (response) => {
                const payload = (await response.json().catch(() => null)) as {
                  success?: boolean;
                  error?: string;
                } | null;
                if (!response.ok || !payload?.success) {
                  setConfirmError(payload?.error || "Could not delete this account. Try again.");
                  setBusy(false);
                  return;
                }
                await signOutApp();
                redirectToHomeAfterSignOut();
              })
              .catch(() => {
                setConfirmError("Could not delete this account. Try again.");
                setBusy(false);
              });
          }}
        />
      </>
    );
  }

  if (!parentRecord) {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">{error || "Loading…"}</p>;
  }

  const activePin = pin || confirmPin;

  return (
    <>
      <ManagerRecordScreen
        kind="parent"
        backHref="/dashboard/settings"
        email={parentRecord.email}
        joined={joinDate}
        linkedChildren={parentRecord.children}
        history={parentRecord.history}
        historyTitle={parentRecord.historyTitle}
        historySummary={parentRecord.historySummary}
        historyOpen={historyOpen}
        onDownload={() => {
          void downloadAccountFile({ kind: "parent" }).then((message) => {
            if (message) setError(message);
          });
        }}
        onDelete={() => {
          setConfirmError(null);
          setConfirmOpen(true);
        }}
      />
      {error ? <p role="alert" className="px-2 text-center font-sans text-sm text-[#031F82]">{error}</p> : null}
      <RemovalConfirmSheet
        open={confirmOpen}
        title="Delete your account?"
        body="This deletes your account and your children's accounts. It can't be undone."
        items={[
          { icon: "email", title: "Your account", detail: "Your email and consent history" },
          {
            icon: "children",
            title: "Linked children",
            detail: parentRecord.children.map((child) => child.username).join(", ") || "None linked",
          },
        ]}
        confirmLabel="Delete my account"
        confirmDisabled={!pin && !isFourDigitPin(confirmPin)}
        pinLabel={pin ? undefined : "Parent PIN"}
        pinValue={confirmPin}
        onPinChange={setConfirmPin}
        error={confirmError}
        busy={busy}
        onClose={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => {
          setBusy(true);
          void deleteHouseholdMasterAccount(activePin).then(async (result) => {
            if (!result.success) {
              setConfirmError(result.error);
              setBusy(false);
              return;
            }
            await signOutApp();
            redirectToHomeAfterSignOut();
          });
        }}
      />
    </>
  );
}
