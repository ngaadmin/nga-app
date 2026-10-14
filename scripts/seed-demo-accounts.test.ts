import { describe, expect, it } from "vitest";
import { readDemoSeedConfig } from "@/scripts/seed-demo-accounts";

const completeEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  DEMO_TEACHER_EMAIL: "teacher@example.com",
  DEMO_TEACHER_PASSWORD: "teacher-pass",
  DEMO_TEACHER_USERNAME: "demoteacher",
  DEMO_CLASS_PASSWORD: "class-pass",
  DEMO_STUDENT_EMAIL: "student@example.com",
  DEMO_STUDENT_PASSWORD: "student-pass",
  DEMO_STUDENT_USERNAME: "demostudent",
};

describe("readDemoSeedConfig", () => {
  it("refuses to start when a credential is missing", () => {
    expect(() => readDemoSeedConfig({})).toThrow(/Missing/);
  });

  it("reads logins from the environment and does not invent them", () => {
    const config = readDemoSeedConfig(completeEnv);
    expect(config.teacherUsername).toBe("demoteacher");
    expect(config.studentUsername).toBe("demostudent");
    expect(config.classSize).toBe(5);
    expect(config.dayStreak).toBe(3);
  });
});
