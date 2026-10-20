"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CommunityChallengesPanel } from "@/components/community/community-challenges-panel";
import { ClassPage } from "@/components/dashboard/class/class-page";
import { LearnerDataScreen } from "@/components/privacy/learner-data-screen";
import { ManagerRecordScreen } from "@/components/privacy/manager-record-screen";
import { MyInfoScreen } from "@/components/privacy/my-info-screen";
import {
  RemovalConfirmSheet,
  type RemovalItem,
} from "@/components/privacy/removal-confirm-sheet";
import { hashCredential } from "@/lib/auth/credential-hash";
import { assessParentPin } from "@/lib/dashboard/parent-pin-gate";
import { isFourDigitPin } from "@/lib/validation/pin";
import {
  buildLearnerDataFile,
  formatStudentLoginSummary,
  type LearnerDataView,
} from "@/lib/privacy/data-controls";
import type { ClassRosterSnapshot } from "@/lib/school/class-roster";

const PREVIEW_PIN = "2580";

const DELTA4: LearnerDataView = {
  userId: "child-delta4",
  username: "delta4",
  trackLabel: "Explorer · Ages 10-13",
  accountLine: null,
  linkedParentEmail: "sam.parent@example.com",
  lessonsDone: 12,
  dayStreak: 4,
  bestStreak: 9,
  coins: 480,
  lifetimeXp: 1250,
  medals: { bronze: 5, silver: 2, gold: 1 },
  jars: [
    { name: "Save", emoji: "🏦", amount: 20 },
    { name: "Spend", emoji: "🛒", amount: 8.5 },
    { name: "Give", emoji: "🎁", amount: 4 },
    { name: "Emergency", emoji: "🚨", amount: 0 },
  ],
  goals: [
    { name: "New bike", emoji: "🚲", balance: 40, target: 120 },
    { name: "Gift for Nan", emoji: "🎁", balance: 15, target: 25 },
  ],
  activity: [
    { emoji: "🎓", title: "Finished a lesson", detail: "Stop & Think", when: "Today" },
    { emoji: "🪙", title: "Cashed in 150 coins", detail: "Went to Cash in the Vault", when: "Yesterday" },
    { emoji: "🏦", title: "Moved $5.00 to Save", detail: "Vault", when: "18 Oct" },
    { emoji: "🥉", title: "Bronze medal", detail: "Needs vs Wants", when: "17 Oct" },
  ],
  leaderboardEnabled: false,
};

const RAVEN3: LearnerDataView = {
  userId: "seat-raven3",
  username: "raven3",
  trackLabel: "Explorer · Ages 10-13",
  accountLine: "School seat in Explorer class (no parent linked)",
  linkedParentEmail: null,
  lessonsDone: 9,
  dayStreak: 2,
  bestStreak: 6,
  coins: 210,
  lifetimeXp: 980,
  medals: { bronze: 4, silver: 1, gold: 0 },
  jars: [
    { name: "Save", emoji: "🏦", amount: 0 },
    { name: "Spend", emoji: "🛒", amount: 0 },
    { name: "Give", emoji: "🎁", amount: 0 },
    { name: "Emergency", emoji: "🚨", amount: 0 },
  ],
  goals: [],
  activity: [
    { emoji: "🎓", title: "Finished a lesson", detail: "Needs vs Wants", when: "Today" },
    { emoji: "🥉", title: "Bronze medal", detail: "Stop & Think", when: "16 Oct" },
    { emoji: "🎓", title: "Finished a lesson", detail: "Stop & Think", when: "15 Oct" },
  ],
  leaderboardEnabled: false,
};

const PARENT_HISTORY = [
  {
    at: "2026-09-03T00:00:00.000Z",
    title: "Made a parent account",
    detail: "Agreed to the Terms and Privacy Policy",
  },
  {
    at: "2026-09-03T01:00:00.000Z",
    title: "Gave consent for delta4",
    detail: "Explorer · Ages 10-13",
  },
  {
    at: "2026-09-10T00:00:00.000Z",
    title: "Gave consent for sky7",
    detail: "Pathfinder · Ages 14-16",
  },
  {
    at: "2026-10-12T00:00:00.000Z",
    title: "Leaderboard kept off",
    detail: "For delta4 and sky7",
  },
];

const TEACHER_HISTORY = [
  {
    at: "2026-07-01T00:00:00.000Z",
    title: "Leaderboard kept off",
    detail: "For this class",
  },
  {
    at: "2026-08-01T00:00:00.000Z",
    title: "Made Explorer class",
    detail: "",
  },
];

const STUDENT_NAMES = ["raven2", "raven3", "raven4", "raven5", "raven7", "raven9"];

const EXPLORER_ROSTER: ClassRosterSnapshot = {
  teacherId: "preview-teacher",
  seatCap: 30,
  seatsUsed: 6,
  classPassword: "Yellow",
  classCohort: "explorer",
  usernames: STUDENT_NAMES,
  classes: [
    {
      classId: "preview-explorer",
      label: "Explorer class",
      totalLifetimeXp: 1310 + 980 + 1145 + 620 + 870 + 1020,
      students: [
        { username: "raven2", lifetimeXp: 1310 },
        { username: "raven3", lifetimeXp: 980 },
        { username: "raven4", lifetimeXp: 1145 },
        { username: "raven5", lifetimeXp: 620 },
        { username: "raven7", lifetimeXp: 870 },
        { username: "raven9", lifetimeXp: 1020 },
      ],
    },
  ],
};

/** Stored rows that must never appear in a download. */
const SECRET_CHILD_FILE = {
  profile: {
    username: "delta4",
    parent_pin_hash: "nga2_parentpinhashvalue",
    password_hash: "nga2_passwordhashvalue",
    class_password_enc: "YellowSecret",
  },
  learnerProgress: {
    wallet: { totalPoints: 480, lifetimePointsEarned: 1250 },
  },
  usageEvents: [{ event_type: "lesson_completed" }],
  consentRecords: [{ token_hash: "consenttokenvalue", kind: "vpc" }],
};

const CHILD_REMOVAL: RemovalItem[] = [
  { emoji: "👤", title: "Profile", detail: "Username, track and settings" },
  { emoji: "🎓", title: "Progress", detail: "Lessons and day streak" },
  { emoji: "⭐", title: "Lifetime XP", detail: "The Lifetime XP total" },
  { emoji: "🪙", title: "Coins", detail: "The coins balance" },
  { emoji: "🏅", title: "Medals", detail: "Every bronze, silver and gold medal" },
  { emoji: "🏦", title: "Vault jars and goals", detail: "All jars, amounts and savings goals" },
  { emoji: "🕐", title: "Activity", detail: "The recent activity history" },
];

function studentRemoval(username: string): RemovalItem[] {
  return [
    { emoji: "🔑", title: "Login", detail: `The username ${username} and its class seat` },
    ...CHILD_REMOVAL.slice(1),
  ];
}

function downloadStrippedChildFile() {
  const file = buildLearnerDataFile(SECRET_CHILD_FILE);
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "delta4-data.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function ParentFlowPreview() {
  const pinHash = useMemo(() => hashCredential(PREVIEW_PIN), []);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  function unlock(event: FormEvent) {
    event.preventDefault();
    const result = assessParentPin(pin, pinHash);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setOpen(true);
  }

  if (!open) {
    return (
      <form onSubmit={unlock} className="mx-auto flex w-full max-w-md flex-col gap-3 px-1 py-6">
        <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">Enter your parent PIN</h1>
        <p className="font-sans text-sm text-[#1E3A5F]">
          This page shows your child&apos;s data. It is view only until you confirm a delete.
        </p>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          aria-label="Parent PIN"
          className="h-12 rounded-2xl border-2 border-[#BDE9FB] px-3 font-heading text-lg tracking-[0.3em] text-[#031F82] outline-none"
        />
        {error ? (
          <p role="alert" className="font-sans text-sm text-[#031F82]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!isFourDigitPin(pin)}
          className="h-12 rounded-2xl border-b-4 border-[#021558] bg-[#031F82] font-heading text-sm font-bold uppercase tracking-wide text-white disabled:opacity-40"
        >
          Continue
        </button>
      </form>
    );
  }

  return (
    <>
      <LearnerDataScreen
        view={DELTA4}
        backHref="/dashboard/settings"
        backLabel="Parent Hub"
        siblings={[
          { userId: "child-delta4", username: "delta4" },
          { userId: "child-sky7", username: "sky7" },
        ]}
        activeChildId="child-delta4"
        showLeaderboardSwitch
        onLeaderboardChange={() => undefined}
        deleteLabel="Delete account"
        onDownload={downloadStrippedChildFile}
        onDelete={() => setConfirm(true)}
      />
      <RemovalConfirmSheet
        open={confirm}
        title="Delete delta4's account?"
        body="This removes everything below for good. It can't be undone."
        items={CHILD_REMOVAL}
        footnote="Want a copy first? Tap Cancel, then Download data."
        confirmLabel="Delete delta4's account"
        onConfirm={() => setConfirm(false)}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}

function AskedLeaderboard() {
  useState(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("nga_leaderboard_asked_v1", "1");
    }
    return true;
  });
  return <CommunityChallengesPanel access={{ audience: "home", enabled: false }} />;
}

/** Dev-only screens that use the real data-control components with mock figures. */
export function DataPreview({ screen }: { screen: string }) {
  if (screen === "parent-flow") return <ParentFlowPreview />;
  if (screen === "parent-child" || screen === "delete-child") {
    return (
      <>
        <LearnerDataScreen
          view={DELTA4}
          backHref="/dashboard/settings"
          backLabel="Parent Hub"
          siblings={[
            { userId: "child-delta4", username: "delta4" },
            { userId: "child-sky7", username: "sky7" },
          ]}
          activeChildId="child-delta4"
          showLeaderboardSwitch
          onLeaderboardChange={() => undefined}
          deleteLabel="Delete account"
          onDownload={() => undefined}
          onDelete={() => undefined}
        />
        <RemovalConfirmSheet
          open={screen === "delete-child"}
          title="Delete delta4's account?"
          body="This removes everything below for good. It can't be undone."
          items={CHILD_REMOVAL}
          footnote="Want a copy first? Tap Cancel, then Download data."
          confirmLabel="Delete delta4's account"
          onConfirm={() => undefined}
          onClose={() => undefined}
        />
      </>
    );
  }
  if (screen === "parent-record" || screen === "parent-record-open") {
    return (
      <ManagerRecordScreen
        kind="parent"
        backHref="/dashboard/settings"
        email="sam.parent@example.com"
        historyTitle="Consent history · 4 entries"
        historySummary="Latest: 12 Oct 2026, Leaderboard kept off"
        history={PARENT_HISTORY}
        historyOpen={screen === "parent-record-open"}
        onDownload={() => undefined}
        onDelete={() => undefined}
        linkedChildren={[
          { userId: "child-delta4", username: "delta4", trackLabel: "Explorer · Ages 10-13" },
          { userId: "child-sky7", username: "sky7", trackLabel: "Pathfinder · Ages 14-16" },
        ]}
      />
    );
  }
  if (screen === "teacher-class") {
    return <ClassPage roster={EXPLORER_ROSTER} />;
  }
  if (screen === "teacher-student" || screen === "delete-student") {
    return (
      <>
        <LearnerDataScreen
          view={RAVEN3}
          title="Student data"
          backHref="/dashboard/class"
          backLabel="Back to Explorer class"
          deleteLabel="Delete student"
          vaultNote="Vault amounts are what this student tracks in the app. The app doesn't hold or move money."
          onDownload={() => undefined}
          onDelete={() => undefined}
        />
        <RemovalConfirmSheet
          open={screen === "delete-student"}
          title="Delete raven3?"
          body="This removes the student and everything below for good. It can't be undone."
          items={studentRemoval("raven3")}
          footnote="Want a copy first? Tap Cancel, then Download data."
          confirmLabel="Delete raven3"
          onConfirm={() => undefined}
          onClose={() => undefined}
        />
      </>
    );
  }
  if (screen === "teacher-account") {
    return (
      <ManagerRecordScreen
        kind="teacher"
        backHref="/dashboard/settings"
        email="j.rivera@school.example"
        username="ms_rivera"
        classLabel="Explorer class"
        studentCount={6}
        historyTitle="History · 2 entries"
        historySummary="Latest: 1 Aug 2026, Made Explorer class"
        history={TEACHER_HISTORY}
        onDownload={() => undefined}
        onDelete={() => undefined}
      />
    );
  }
  if (screen === "delete-teacher") return <DeleteTeacherPreview />;
  if (screen === "kid-info") {
    return (
      <MyInfoScreen
        username="delta4"
        trackLabel="Explorer · Ages 10-13"
        managedBy="account_manager"
      />
    );
  }
  if (screen === "kid-info-class") {
    return (
      <MyInfoScreen
        username="raven3"
        trackLabel="Explorer · Ages 10-13"
        managedBy="teacher"
      />
    );
  }
  if (screen === "leaderboard-home") {
    return <CommunityChallengesPanel access={{ audience: "home", enabled: false }} />;
  }
  if (screen === "leaderboard-asked") return <AskedLeaderboard />;
  if (screen === "leaderboard-school") {
    return <CommunityChallengesPanel access={{ audience: "school", enabled: false }} />;
  }
  if (screen === "leaderboard-guest") {
    return <CommunityChallengesPanel access={{ audience: "guest", enabled: false }} />;
  }
  return null;
}

function DeleteTeacherPreview() {
  const names = formatStudentLoginSummary(STUDENT_NAMES);
  const [phrase, setPhrase] = useState("DELETE");
  return (
    <>
      <ManagerRecordScreen
        kind="teacher"
        backHref="/dashboard/settings"
        email="j.rivera@school.example"
        username="ms_rivera"
        classLabel="Explorer class"
        studentCount={6}
        historyTitle="History · 2 entries"
        historySummary="Latest: 1 Aug 2026, Made Explorer class"
        history={TEACHER_HISTORY}
        onDownload={() => undefined}
        onDelete={() => undefined}
      />
      <RemovalConfirmSheet
        open
        title="Delete your teacher account?"
        body="This deletes your classes and all 6 student logins in them. Students can't log in again and their progress is gone for good."
        items={[
          {
            emoji: "👤",
            title: "Your teacher account",
            detail: "Username ms_rivera, email and history",
          },
          {
            emoji: "🏫",
            title: "Your class",
            detail: "Explorer class and its class password",
          },
          {
            emoji: "👥",
            title: "All 6 student logins",
            detail: `${names}, and everything in their accounts`,
          },
        ]}
        footnote="Want a copy first? Tap Cancel, then Export whole class."
        phraseLabel="Type DELETE to confirm"
        phraseValue={phrase}
        onPhraseChange={setPhrase}
        confirmLabel="Delete account, class and 6 students"
        confirmDisabled={phrase !== "DELETE"}
        onConfirm={() => undefined}
        onClose={() => undefined}
      />
    </>
  );
}
