import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { createClassSeats } from "@/lib/school/class-roster";
import type { createTeacherAccount } from "@/lib/school/create-teacher-account";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";
import { ONBOARDING_SIGN_UP_LEARNER_PATH } from "@/lib/onboarding/guest-session";
import {
  LEARNER_MARKETING_CHECKBOX_VISIBLE,
  PARENT_APPROVAL_MIN_AGE,
  ageTrackFitMessage,
  collectsBirthYear,
  decideLearnerAge,
  learnerMarketingOptIn,
  payloadStoresBirthYear,
  planLearnerSignup,
  profileColumnsForAudience,
  signupRequiresParentApproval,
} from "@/lib/onboarding/signup-age-check";

const REFERENCE_YEAR = 2026;

function yearForAge(age: number): number {
  return REFERENCE_YEAR - age - 1;
}

describe("learner age boundaries", () => {
  it("uses one under-16 cutoff", () => {
    expect(PARENT_APPROVAL_MIN_AGE).toBe(16);
  });

  it.each([13, 14, 15])("requires parent approval at age %s", (age) => {
    const decision = decideLearnerAge(yearForAge(age), REFERENCE_YEAR);
    expect(decision?.age).toBe(age);
    expect(decision?.parentApprovalRequired).toBe(true);
  });

  it.each([16, 17, 18])("skips parent approval at age %s", (age) => {
    const decision = decideLearnerAge(yearForAge(age), REFERENCE_YEAR);
    expect(decision?.age).toBe(age);
    expect(decision?.parentApprovalRequired).toBe(false);
  });

  it("suggests a track from age and does not treat that suggestion as consent", () => {
    expect(decideLearnerAge(yearForAge(13), REFERENCE_YEAR)?.suggestedCohort).toBe(
      "explorer",
    );
    expect(decideLearnerAge(yearForAge(15), REFERENCE_YEAR)?.suggestedCohort).toBe(
      "pathfinder",
    );
    expect(decideLearnerAge(yearForAge(16), REFERENCE_YEAR)?.suggestedCohort).toBe(
      "pathfinder",
    );
    expect(decideLearnerAge(yearForAge(17), REFERENCE_YEAR)?.suggestedCohort).toBe(
      "maverick",
    );
    expect(decideLearnerAge(yearForAge(18), REFERENCE_YEAR)?.suggestedCohort).toBe(
      "maverick",
    );
  });
});

describe("track choice does not decide consent", () => {
  it("keeps a 15-year-old on Maverick and requires parent approval", () => {
    const birthYear = yearForAge(15);
    const plan = planLearnerSignup({
      pickedCohort: "maverick",
      birthYear,
      referenceYear: REFERENCE_YEAR,
      requestedMarketingOptIn: true,
    });
    const columns = profileColumnsForAudience({
      audience: "learner",
      birthYear,
      checkedAt: "2026-10-21T12:00:00.000Z",
      referenceYear: REFERENCE_YEAR,
    });

    expect(plan).toEqual({
      cohort: "maverick",
      parentApprovalRequired: true,
      accountStatus: "PENDING_CONSENT",
      requiresLearnerEmail: true,
      requiresParentEmail: true,
      sendParentConsentEmail: true,
      sendLearnerWelcomeEmail: false,
      marketingOptIn: false,
    });
    expect(columns).toEqual({
      parent_approval_required: true,
      age_checked_at: "2026-10-21T12:00:00.000Z",
    });
    expect(payloadStoresBirthYear(plan)).toBe(false);
    expect(payloadStoresBirthYear(columns)).toBe(false);
    expect(JSON.stringify({ plan, columns })).not.toContain(String(birthYear));
  });

  it("keeps parent approval after the under-16 path, even if the year changes to 16+", () => {
    const under16 = yearForAge(15);
    const sixteen = yearForAge(16);
    expect(
      signupRequiresParentApproval({
        birthYear: under16,
        under16PathReached: false,
        referenceYear: REFERENCE_YEAR,
      }),
    ).toBe(true);
    expect(
      signupRequiresParentApproval({
        birthYear: sixteen,
        under16PathReached: true,
        referenceYear: REFERENCE_YEAR,
      }),
    ).toBe(true);

    const plan = planLearnerSignup({
      pickedCohort: "explorer",
      birthYear: sixteen,
      referenceYear: REFERENCE_YEAR,
      under16PathReached: true,
    });
    expect(plan).toMatchObject({
      cohort: "explorer",
      parentApprovalRequired: true,
      accountStatus: "PENDING_CONSENT",
      requiresLearnerEmail: false,
      requiresParentEmail: true,
      sendParentConsentEmail: true,
      sendLearnerWelcomeEmail: false,
    });
    expect(JSON.stringify(plan)).not.toContain(String(sixteen));
    expect(JSON.stringify(plan)).not.toContain(String(under16));
  });

  it("lets a 16-year-old Pathfinder skip every parent step", () => {
    const birthYear = yearForAge(16);
    const plan = planLearnerSignup({
      pickedCohort: "pathfinder",
      birthYear,
      referenceYear: REFERENCE_YEAR,
      requestedMarketingOptIn: true,
    });

    expect(plan).toEqual({
      cohort: "pathfinder",
      parentApprovalRequired: false,
      accountStatus: "ACTIVE",
      requiresLearnerEmail: true,
      requiresParentEmail: false,
      sendParentConsentEmail: false,
      sendLearnerWelcomeEmail: true,
      marketingOptIn: false,
    });
    expect(JSON.stringify(plan)).not.toContain(String(birthYear));
  });

  it("lets an 18-year-old agree without a parent and still keeps marketing off", () => {
    const plan = planLearnerSignup({
      pickedCohort: "maverick",
      birthYear: yearForAge(18),
      referenceYear: REFERENCE_YEAR,
      requestedMarketingOptIn: true,
    });
    expect(plan?.accountStatus).toBe("ACTIVE");
    expect(plan?.requiresParentEmail).toBe(false);
    expect(plan?.sendParentConsentEmail).toBe(false);
    expect(plan?.sendLearnerWelcomeEmail).toBe(true);
    expect(plan?.marketingOptIn).toBe(false);
  });
});

describe("16 and over have no parent step", () => {
  it.each([
    ["explorer", 16],
    ["explorer", 17],
    ["pathfinder", 16],
    ["pathfinder", 17],
    ["maverick", 16],
    ["maverick", 17],
  ] as const)("keeps a %s aged %s off parent approval", (pickedCohort, age) => {
    const plan = planLearnerSignup({
      pickedCohort,
      birthYear: yearForAge(age),
      referenceYear: REFERENCE_YEAR,
      requestedMarketingOptIn: true,
    });
    expect(plan?.parentApprovalRequired).toBe(false);
    expect(plan?.requiresParentEmail).toBe(false);
    expect(plan?.sendParentConsentEmail).toBe(false);
    expect(plan?.accountStatus).toBe("ACTIVE");
    expect(plan?.marketingOptIn).toBe(false);
  });
});

describe("16+ Explorer email is for password resets only", () => {
  it.each([16, 17, 18])("requires an email at age %s and sends nothing at sign-up", (age) => {
    const plan = planLearnerSignup({
      pickedCohort: "explorer",
      birthYear: yearForAge(age),
      referenceYear: REFERENCE_YEAR,
      requestedMarketingOptIn: true,
    });
    expect(plan).toMatchObject({
      cohort: "explorer",
      parentApprovalRequired: false,
      accountStatus: "ACTIVE",
      requiresLearnerEmail: true,
      requiresParentEmail: false,
      sendParentConsentEmail: false,
      sendLearnerWelcomeEmail: false,
      marketingOptIn: false,
    });
  });

  it("does not ask an under-16 Explorer for their own email", () => {
    const plan = planLearnerSignup({
      pickedCohort: "explorer",
      birthYear: yearForAge(15),
      referenceYear: REFERENCE_YEAR,
    });
    expect(plan?.requiresLearnerEmail).toBe(false);
    expect(plan?.requiresParentEmail).toBe(true);
    expect(plan?.sendParentConsentEmail).toBe(true);
    expect(plan?.sendLearnerWelcomeEmail).toBe(false);
  });

  it("keeps the existing email helper and stores a real address", () => {
    const form = readFileSync("components/onboarding/sign-up-form.tsx", "utf8");
    const account = readFileSync("lib/onboarding/create-supabase-account.ts", "utf8");
    expect(form).toContain("For account updates only. You log in with your username.");
    expect(form).not.toContain("For password resets only. You log in with your username.");
    expect(account).toContain("sendLearnerWelcomeEmail && learnerEmail");
    expect(account).not.toContain('cohort === "explorer" || parentInitiated || !learnerEmail');
  });
});

describe("marketing stays off for learners", () => {
  it("never shows the teen box, so 16-17 cannot opt in without a second age flag", () => {
    expect(LEARNER_MARKETING_CHECKBOX_VISIBLE).toBe(false);
    for (const age of [13, 14, 15, 16, 17, 18]) {
      expect(learnerMarketingOptIn(true)).toBe(false);
      const plan = planLearnerSignup({
        pickedCohort: "maverick",
        birthYear: yearForAge(age),
        referenceYear: REFERENCE_YEAR,
        requestedMarketingOptIn: true,
      });
      expect(plan?.marketingOptIn).toBe(false);
    }
  });

  it("removes the teen checkbox from the sign-up form and keeps the parent box", () => {
    const source = readFileSync("components/onboarding/sign-up-form.tsx", "utf8");
    expect(source).not.toContain("Send me occasional updates about NextGenAchiever$");
    expect(source).toContain("help me support my child&apos;s money skills journey");
  });
});

describe("who is asked for a birth year", () => {
  it("asks once at learner sign-up, including guest conversion, and never during guest play", () => {
    expect(collectsBirthYear("learner")).toBe(true);
    expect(collectsBirthYear("guest")).toBe(false);
    expect(collectsBirthYear("teacher")).toBe(false);
    expect(collectsBirthYear("class-seat")).toBe(false);
    expect(GUEST_SAVE_SIGN_UP_HREF).toBe(ONBOARDING_SIGN_UP_LEARNER_PATH);

    const picker = readFileSync(
      "components/onboarding/cohort-track-picker.tsx",
      "utf8",
    );
    const form = readFileSync("components/onboarding/sign-up-form.tsx", "utf8");
    expect(picker).not.toContain("LearnerBirthYearField");
    expect(picker).not.toContain("What year were you born?");
    expect(form).toContain("LearnerBirthYearField");
    expect(form).toContain("under16PathReached");
    const loadConsent = form.slice(
      form.indexOf("async function loadConsent"),
      form.indexOf("void loadConsent()"),
    );
    expect(loadConsent).not.toContain("approveConsentRequest");
  });

  it("writes no age columns for teachers, class seats, or guests", () => {
    const birthYear = yearForAge(12);
    for (const audience of ["teacher", "class-seat", "guest"] as const) {
      const columns = profileColumnsForAudience({
        audience,
        birthYear,
        checkedAt: "2026-10-21T12:00:00.000Z",
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
      checkedAt: "2026-10-21T12:00:00.000Z",
      referenceYear: REFERENCE_YEAR,
    });
    expect(columns).toEqual({
      parent_approval_required: false,
      age_checked_at: "2026-10-21T12:00:00.000Z",
    });
    expect(Object.keys(columns ?? {})).not.toContain("birth_year");
    expect(Object.keys(columns ?? {})).not.toContain("birthYear");
    expect(Object.keys(columns ?? {})).not.toContain("curriculum_cohort");
    expect(payloadStoresBirthYear(columns)).toBe(false);
    expect(JSON.stringify(columns)).not.toContain(String(birthYear));
  });

  it("keeps the suggested-track sentence available without storing a year", () => {
    expect(ageTrackFitMessage("explorer")).toBe(
      "Based on your age, Explorer is the right fit",
    );
  });
});
