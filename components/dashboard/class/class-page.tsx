"use client";

import { useMemo, useState } from "react";
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

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

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

function ClassXpTotals({ classes }: { classes: ClassXpTotal[] }) {
  if (classes.length === 0) return null;

  return (
    <section aria-labelledby="class-xp-heading" className="space-y-4">
      <h2 id="class-xp-heading" className="font-heading text-sm font-bold text-nga-primary">
        Class XP
      </h2>
      {classes.map((cls) => (
        <article
          key={cls.classId}
          className="rounded-nga-lg border-2 border-[#BDE9FB] bg-[#F7FBFF] p-4"
        >
          <p className="font-heading text-base font-extrabold text-nga-primary">{cls.label}</p>
          <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wide text-nga-slate">
            Class total
          </p>
          <p className="font-heading text-3xl font-extrabold tabular-nums text-[#031F82]">
            {cls.totalLifetimeXp.toLocaleString()} XP
          </p>
          {cls.students.length > 0 ? (
            <ul className="mt-3 divide-y divide-[#BDE9FB]">
              {cls.students.map((student) => (
                <li
                  key={student.username}
                  className="flex items-center justify-between gap-3 py-2 font-sans text-sm text-nga-ink"
                >
                  <span className="min-w-0 truncate">{student.username}</span>
                  <span className="shrink-0 font-heading font-bold tabular-nums text-[#031F82]">
                    {student.lifetimeXp.toLocaleString()} XP
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-sans text-sm text-nga-slate">No students yet.</p>
          )}
        </article>
      ))}
    </section>
  );
}

function StudentLoginTable({
  usernames,
  onRemove,
  removing,
}: {
  usernames: string[];
  onRemove?: (username: string) => void;
  removing?: boolean;
}) {
  return (
    <table className="w-full border-collapse text-left font-sans text-sm text-nga-ink">
      <thead>
        <tr>
          <th className="border-b border-nga-ink py-2 pr-4 font-heading font-bold">
            Username
          </th>
          <th className="border-b border-nga-ink py-2 font-heading font-bold">
            Student name
          </th>
          {onRemove ? (
            <th className="border-b border-nga-ink py-2 pl-4 text-right font-heading font-bold">
              <span className="sr-only">Remove</span>
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {usernames.map((name) => (
          <tr key={name}>
            <td className="border-b border-nga-mist py-2 pr-4">{name}</td>
            <td className="border-b border-nga-mist py-2">&nbsp;</td>
            {onRemove ? (
              <td className="border-b border-nga-mist py-2 pl-4 text-right">
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => onRemove(name)}
                  className="font-heading text-xs font-bold text-red-700 underline-offset-2 hover:underline disabled:opacity-40"
                >
                  Remove student
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
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

  const remaining = Math.max(0, roster.seatCap - studentsUsed);
  const cohortLocked = studentsUsed > 0;

  async function handlePickCohort(cohort: MasteryCohort) {
    if (cohortLocked || cohort === classCohort || savingCohort) return;
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
    const count = Number(studentCount);
    if (!studentCount.trim() || !Number.isFinite(count) || count < 1) {
      setError("Enter how many students.");
      return;
    }
    if (!classCohort) {
      setError("Pick Explorer, Pathfinder or Maverick first.");
      return;
    }
    setCreating(true);
    try {
      const result = await createClassSeats({
        count,
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
      setNotice(
        result.created.length === 1
          ? "Added 1 student."
          : `Added ${result.created.length} students.`,
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex justify-center print:hidden">
        <Image
          src="/nga-logo.png"
          alt="NextGenAchievers Logo"
          height={40}
          width={160}
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="print:hidden space-y-6">
        <ClassXpTotals classes={classes} />

        <p className="font-heading text-base font-bold text-nga-primary">
          You have {remaining} student seats left on this account.
        </p>

        <fieldset className="space-y-3">
          <legend className="font-heading text-sm font-bold text-nga-primary">
            Class track
          </legend>
          {classCohort ? (
            <p className="font-sans text-sm text-nga-ink">
              This class is{" "}
              <span className="font-heading font-bold text-nga-primary">
                {masteryCohortLabel(classCohort)}
              </span>
              {" · "}
              ages {masteryCohortAgeRangeLabel(classCohort)}.
              {cohortLocked
                ? " Every student login uses this track."
                : " Pick this before you add students."}
            </p>
          ) : (
            <p className="font-sans text-sm text-nga-slate">
              Pick Explorer, Pathfinder or Maverick before you add students.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {MASTERY_COHORT_ORDER.map((cohort) => {
              const selected = cohort === classCohort;
              return (
                <button
                  key={cohort}
                  type="button"
                  aria-pressed={selected}
                  disabled={savingCohort || (cohortLocked && !selected)}
                  onClick={() => handlePickCohort(cohort)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1.5 font-heading text-sm font-bold",
                    selected
                      ? "border-nga-primary bg-nga-primary text-white"
                      : "border-nga-primary bg-white text-nga-primary",
                    (savingCohort || (cohortLocked && !selected)) &&
                      "cursor-not-allowed opacity-40",
                  )}
                >
                  {masteryCohortNameAndAgeLabel(cohort)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <form className="space-y-3" onSubmit={handleAddStudents}>
          <label
            htmlFor="student-count"
            className="block font-heading text-sm font-bold text-nga-primary"
          >
            How many students?
          </label>
          <input
            id="student-count"
            name="studentCount"
            type="number"
            min={1}
            max={Math.max(1, remaining)}
            value={studentCount}
            onChange={(event) => setStudentCount(event.target.value)}
            className={fieldBase}
          />
          <Button
            type="submit"
            variant="cta"
            fullWidth
            disabled={creating || remaining <= 0 || !classCohort}
          >
            {creating ? "Adding…" : "Add students"}
          </Button>
        </form>

        <form className="space-y-2" onSubmit={handleChangePassword}>
          <label
            htmlFor="class-password"
            className="block font-heading text-sm font-bold text-nga-primary"
          >
            Class password
          </label>
          <input
            id="class-password"
            type="text"
            autoComplete="off"
            value={classPassword}
            onChange={(event) => setClassPassword(event.target.value)}
            className={fieldBase}
          />
          <p className="font-sans text-sm text-nga-slate">
            Students use this with their username.
          </p>
          <button
            type="submit"
            disabled={changingPassword}
            className="font-sans text-xs text-nga-slate underline-offset-2 hover:text-nga-primary hover:underline disabled:opacity-40"
          >
            {changingPassword ? "Saving…" : "Change"}
          </button>
        </form>

        <div className="space-y-2">
          <p className="font-heading text-sm font-bold text-nga-primary">Student logins</p>
          <StudentLoginTable
            usernames={sortedUsernames}
            onRemove={(username) =>
              setPendingRemove({ scope: "one", username })
            }
            removing={removing}
          />
          <p className="font-sans text-xs text-nga-slate">
            Add student names after printing. Names are not stored in the app.
          </p>
          {sortedUsernames.length > 0 ? (
            <button
              type="button"
              disabled={removing}
              onClick={() => setPendingRemove({ scope: "all" })}
              className="font-heading text-sm font-bold text-red-700 underline-offset-2 hover:underline disabled:opacity-40"
            >
              Remove all students in class
            </button>
          ) : null}
          <Button type="button" variant="outline" fullWidth onClick={() => window.print()}>
            Print this table
          </Button>
        </div>

        {error ? (
          <p className="font-sans text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="font-sans text-sm font-medium text-nga-primary" role="status">
            {notice}
          </p>
        ) : null}
      </div>

      {pendingRemove ? (
        <ClientPortal rootId="modal-root">
          <div
            className="fixed inset-0 z-modal flex items-end justify-center bg-nga-ink/40 p-4 sm:items-center"
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-student-title"
              className="w-full max-w-md rounded-nga-lg bg-white p-5 shadow-lg"
            >
              <h2
                id="remove-student-title"
                className="font-heading text-lg font-extrabold text-nga-primary"
              >
                {pendingRemove.scope === "all"
                  ? "Remove all students in this class?"
                  : "Remove this student?"}
              </h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-nga-ink">
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

      <div className={cn("hidden print:block")}>
        {classCohort ? (
          <p className="mb-3 font-heading text-sm font-bold text-nga-primary">
            Class track: {masteryCohortNameAndAgeLabel(classCohort)}
          </p>
        ) : null}
        <StudentLoginTable usernames={sortedUsernames} />
      </div>
    </div>
  );
}
