/**
 * Create a demo teacher class and one student who has finished Lessons 1–3.
 *
 * Does not run unless you execute this file. Credentials come from the
 * environment only — nothing in this file is a password or a service key.
 *
 * Required:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
 *   DEMO_TEACHER_EMAIL
 *   DEMO_TEACHER_PASSWORD
 *   DEMO_TEACHER_USERNAME
 *   DEMO_CLASS_PASSWORD
 *   DEMO_STUDENT_EMAIL
 *   DEMO_STUDENT_PASSWORD
 *   DEMO_STUDENT_USERNAME
 *
 * Optional:
 *   DEMO_CLASS_SIZE   default 5 (includes the progressed student)
 *   DEMO_STUDENT_STREAK   default 3
 *
 *   npx tsx scripts/seed-demo-accounts.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import { pickClassSeatUsernames } from "@/lib/school/class-usernames";
import { buildDemoLearnerProgress } from "@/scripts/demo-learner-progress";

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{2,20}$/;
const SEAT_AUTH_EMAIL_DOMAIN = "users.nextgenachievers.invalid";
const DEFAULT_CLASS_SIZE = 5;
const DEFAULT_STREAK = 3;

type SeedConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  teacherEmail: string;
  teacherPassword: string;
  teacherUsername: string;
  classPassword: string;
  studentEmail: string;
  studentPassword: string;
  studentUsername: string;
  classSize: number;
  dayStreak: number;
};

export function readDemoSeedConfig(
  env: Record<string, string | undefined>,
): SeedConfig {
  const supabaseUrl = text(env.SUPABASE_URL) || text(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey =
    text(env.SUPABASE_SERVICE_ROLE_KEY) || text(env.SUPABASE_SECRET_KEY);
  const teacherEmail = text(env.DEMO_TEACHER_EMAIL).toLowerCase();
  const teacherPassword = text(env.DEMO_TEACHER_PASSWORD);
  const teacherUsername = text(env.DEMO_TEACHER_USERNAME);
  const classPassword = text(env.DEMO_CLASS_PASSWORD);
  const studentEmail = text(env.DEMO_STUDENT_EMAIL).toLowerCase();
  const studentPassword = text(env.DEMO_STUDENT_PASSWORD);
  const studentUsername = text(env.DEMO_STUDENT_USERNAME);
  const classSize = integer(env.DEMO_CLASS_SIZE, DEFAULT_CLASS_SIZE);
  const dayStreak = integer(env.DEMO_STUDENT_STREAK, DEFAULT_STREAK);

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  if (!teacherEmail) missing.push("DEMO_TEACHER_EMAIL");
  if (!teacherPassword) missing.push("DEMO_TEACHER_PASSWORD");
  if (!teacherUsername) missing.push("DEMO_TEACHER_USERNAME");
  if (!classPassword) missing.push("DEMO_CLASS_PASSWORD");
  if (!studentEmail) missing.push("DEMO_STUDENT_EMAIL");
  if (!studentPassword) missing.push("DEMO_STUDENT_PASSWORD");
  if (!studentUsername) missing.push("DEMO_STUDENT_USERNAME");
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")}.`);
  }

  if (!emailOk(teacherEmail) || !emailOk(studentEmail)) {
    throw new Error("DEMO_TEACHER_EMAIL and DEMO_STUDENT_EMAIL must be email addresses.");
  }
  if (teacherEmail === studentEmail) {
    throw new Error("DEMO_TEACHER_EMAIL and DEMO_STUDENT_EMAIL must be different.");
  }
  if (teacherPassword.length < 6 || studentPassword.length < 6 || classPassword.length < 6) {
    throw new Error("Demo passwords need at least 6 characters.");
  }
  if (!USERNAME_PATTERN.test(teacherUsername) || !USERNAME_PATTERN.test(studentUsername)) {
    throw new Error("Demo usernames must be 2–20 letters, numbers, _ or -.");
  }
  if (teacherUsername.toLowerCase() === studentUsername.toLowerCase()) {
    throw new Error("DEMO_TEACHER_USERNAME and DEMO_STUDENT_USERNAME must be different.");
  }
  if (!Number.isInteger(classSize) || classSize < 1 || classSize > 30) {
    throw new Error("DEMO_CLASS_SIZE must be a whole number from 1 to 30.");
  }
  if (!Number.isInteger(dayStreak) || dayStreak < 1 || dayStreak > 365) {
    throw new Error("DEMO_STUDENT_STREAK must be a whole number from 1 to 365.");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    teacherEmail,
    teacherPassword,
    teacherUsername,
    classPassword,
    studentEmail,
    studentPassword,
    studentUsername,
    classSize,
    dayStreak,
  };
}

function text(value: string | undefined): string {
  return value?.trim() ?? "";
}

function integer(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  return Number(value);
}

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function findAuthUserId(
  config: SeedConfig,
  email: string,
): Promise<string | null> {
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Could not look up ${email} (${response.status}).`);
  }
  const json = (await response.json()) as {
    users?: Array<{ id?: string; email?: string }>;
    id?: string;
    email?: string;
  };
  if (Array.isArray(json.users)) {
    return (
      json.users.find((user) => user.email?.trim().toLowerCase() === email)?.id ??
      null
    );
  }
  if (json.email?.trim().toLowerCase() === email && json.id) return json.id;
  return null;
}

async function ensureAuthUser(
  admin: SupabaseClient,
  config: SeedConfig,
  input: { email: string; password: string; metadata: Record<string, unknown> },
): Promise<string> {
  const existing = await findAuthUserId(config, input.email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing, {
      password: input.password,
      email_confirm: true,
      user_metadata: input.metadata,
    });
    if (error) throw new Error(error.message);
    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: input.metadata,
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? `Could not create ${input.email}.`);
  }
  return data.user.id;
}

async function main(): Promise<void> {
  const config = readDemoSeedConfig(process.env as Record<string, string | undefined>);
  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const birthYear = representativeBirthYearForCohort("explorer");
  const consentedAt = new Date().toISOString();

  const teacherId = await ensureAuthUser(admin, config, {
    email: config.teacherEmail,
    password: config.teacherPassword,
    metadata: { isTeacher: true },
  });
  const { error: teacherError } = await admin
    .from("profiles")
    .update({
      username: config.teacherUsername,
      birth_year: null,
      account_role: "teacher",
      account_status: "active",
      curriculum_cohort: null,
      marketing_opt_in: false,
      consent_approved_at: consentedAt,
      is_teacher: true,
      seat_cap: 30,
      class_password: config.classPassword,
      class_cohort: "explorer",
      teacher_id: null,
    })
    .eq("id", teacherId);
  if (teacherError) throw new Error(teacherError.message);

  const studentId = await ensureAuthUser(admin, config, {
    email: config.studentEmail,
    password: config.studentPassword,
    metadata: { username: config.studentUsername, classSeat: true },
  });
  const { error: studentError } = await admin
    .from("profiles")
    .update({
      username: config.studentUsername,
      birth_year: birthYear,
      account_role: "child",
      account_status: "active",
      curriculum_cohort: "explorer",
      marketing_opt_in: false,
      consent_approved_at: consentedAt,
      is_teacher: false,
      teacher_id: teacherId,
    })
    .eq("id", studentId);
  if (studentError) throw new Error(studentError.message);

  const progress = buildDemoLearnerProgress(config.dayStreak, new Date());
  const { error: progressError } = await admin.from("learner_progress").upsert(
    {
      user_id: studentId,
      payload: progress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (progressError) throw new Error(progressError.message);

  const { data: seats, error: seatsError } = await admin
    .from("profiles")
    .select("id, username")
    .eq("teacher_id", teacherId)
    .eq("is_teacher", false);
  if (seatsError) throw new Error(seatsError.message);

  const seatCount = seats?.length ?? 0;
  const toCreate = Math.max(0, config.classSize - seatCount);
  const { data: existingNames, error: namesError } = await admin
    .from("profiles")
    .select("username");
  if (namesError) throw new Error(namesError.message);
  const taken = (existingNames ?? [])
    .map((row) => (typeof row.username === "string" ? row.username : ""))
    .filter(Boolean);
  const names = pickClassSeatUsernames(taken, toCreate);
  if (names.length < toCreate) {
    throw new Error("Not enough unique class logins left.");
  }

  for (const username of names) {
    const email = `seat+${crypto.randomUUID()}@${SEAT_AUTH_EMAIL_DOMAIN}`;
    const seatId = await ensureAuthUser(admin, config, {
      email,
      password: config.classPassword,
      metadata: { username, classSeat: true },
    });
    const { error } = await admin
      .from("profiles")
      .update({
        username,
        birth_year: birthYear,
        account_role: "child",
        account_status: "active",
        curriculum_cohort: "explorer",
        marketing_opt_in: false,
        consent_approved_at: consentedAt,
        is_teacher: false,
        teacher_id: teacherId,
      })
      .eq("id", seatId);
    if (error) throw new Error(error.message);
  }

  console.log(
    `Demo class ready. Teacher ${config.teacherUsername} has ${seatCount + names.length} students. ${config.studentUsername} has lessons 1–3 complete.`,
  );
}

const invokedDirectly =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
