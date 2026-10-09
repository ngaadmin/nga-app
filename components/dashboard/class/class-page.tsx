"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  changeClassPassword,
  createClassSeats,
  saveClassCohort,
  type ClassRosterSnapshot,
} from "@/lib/school/class-roster";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type ClassPageProps = {
  roster: ClassRosterSnapshot;
};

function StudentLoginTable({ usernames }: { usernames: string[] }) {
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
        </tr>
      </thead>
      <tbody>
        {usernames.map((name) => (
          <tr key={name}>
            <td className="border-b border-nga-mist py-2 pr-4">{name}</td>
            <td className="border-b border-nga-mist py-2">&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ClassPage({ roster }: ClassPageProps) {
  const [studentsUsed, setStudentsUsed] = useState(roster.seatsUsed);
  const [usernames, setUsernames] = useState(roster.usernames);
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
                  {masteryCohortLabel(cohort)}
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
          <StudentLoginTable usernames={sortedUsernames} />
          <p className="font-sans text-xs text-nga-slate">
            Add student names after printing. Names are not stored in the app.
          </p>
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

      <div className={cn("hidden print:block")}>
        {classCohort ? (
          <p className="mb-3 font-heading text-sm font-bold text-nga-primary">
            Class track: {masteryCohortLabel(classCohort)}
          </p>
        ) : null}
        <StudentLoginTable usernames={sortedUsernames} />
      </div>
    </div>
  );
}
