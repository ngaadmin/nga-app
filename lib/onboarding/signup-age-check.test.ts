import { describe, expect, it } from "vitest";
import type { createClassSeats } from "@/lib/school/class-roster";
import type { createTeacherAccount } from "@/lib/school/create-teacher-account";
import {
  ageTrackFitMessage,
  collectsBirthYear,
  decideLearnerAge,
  payloadStoresBirthYear,
  profileColumnsForAudience,
} from "@/lib/onboarding/signup-age-check";

const REFERENCE_YEAR = 2026;

function yearForAge(age: number): number {
  return REFERENCE_YEAR - age - 1;
}

describe("learner age boundaries", () => {
  it("treats 13 as Explorer with parent approval and 14 as Pathfinder", () => {
    const thirteen = decideLearnerAge(yearForAge(13), REFERENCE_YEAR);
    const fourteen = decideLearnerAge(yearForAge(14), REFERENCE_YEAR);

    expect(thirteen).toMatchObject({
      age: 13,
      cohort: "explorer",
      parentApprovalRequired: true,
    });
    expect(fourteen).toMatchObject({
      age: 14,
      cohort: "pathfinder",
      parentApprovalRequired: false,
    });
  });

  it("treats 16 as Pathfinder and 17 as Maverick", () => {
    const sixteen = decideLearnerAge(yearForAge(16), REFERENCE_YEAR);
    const seventeen = decideLearnerAge(yearForAge(17), REFERENCE_YEAR);

    expect(sixteen).toMatchObject({
      age: 16,
      cohort: "pathfinder",
      parentApprovalRequired: false,
    });
    expect(seventeen).toMatchObject({
      age: 17,
      cohort: "maverick",
      parentApprovalRequired: false,
    });
  });
});

describe("track mismatch", () => {
  it("names the track that fits and keeps that decision free of the year", () => {
    const birthYear = yearForAge(13);
    const columns = profileColumnsForAudience({
      audience: "learner",
      birthYear,
      checkedAt: "2026-10-15T12:00:00.000Z",
      referenceYear: REFERENCE_YEAR,
    });

    expect(ageTrackFitMessage("explorer")).toBe(
      "Based on your age, Explorer is the right fit",
    );
    expect(columns).toEqual({
      curriculum_cohort: "explorer",
      parent_approval_required: true,
      age_checked_at: "2026-10-15T12:00:00.000Z",
    });
    expect(payloadStoresBirthYear(columns)).toBe(false);
    expect(JSON.stringify(columns)).not.toContain(String(birthYear));
  });

  it("moves an older learner off Explorer without storing the year", () => {
    const birthYear = yearForAge(17);
    const columns = profileColumnsForAudience({
      audience: "learner",
      birthYear,
      checkedAt: "2026-10-15T12:00:00.000Z",
      referenceYear: REFERENCE_YEAR,
    });

    expect(ageTrackFitMessage("maverick")).toBe(
      "Based on your age, Maverick is the right fit",
    );
    expect(columns?.curriculum_cohort).toBe("maverick");
    expect(columns?.parent_approval_required).toBe(false);
    expect(JSON.stringify(columns)).not.toContain(String(birthYear));
  });
});

describe("who is asked for a birth year", () => {
  it("asks only the learner sign-up", () => {
    expect(collectsBirthYear("learner")).toBe(true);
    expect(collectsBirthYear("guest")).toBe(false);
    expect(collectsBirthYear("teacher")).toBe(false);
    expect(collectsBirthYear("class-seat")).toBe(false);
  });

  it("writes no age columns for teachers or class seats", () => {
    const birthYear = yearForAge(12);
    for (const audience of ["teacher", "class-seat", "guest"] as const) {
      const columns = profileColumnsForAudience({
        audience,
        birthYear,
        checkedAt: "2026-10-15T12:00:00.000Z",
        referenceYear: REFERENCE_YEAR,
      });
      expect(columns).toBeNull();
    }
  });
});

describe("birth year is not a persisted field", () => {
  it("rejects a birth year argument on teacher and class-seat creators", () => {
    type TeacherInput = Parameters<typeof createTeacherAccount>[0];
    type ClassSeatInput = Parameters<typeof createClassSeats>[0];
    type NoBirthYear<T> = "birthYear" extends keyof T ? never : true;

    const teacherHasNoBirthYear: NoBirthYear<TeacherInput> = true;
    const classSeatHasNoBirthYear: NoBirthYear<ClassSeatInput> = true;
    expect(teacherHasNoBirthYear).toBe(true);
    expect(classSeatHasNoBirthYear).toBe(true);
  });

  it("omits the year from the learner profile write", () => {
    const birthYear = yearForAge(16);
    const columns = profileColumnsForAudience({
      audience: "learner",
      birthYear,
      checkedAt: "2026-10-15T12:00:00.000Z",
      referenceYear: REFERENCE_YEAR,
    });
    expect(columns).toEqual({
      curriculum_cohort: "pathfinder",
      parent_approval_required: false,
      age_checked_at: "2026-10-15T12:00:00.000Z",
    });
    expect(Object.keys(columns ?? {})).not.toContain("birth_year");
    expect(Object.keys(columns ?? {})).not.toContain("birthYear");
    expect(payloadStoresBirthYear(columns)).toBe(false);
  });
});
