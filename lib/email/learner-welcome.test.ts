import { afterEach, beforeEach, describe, expect, it } from "vitest";
import legacy from "@/lib/email/__fixtures__/learner-welcome-legacy.json";
import {
  buildLearnerWelcomeEmail,
  buildOnboardingEmail,
  type BuiltEmail,
  type LearnerWelcomeCohort,
} from "@/lib/email/templates";

/**
 * The fixture holds the exact subject, preheader, html and text the former
 * buildPathfinderWelcomeEmail and buildMaverickWelcomeEmail produced at
 * origin/main 71df51a. The merged template must match them byte for byte.
 */
type LegacyCase = {
  username: string;
  appUrl: string | null;
  pathfinder: BuiltEmail;
  maverick: BuiltEmail;
};

const CASES = (legacy as { cases: LegacyCase[] }).cases;
const COHORTS: LearnerWelcomeCohort[] = ["pathfinder", "maverick"];

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "NEXT_PUBLIC_VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function exact(built: BuiltEmail): BuiltEmail {
  return {
    subject: built.subject,
    preheader: built.preheader,
    html: built.html,
    text: built.text,
  };
}

describe("learner welcome email (merged Pathfinder + Maverick template)", () => {
  it("has legacy fixtures for both cohorts", () => {
    expect(CASES.length).toBeGreaterThan(0);
    expect(CASES[0]?.pathfinder.preheader).toBe(
      "Your Pathfinder account is ready. Jump into Academy.",
    );
    expect(CASES[0]?.maverick.preheader).toBe(
      "Your Maverick account is ready. Jump into Academy.",
    );
  });

  for (const cohort of COHORTS) {
    it(`renders ${cohort} byte-identical to the old builder`, () => {
      for (const c of CASES) {
        const appUrl = c.appUrl ?? undefined;
        const expected = c[cohort];
        const built = buildLearnerWelcomeEmail(
          { username: c.username, cohort },
          appUrl,
        );
        expect(exact(built)).toStrictEqual(expected);
        expect(built.subject === expected.subject).toBe(true);
        expect(built.preheader === expected.preheader).toBe(true);
        expect(built.html === expected.html).toBe(true);
        expect(built.text === expected.text).toBe(true);

        expect(
          exact(
            buildOnboardingEmail(
              "LEARNER_WELCOME",
              { username: c.username, cohort },
              appUrl,
            ),
          ),
        ).toStrictEqual(expected);
      }
    });
  }

  it("keeps PATHFINDER_WELCOME and MAVERICK_WELCOME as aliases of the merged template", () => {
    for (const c of CASES) {
      const appUrl = c.appUrl ?? undefined;
      expect(
        exact(buildOnboardingEmail("PATHFINDER_WELCOME", { username: c.username }, appUrl)),
      ).toStrictEqual(c.pathfinder);
      expect(
        exact(buildOnboardingEmail("MAVERICK_WELCOME", { username: c.username }, appUrl)),
      ).toStrictEqual(c.maverick);
    }
  });

  it("fills the cohort name into the username fallback", () => {
    expect(
      buildLearnerWelcomeEmail({ username: "  ", cohort: "pathfinder" }).subject,
    ).toBe("Welcome to NextGenAchiever$, Pathfinder");
    expect(
      buildLearnerWelcomeEmail({ username: "", cohort: "maverick" }).subject,
    ).toBe("Welcome to NextGenAchiever$, Maverick");
  });

  it("rejects a cohort that has no welcome email", () => {
    expect(() =>
      buildLearnerWelcomeEmail({
        username: "River",
        cohort: "explorer" as unknown as LearnerWelcomeCohort,
      }),
    ).toThrow(/Unsupported learner welcome cohort/);
  });
});
