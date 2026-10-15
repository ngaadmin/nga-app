"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
import { cn } from "@/lib/utils/cn";

const COHORT_EMOJI: Record<MasteryCohort, string> = {
  explorer: "🔭",
  pathfinder: "🧭",
  maverick: "🚀",
};

/** Shown only while students exist. Exact wording from the class-track lock. */
const TRACK_LOCK_HELP_LEAD = "To change the track, remove all students first.";
const TRACK_LOCK_HELP_REST = "Then you can change it and add students again.";

type ClassPageProps = {
  roster: ClassRosterSnapshot;
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

function ClassPasswordRow({
  classPassword,
  onChange,
  changing,
  onSubmit,
}: {
  classPassword: string;
  onChange: (value: string) => void;
  changing: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const copiedTimer = useRef<number | null>(null);

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

  return (
    <form onSubmit={onSubmit} className="border-b border-[#E1E8F6] print:hidden">
      <div className="flex min-h-[60px] items-center gap-3.5 py-2">
        <TintCircle className="text-[20px]">🔑</TintCircle>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[17px] font-semibold leading-tight text-[#14213D]">
            Class password
          </p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-heading text-[15px] font-bold leading-tight text-[#14213D]">
            {visible ? (
              <span className="tracking-normal">{classPassword}</span>
            ) : (
              <span aria-hidden className="tracking-[3px]">
                ••••••••
              </span>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              onClick={() => setVisible((open) => !open)}
              className="border-b-2 border-[#FFB822] font-heading text-[13px] font-semibold tracking-normal text-[#031F82]"
            >
              {visible ? "Hide" : "Show class password"}
            </button>
            {visible && !editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="border-b-2 border-[#FFB822] font-heading text-[13px] font-semibold tracking-normal text-[#031F82]"
              >
                Change class password
              </button>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy class password"}
          onClick={() => void copyPassword()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
        >
          <CopyIcon />
        </button>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 pb-3 pl-[54px]">
          <label htmlFor="class-password" className="sr-only">
            Class password
          </label>
          <input
            id="class-password"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={classPassword}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full max-w-[220px] rounded-full border-0 bg-[#EAF0FF] px-4 text-center font-heading text-[15px] font-bold text-[#031F82] outline-none"
          />
          <button
            type="submit"
            disabled={changing}
            className="h-10 shrink-0 rounded-full bg-[#031F82] px-4 font-heading text-[15px] font-bold text-white shadow-[0_3px_0_#FFB822] disabled:opacity-40"
          >
            {changing ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </p>
    </form>
  );
}

function ClassPrintSheet({
  title,
  cohort,
  classPassword,
  usernames,
}: {
  title: string;
  cohort: MasteryCohort | null;
  classPassword: string;
  usernames: string[];
}) {
  return (
    <div className="hidden bg-white print:block">
      <div className="flex items-center border-b-2 border-[#031F82] pb-[22px]">
        <Image
          src="/nga-logo-tm.svg"
          alt="NextGenAchievers"
          width={190}
          height={54}
          unoptimized
          className="h-[54px] w-auto"
        />
      </div>
      <h1 className="mt-7 font-heading text-[30px] font-bold leading-[1.2] text-[#031F82]">
        {title}
        {cohort ? <span aria-hidden> {COHORT_EMOJI[cohort]}</span> : null}
      </h1>
      <p className="mt-3.5 font-sans text-base font-medium text-[#4A5675]">
        Class password
        <span className="ml-2 font-heading text-xl font-bold tracking-[1px] text-[#031F82]">
          {classPassword}
        </span>
      </p>
      <table className="mt-7 w-full border-collapse text-left font-sans text-base text-[#14213D]">
        <thead>
          <tr>
            {["#", "Student", "Username"].map((label) => (
              <th
                key={label}
                className={cn(
                  "border-b-2 border-[#031F82] px-2 py-2.5 text-left font-heading text-[13px] font-bold uppercase tracking-[0.5px] text-[#4A5675]",
                  label === "#" && "w-12",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usernames.map((name, index) => (
            <tr key={name}>
              <td className="w-12 border-b border-[#E1E8F6] px-2 py-[13px] font-medium text-[#4A5675]">
                {index + 1}
              </td>
              <td className="border-b border-[#E1E8F6] px-2 py-[13px]">&nbsp;</td>
              <td className="border-b border-[#E1E8F6] px-2 py-[13px] font-heading font-bold text-[#031F82]">
                {name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClassPage({ roster }: ClassPageProps) {
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
  const [changingPassword, setChangingPassword] = useState(false);
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
      setError("Enter how many seats.");
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
          ? "Allocated 1 seat."
          : `Allocated ${result.created.length} seats.`,
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
        setError(payload.error || "Could not remove that student. Try again.");
        return;
      }
      setPendingRemove(null);
      setNotice(
        removed.length === 1
          ? "Removed 1 student."
          : `Removed ${removed.length} students.`,
      );
    } catch {
      setError("Could not remove that student. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setChangingPassword(true);
    try {
      const result = await changeClassPassword(classPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Class password updated.");
    } finally {
      setChangingPassword(false);
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
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>
      <div className="mx-auto w-full max-w-[720px] print:max-w-none print:px-16 print:py-14">
        <div className="print:hidden">
          <h1 className="mt-2 font-heading text-[26px] font-bold leading-[1.2] text-[#031F82]">
            {title}
            {classCohort ? (
              <span aria-hidden> {COHORT_EMOJI[classCohort]}</span>
            ) : null}
          </h1>
          <p className="mt-1.5 font-sans text-base font-medium leading-[1.4] text-[#4A5675]">
            <span className="font-heading font-bold text-[#031F82]">{studentsUsed}</span>
            {` of ${roster.seatCap} seats allocated`}
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
            onChange={setClassPassword}
            changing={changingPassword}
            onSubmit={handleChangePassword}
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
                {`Show students (${sortedUsernames.length})`}
              </span>
            </button>
            {sortedUsernames.length > 0 ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-heading text-sm font-semibold text-[#031F82]"
              >
                <PrintIcon />
                Print usernames
              </button>
            ) : null}
            <button
              type="button"
              aria-label={studentsOpen ? "Hide students" : "Show students"}
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
                    Allocate seats
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
                    aria-label="Seats to allocate"
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
                  <span className="font-heading text-[17px] font-bold text-[#031F82]">Allocate seats</span>
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
              Remove all students in class
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

        <ClassPrintSheet
          title={title}
          cohort={classCohort}
          classPassword={classPassword}
          usernames={sortedUsernames}
        />
      </div>

      {pendingRemove ? (
        <ClientPortal rootId="modal-root">
          <div
            className="fixed inset-0 z-modal flex items-end justify-center bg-[#14213D]/45 p-4 sm:items-center"
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
                  ? "Remove all students in this class?"
                  : "Remove this student?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#14213D]">
                {pendingRemove.scope === "all"
                  ? "This deletes every student login in this class and their saved progress. It cannot be undone."
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
                      ? "Remove all students"
                      : "Remove student"}
                </Button>
              </div>
            </div>
          </div>
        </ClientPortal>
      ) : null}
    </div>
  );
}
