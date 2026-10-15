"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientPortal } from "@/components/ui/client-portal";
import {
  changeClassPassword,
  createClassSeats,
  saveClassCohort,
  type ClassRosterSnapshot,
} from "@/lib/school/class-roster";
import type { ClassXpTotal } from "@/lib/school/class-xp";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  masteryCohortNameAndAgeLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { isKidClassPassword, suggestClassPassword } from "@/lib/school/class-password";
import { cn } from "@/lib/utils/cn";

const COHORT_EMOJI: Record<MasteryCohort, string> = {
  explorer: "🔭",
  pathfinder: "🧭",
  maverick: "🚀",
};

/** Shown only while students exist. Exact wording from the class-track lock. */
const TRACK_LOCK_HELP_LEAD = "To change the track, remove all users first.";
const TRACK_LOCK_HELP_REST = "Then you can change it and add users again.";

type ClassPageProps = {
  roster: ClassRosterSnapshot;
  /** True only for the visit that just saved a new class password. */
  passwordSaved?: boolean;
};

type PendingRemove =
  | { scope: "one"; username: string }
  | { scope: "all" };

function withoutStudents(
  classes: ClassXpTotal[],
  removed: readonly string[],
): ClassXpTotal[] {
  const gone = new Set(removed.map((username) => username.trim().toLowerCase()));
  if (gone.size === 0) return classes;
  return classes.map((cls) => {
    const students = cls.students.filter(
      (student) => !gone.has(student.username.trim().toLowerCase()),
    );
    const totalLifetimeXp = students.reduce(
      (sum, student) => sum + student.lifetimeXp,
      0,
    );
    return { ...cls, students, totalLifetimeXp };
  });
}

function withNewStudents(
  classes: ClassXpTotal[],
  created: readonly string[],
): ClassXpTotal[] {
  const first = classes[0];
  if (!first) return classes;
  const seen = new Set(first.students.map((student) => student.username));
  const added = created
    .map((username) => username.trim())
    .filter((username) => username.length > 0 && !seen.has(username))
    .map((username) => ({ username, lifetimeXp: 0 }));
  if (added.length === 0) return classes;
  const students = [...first.students, ...added].sort((left, right) =>
    left.username.localeCompare(right.username),
  );
  return [{ ...first, students }, ...classes.slice(1)];
}

function wholeSeatCount(raw: string, max: number): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1 || count > max) return null;
  return count;
}

function TintCircle({
  children,
  size = 40,
  className,
}: {
  children: React.ReactNode;
  size?: 40 | 48;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] leading-none",
        size === 48 ? "size-12 text-[26px]" : "size-10 text-[22px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="#031F82" strokeWidth="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" fill="none" stroke="#031F82" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 9V4h10v5" fill="none" stroke="#031F82" strokeWidth="2" strokeLinejoin="round" />
      <rect x="3" y="9" width="18" height="8" rx="2" fill="none" stroke="#031F82" strokeWidth="2" />
      <rect x="7" y="14" width="10" height="6" fill="none" stroke="#031F82" strokeWidth="2" />
    </svg>
  );
}

function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden
      className="block shrink-0 text-[#9AA8CC]"
    >
      <path
        d={open ? "M4.5 12.5 10 7 15.5 12.5" : "M4.5 7.5 10 13 15.5 7.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="#031F82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
          <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a18 18 0 0 1-3.2 4.2" />
          <path d="M6.1 6.1C3.5 7.8 2 12 2 12s3 7 10 7a10 10 0 0 0 4.1-.9" />
        </>
      ) : (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function ClassPasswordRow({
  classPassword,
  onPasswordSaved,
  initiallySaved = false,
}: {
  classPassword: string;
  onPasswordSaved: (next: string) => void;
  initiallySaved?: boolean;
}) {
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [changing, setChanging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);
  const [currentVisible, setCurrentVisible] = useState(false);
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const nextValid = isKidClassPassword(nextPassword);
  const matches = nextPassword.length > 0 && nextPassword === confirmPassword;
  const canSave = nextValid && matches && !saving;
  const hint =
    nextPassword.length > 0 && !nextValid
      ? "Use two easy words with a dash, like blue-tiger."
      : confirmPassword.length > 0 && nextValid && !matches
        ? "These don't match yet."
        : "Two easy words with a dash, like blue-tiger.";
  const hintTone = hint.startsWith("Two easy") ? "muted" : "brand";

  useEffect(() => {
    return () => {
      if (copiedTimer.current != null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  async function copyPassword() {
    if (!classPassword) return;
    try {
      await navigator.clipboard.writeText(classPassword);
    } catch {
      return;
    }
    setCopied(true);
    if (copiedTimer.current != null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  function closeChange() {
    setChanging(false);
    setCurrentVisible(false);
    setNextPassword("");
    setConfirmPassword("");
    setSaveError(null);
  }

  useEffect(() => {
    if (!changing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeChange();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changing]);

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    setSaveError(null);
    setSaving(true);
    try {
      const result = await changeClassPassword(nextPassword);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      onPasswordSaved(nextPassword);
      setSaved(true);
      setVisible(false);
      closeChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("print:hidden", saved ? "" : "border-b border-[#E1E8F6]")}>
      <div className="flex min-h-[60px] items-center gap-3.5 py-2">
        <TintCircle className="text-[20px]">🔑</TintCircle>
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap font-heading text-[17px] font-semibold leading-tight text-[#14213D]">
            Class password
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-bold leading-tight text-[#14213D]">
            {visible ? (
              <span className="tracking-normal">{classPassword}</span>
            ) : (
              <span aria-hidden className="tracking-[3px]">
                ••••••••
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            aria-label="Show class password"
            onClick={() => setVisible((open) => !open)}
            className="inline-flex size-9 items-center justify-center rounded-full"
          >
            <EyeIcon off={visible} />
          </button>
          <button
            type="button"
            aria-label={copied ? "Copied" : "Copy class password"}
            onClick={() => void copyPassword()}
            className="inline-flex size-9 items-center justify-center rounded-full"
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setChanging(true)}
            className="ml-2 border-b-2 border-[#FFB822] font-heading text-[15px] font-semibold text-[#031F82]"
          >
            Change
          </button>
        </div>
      </div>
      {saved ? (
        <p
          role="status"
          className="ml-[54px] flex items-center gap-1.5 border-b border-[#E1E8F6] pb-3 font-heading text-[13px] font-bold text-[#031F82]"
        >
          <span
            aria-hidden
            className="inline-flex size-[18px] items-center justify-center rounded-full bg-[#FFB822] text-[12px] font-extrabold leading-none text-[#031F82]"
          >
            ✓
          </span>
          Class password changed
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </p>
      {changing ? (
        <ClientPortal rootId="modal-root">
          <div
            className="pointer-events-auto fixed inset-0 z-modal flex items-center justify-center bg-[#14213D]/45 px-5"
            role="presentation"
            onClick={closeChange}
          >
            <form
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => void savePassword(event)}
              className="w-full max-w-[720px] rounded-3xl bg-white px-5 py-6"
            >
              <h2 id={titleId} className="font-heading text-[22px] font-bold text-[#031F82]">
                Change class password
              </h2>
              <p className="mt-[18px] font-heading text-[13px] font-bold tracking-[0.5px] text-[#4A5675]">
                CURRENT CLASS PASSWORD
              </p>
              <div className="flex h-10 items-center">
                <p className="min-w-0 flex-1 font-heading text-[15px] font-bold text-[#14213D]">
                  {currentVisible ? (
                    <span className="tracking-normal">{classPassword}</span>
                  ) : (
                    <span aria-hidden className="tracking-[3px]">
                      ••••••••
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={currentVisible}
                  aria-label="Show class password"
                  onClick={() => setCurrentVisible((open) => !open)}
                  className="inline-flex items-center gap-1.5 font-heading text-[13px] font-semibold text-[#031F82]"
                >
                  <EyeIcon off={currentVisible} />
                  Show class password
                </button>
              </div>
              <div className="mt-3.5 flex items-center">
                <p className="font-heading text-[13px] font-bold tracking-[0.5px] text-[#4A5675]">
                  NEW CLASS PASSWORD
                </p>
                <button
                  type="button"
                  onClick={() => setNextPassword(suggestClassPassword())}
                  className="ml-auto border-b-2 border-[#FFB822] font-heading text-[13px] font-semibold text-[#031F82]"
                >
                  <span aria-hidden>🎲 </span>
                  Suggest one
                </button>
              </div>
              <input
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. blue-tiger"
                aria-describedby="class-password-hint"
                className="mt-2 h-14 w-full rounded-full border-0 bg-[#EAF0FF] px-5 text-center font-heading text-[18px] font-semibold text-[#031F82] outline-none placeholder:text-[#8C98B8]"
              />
              <p
                id="class-password-hint"
                className={cn(
                  "mt-2 font-sans text-[13px]",
                  hintTone === "brand"
                    ? "font-semibold text-[#031F82]"
                    : "font-medium text-[#4A5675]",
                )}
              >
                {hint}
              </p>
              <p className="mt-4 font-heading text-[13px] font-bold tracking-[0.5px] text-[#4A5675]">
                CONFIRM NEW PASSWORD
              </p>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter it again"
                className="mt-2 h-14 w-full rounded-full border-0 bg-[#EAF0FF] px-5 text-center font-heading text-[18px] font-semibold text-[#031F82] outline-none placeholder:text-[#8C98B8]"
              />
              <p className="mt-2.5 font-sans text-[13px] font-medium leading-[1.4] text-[#4A5675]">
                Users will need the new password next time they log in.
              </p>
              {saveError ? (
                <p className="mt-2 font-sans text-[13px] font-semibold text-[#031F82]" role="alert">
                  {saveError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!canSave}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#031F82] font-heading text-[19px] font-bold text-white shadow-[0_4px_0_#FFB822] disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          </div>
        </ClientPortal>
      ) : null}
    </div>
  );
}

export function ClassPage({ roster, passwordSaved = false }: ClassPageProps) {
  const [studentsUsed, setStudentsUsed] = useState(roster.seatsUsed);
  const [usernames, setUsernames] = useState(roster.usernames);
  const [classes, setClasses] = useState(roster.classes);
  const [classPassword, setClassPassword] = useState(roster.classPassword);
  const [classCohort, setClassCohort] = useState<MasteryCohort | null>(
    roster.classCohort,
  );
  const [savingCohort, setSavingCohort] = useState(false);
  const [studentCount, setStudentCount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);
  const [removing, setRemoving] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(roster.seatsUsed === 0);
  const [allocating, setAllocating] = useState(false);
  const [trackOpen, setTrackOpen] = useState(roster.classCohort == null);
  const allocateInputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, roster.seatCap - studentsUsed);
  const seatCount = wholeSeatCount(studentCount, remaining);
  const trackLocked = studentsUsed > 0 && classCohort != null;
  const totalXp = classes.reduce((sum, cls) => sum + cls.totalLifetimeXp, 0);

  useEffect(() => {
    if (allocating) allocateInputRef.current?.focus();
  }, [allocating]);

  async function handlePickCohort(cohort: MasteryCohort) {
    if (savingCohort || cohort === classCohort) return;
    if (studentsUsed > 0 && classCohort) return;
    setError(null);
    setNotice(null);
    setSavingCohort(true);
    try {
      const result = await saveClassCohort(cohort);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setClassCohort(result.classCohort);
      setTrackOpen(false);
    } finally {
      setSavingCohort(false);
    }
  }

  const sortedUsernames = useMemo(
    () => [...usernames].sort((a, b) => a.localeCompare(b)),
    [usernames],
  );

  async function handleAddStudents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (seatCount == null) {
      setError("Enter how many users.");
      return;
    }
    if (!classCohort) {
      setError("Pick Explorer, Pathfinder or Maverick first.");
      return;
    }
    setCreating(true);
    try {
      const result = await createClassSeats({
        count: seatCount,
        classPassword,
        cohort: classCohort,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUsernames((prev) => [...prev, ...result.created]);
      setClasses((prev) => withNewStudents(prev, result.created));
      setStudentsUsed((prev) => prev + result.created.length);
      setStudentCount("");
      setAllocating(false);
      setStudentsOpen(true);
      setNotice(
        result.created.length === 1
          ? "Allocated 1 user."
          : `Allocated ${result.created.length} users.`,
      );
    } finally {
      setCreating(false);
    }
  }

  async function confirmRemove() {
    if (!pendingRemove || removing) return;
    setError(null);
    setNotice(null);
    setRemoving(true);
    try {
      const response = await fetch("/api/school/class-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingRemove),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        removed?: string[];
      };
      const removed = Array.isArray(payload.removed)
        ? payload.removed.filter((name) => typeof name === "string")
        : [];
      if (removed.length > 0) {
        const gone = new Set(removed.map((name) => name.trim().toLowerCase()));
        setUsernames((prev) =>
          prev.filter((name) => !gone.has(name.trim().toLowerCase())),
        );
        setClasses((prev) => withoutStudents(prev, removed));
        setStudentsUsed((prev) => Math.max(0, prev - removed.length));
      }
      if (!response.ok || payload.success !== true) {
        setError(payload.error || "Could not remove that user. Try again.");
        return;
      }
      setPendingRemove(null);
      setNotice(
        removed.length === 1
          ? "Removed 1 user."
          : `Removed ${removed.length} users.`,
      );
    } catch {
      setError("Could not remove that user. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  const title = classCohort
    ? `${masteryCohortLabel(classCohort)} class`
    : "Class";

  return (
    <div
      className={cn(
        "flex-1 bg-[linear-gradient(180deg,#EEF5FF_0%,#FFFFFF_55%)] px-5 pb-4 font-sans text-[#14213D]",
        "-mx-4 -mt-6 sm:-mx-6",
        "print:m-0 print:max-w-none print:bg-white print:p-0",
      )}
    >
      <div className="mx-auto w-full max-w-[720px]">
        <div className="print:hidden">
          <h1 className="mt-2 font-heading text-[26px] font-bold leading-[1.2] text-[#031F82]">
            {title}
            {classCohort ? (
              <span aria-hidden> {COHORT_EMOJI[classCohort]}</span>
            ) : null}
          </h1>
          <p className="mt-1.5 font-sans text-base font-medium leading-[1.4] text-[#4A5675]">
            <span className="font-heading font-bold text-[#031F82]">{studentsUsed}</span>
            {` of ${roster.seatCap} users allocated`}
          </p>

          <div className="mt-5 flex h-20 items-center gap-3.5 border-y border-[#E1E8F6] px-1">
            <TintCircle size={48}>🏆</TintCircle>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[13px] font-bold tracking-[0.5px] text-[#4A5675]">
                CLASS TOTAL
              </p>
              <p className="font-heading text-2xl font-extrabold leading-none text-[#031F82]">
                {totalXp.toLocaleString()} XP
              </p>
            </div>
          </div>

          <ClassPasswordRow
            classPassword={classPassword}
            onPasswordSaved={setClassPassword}
            initiallySaved={passwordSaved}
          />

          <div className="flex min-h-[60px] items-center gap-3.5 border-b border-[#E1E8F6] py-2">
            <button
              type="button"
              aria-expanded={studentsOpen}
              aria-controls="class-student-list"
              onClick={() => setStudentsOpen((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
            >
              <TintCircle>👥</TintCircle>
              <span className="whitespace-nowrap font-heading text-[17px] font-semibold text-[#14213D]">
                {`Show users (${sortedUsernames.length})`}
              </span>
            </button>
            {sortedUsernames.length > 0 ? (
              <Link
                href={`/class/${roster.teacherId}/print`}
                prefetch
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-heading text-sm font-semibold text-[#031F82]"
              >
                <PrintIcon />
                Print usernames
              </Link>
            ) : null}
            <button
              type="button"
              aria-label={studentsOpen ? "Hide users" : "Show users"}
              onClick={() => setStudentsOpen((open) => !open)}
            >
              <DisclosureChevron open={studentsOpen} />
            </button>
          </div>

          {studentsOpen ? (
            <div id="class-student-list">
              {sortedUsernames.map((username) => (
                <div
                  key={username}
                  className="flex min-h-[60px] items-center gap-3.5 border-b border-[#E1E8F6] py-2"
                >
                  <TintCircle className="bg-[#F3F6FC] text-[20px]">🙂</TintCircle>
                  <span className="min-w-0 flex-1 truncate font-heading text-[17px] font-semibold text-[#14213D]">
                    {username}
                  </span>
                  <button
                    type="button"
                    disabled={removing}
                    aria-label={`Remove ${username}`}
                    onClick={() => setPendingRemove({ scope: "one", username })}
                    className="text-xl leading-none text-[#9AA8CC] disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              ))}

              {allocating ? (
                <form
                  onSubmit={handleAddStudents}
                  className="flex min-h-[60px] items-center gap-2.5 border-b border-[#E1E8F6] py-2"
                >
                  <TintCircle className="text-2xl font-medium text-[#031F82]">+</TintCircle>
                  <span className="min-w-0 flex-1 whitespace-nowrap font-heading text-[17px] font-semibold text-[#031F82]">
                    Allocate users
                  </span>
                  <input
                    ref={allocateInputRef}
                    id="student-count"
                    name="studentCount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={1}
                    max={remaining}
                    placeholder={remaining > 0 ? String(remaining) : undefined}
                    aria-label="Users to allocate"
                    value={studentCount}
                    onChange={(event) =>
                      setStudentCount(event.target.value.replace(/\D/g, ""))
                    }
                    className="h-10 w-[72px] shrink-0 rounded-[20px] border-0 bg-[#EAF0FF] text-center font-heading text-[17px] font-bold text-[#031F82] outline-none placeholder:text-[#031F82]/40"
                  />
                  <button
                    type="submit"
                    disabled={creating || seatCount == null}
                    className="-ml-0.5 h-10 w-24 shrink-0 rounded-[20px] bg-[#031F82] font-heading text-[15px] font-bold text-white shadow-[0_3px_0_#FFB822] disabled:opacity-40"
                  >
                    Allocate
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAllocating(true)}
                  className="flex min-h-[60px] w-full items-center gap-3.5 border-b border-[#E1E8F6] py-2 text-left"
                >
                  <TintCircle className="text-2xl font-medium text-[#031F82]">+</TintCircle>
                  <span className="font-heading text-[17px] font-bold text-[#031F82]">Allocate users</span>
                </button>
              )}
            </div>
          ) : (
            <div id="class-student-list" hidden />
          )}

          <div className="mt-2 flex min-h-[60px] items-center gap-3.5 py-2">
            <TintCircle>
              {classCohort ? COHORT_EMOJI[classCohort] : "🧭"}
            </TintCircle>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[17px] font-semibold leading-tight text-[#14213D]">
                Class track
              </p>
              <p className="mt-0.5 font-sans text-[13px] font-medium text-[#4A5675]">
                {classCohort
                  ? `${masteryCohortLabel(classCohort)} · ages ${masteryCohortAgeRangeLabel(classCohort)}`
                  : "Pick a track"}
              </p>
            </div>
            {trackLocked ? (
              <span aria-hidden className="text-[18px] leading-none">
                🔒
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setTrackOpen((open) => !open)}
                className="border-b-2 border-[#FFB822] font-heading text-[15px] font-semibold text-[#031F82]"
              >
                Change
              </button>
            )}
          </div>

          {trackLocked ? (
            <p className="ml-[54px] font-sans text-[13px] font-medium leading-[1.4] text-[#4A5675]">
              {TRACK_LOCK_HELP_LEAD}
              <br />
              {TRACK_LOCK_HELP_REST}
            </p>
          ) : null}

          <div
            className={cn(
              "ml-[54px] flex gap-1.5",
              trackLocked ? "mt-2" : "mt-0.5",
            )}
            aria-hidden
          >
            {MASTERY_COHORT_ORDER.map((cohort) => (
              <span
                key={cohort}
                className={cn(
                  "text-[18px] leading-none",
                  cohort === classCohort ? "opacity-100" : "opacity-35",
                )}
              >
                {COHORT_EMOJI[cohort]}
              </span>
            ))}
          </div>

          {!trackLocked && trackOpen ? (
            <div className="mt-2" role="group" aria-label="Class track">
              {MASTERY_COHORT_ORDER.map((cohort) => {
                const selected = cohort === classCohort;
                return (
                  <button
                    key={cohort}
                    type="button"
                    aria-pressed={selected}
                    disabled={savingCohort}
                    onClick={() => void handlePickCohort(cohort)}
                    className={cn(
                      "-mx-3.5 flex min-h-[60px] w-[calc(100%+28px)] items-center gap-3.5 rounded-[30px] px-3.5 py-2 text-left font-heading text-[18px] font-semibold",
                      selected
                        ? "bg-[#EAF0FF] text-[#031F82] shadow-[inset_0_0_0_2px_#031F82]"
                        : "text-[#14213D]",
                      savingCohort && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-flex w-9 justify-center text-[30px] leading-none"
                    >
                      {COHORT_EMOJI[cohort]}
                    </span>
                    {masteryCohortNameAndAgeLabel(cohort)}
                  </button>
                );
              })}
            </div>
          ) : null}

          {studentsUsed > 0 ? (
            <button
              type="button"
              disabled={removing}
              onClick={() => setPendingRemove({ scope: "all" })}
              className="ml-[54px] mt-3 font-heading text-[13px] font-semibold text-[#031F82] underline-offset-2 hover:underline disabled:opacity-40"
            >
              Remove all users in class
            </button>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm font-medium text-[#031F82]" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-4 text-sm font-medium text-[#031F82]" role="status">
              {notice}
            </p>
          ) : null}
        </div>

      </div>

      {pendingRemove ? (
        <ClientPortal rootId="modal-root">
          <div
            className="pointer-events-auto fixed inset-0 z-modal flex items-end justify-center bg-[#14213D]/45 p-4 sm:items-center"
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-student-title"
              className="w-full max-w-md rounded-3xl bg-white p-5 shadow-lg"
            >
              <h2
                id="remove-student-title"
                className="text-lg font-bold text-[#031F82]"
              >
                {pendingRemove.scope === "all"
                  ? "Remove all users in this class?"
                  : "Remove this user?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#14213D]">
                {pendingRemove.scope === "all"
                  ? "This deletes every user login in this class and their saved progress. It cannot be undone."
                  : `This deletes ${pendingRemove.username}'s login and saved progress. It cannot be undone.`}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={removing}
                  onClick={() => setPendingRemove(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={removing}
                  onClick={() => void confirmRemove()}
                >
                  {removing
                    ? "Removing…"
                    : pendingRemove.scope === "all"
                      ? "Remove all users"
                      : "Remove user"}
                </Button>
              </div>
            </div>
          </div>
        </ClientPortal>
      ) : null}
    </div>
  );
}
