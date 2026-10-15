"use server";

import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { pickClassSeatUsernames } from "@/lib/school/class-usernames";
import { generateClassPassword } from "@/lib/school/class-password";
import {
  CLASS_PASSWORD_COLUMN_DENIED,
  CLASS_PASSWORD_COLUMN_MISSING,
  classPasswordCipherUpdate,
  explainClassPasswordWriteError,
  planClassPasswordBackfill,
  type ClassPasswordBackfillWrite,
} from "@/lib/school/class-password-crypto";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import {
  masteryCohortLabel,
  parseMasteryCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { readLearnerProgressPayloads } from "@/lib/onboarding/learner-progress-store";
import {
  aggregateOwnedClassXp,
  readLearnerXpFields,
  type ClassXpTotal,
} from "@/lib/school/class-xp";

const SEAT_AUTH_EMAIL_DOMAIN = "users.nextgenachievers.invalid";
const MIN_PASSWORD_LENGTH = 6;

export type ClassRosterSnapshot = {
  teacherId: string;
  seatCap: number;
  seatsUsed: number;
  classPassword: string;
  classCohort: MasteryCohort | null;
  usernames: string[];
  /** Lifetime XP for each class this teacher owns. Computed on the server. */
  classes: ClassXpTotal[];
};

const readSignedInUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id?.trim() ?? "";
  return userId || null;
});

async function requireTeacherId(): Promise<
  { ok: true; teacherId: string } | { ok: false; error: string }
> {
  const userId = await readSignedInUserId();
  if (!userId) {
    return { ok: false, error: "Sign in as a teacher to open the class page." };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, is_teacher, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (
    error ||
    !profile?.id ||
    profile.is_teacher !== true ||
    profile.account_status !== "active"
  ) {
    return { ok: false, error: "Only a confirmed teacher can open the class page." };
  }

  return { ok: true, teacherId: profile.id };
}

function isMissingColumn(
  error: { message?: string } | null | undefined,
  column: string,
): boolean {
  const message = error?.message ?? "";
  if (!message) return false;
  if (!new RegExp(`\\b${column}\\b`, "i").test(message)) return false;
  return /does not exist|schema cache|could not find/i.test(message);
}

function isPasswordColumnDenied(
  error: { message?: string } | null | undefined,
): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("permission denied") && message.includes("class_password");
}

type TeacherClassRow = {
  id: string;
  is_teacher?: boolean | null;
  account_status?: string | null;
  seat_cap?: number | null;
  class_password?: string | null;
  class_password_enc?: string | null;
  class_cohort?: string | null;
};

function passwordColumnError(
  error: { message?: string } | null | undefined,
): string | null {
  if (isPasswordColumnDenied(error)) return CLASS_PASSWORD_COLUMN_DENIED;
  if (isMissingColumn(error, "class_password_enc")) return CLASS_PASSWORD_COLUMN_MISSING;
  return null;
}

async function readTeacherClassRow(
  admin: ReturnType<typeof createAdminClient>,
  teacherId: string,
): Promise<{ ok: true; teacher: TeacherClassRow } | { ok: false; error: string }> {
  const withCohort = await admin
    .from("profiles")
    .select(
      "id, is_teacher, account_status, seat_cap, class_password, class_password_enc, class_cohort",
    )
    .eq("id", teacherId)
    .maybeSingle();

  const denied = passwordColumnError(withCohort.error);
  if (denied) {
    console.error("[class-password]", denied);
    return { ok: false, error: denied };
  }

  const teacherQuery =
    withCohort.error && isMissingColumn(withCohort.error, "class_cohort")
      ? await admin
          .from("profiles")
          .select(
            "id, is_teacher, account_status, seat_cap, class_password, class_password_enc",
          )
          .eq("id", teacherId)
          .maybeSingle()
      : withCohort;

  const retryDenied = passwordColumnError(teacherQuery.error);
  if (retryDenied) {
    console.error("[class-password]", retryDenied);
    return { ok: false, error: retryDenied };
  }

  const teacher = teacherQuery.data as TeacherClassRow | null;
  if (teacherQuery.error || !teacher?.id) {
    return { ok: false, error: "Could not load the class page." };
  }
  if (teacher.is_teacher !== true || teacher.account_status !== "active") {
    return { ok: false, error: "Only a confirmed teacher can open the class page." };
  }
  return { ok: true, teacher };
}

function logClassPageTiming(timing: {
  authMs: number;
  rosterMs: number;
  followMs: number;
  totalMs: number;
  seats: number;
  writes: number;
  password: "set" | "missing";
}) {
  console.info("[class-page:timing]", {
    authMs: Math.round(timing.authMs),
    rosterMs: Math.round(timing.rosterMs),
    followMs: Math.round(timing.followMs),
    totalMs: Math.round(timing.totalMs),
    seats: timing.seats,
    writes: timing.writes,
    password: timing.password,
  });
}

/**
 * Service-role write. `class_password` is always null in `write`.
 * The plaintext return value of loadClassRoster is the only copy sent to a
 * browser, and only for this signed-in teacher's class page.
 */
async function writeOwnedClassPassword(
  admin: ReturnType<typeof createAdminClient>,
  teacherId: string,
  write: ClassPasswordBackfillWrite,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin
    .from("profiles")
    .update(write)
    .eq("id", teacherId)
    .eq("is_teacher", true);

  if (error) {
    const message = explainClassPasswordWriteError(error.message);
    console.error(
      "[class-password]",
      message === CLASS_PASSWORD_COLUMN_MISSING ? message : "write failed",
    );
    return { ok: false, error: message };
  }

  console.info(
    "class_password_enc" in write
      ? "[class-password] stored ciphertext and cleared plaintext"
      : "[class-password] cleared plaintext class_password",
    { teacherId },
  );
  return { ok: true };
}

/**
 * One class per teacher today: the class id is that teacher's profile id.
 * Seats are already limited to teacher_id = the signed-in teacher.
 * No class id or teacher id from the browser is read here.
 */
async function loadOwnedClassXp(input: {
  teacherId: string;
  label: string;
  seats: readonly { userId: string; username: string }[];
}): Promise<ClassXpTotal[]> {
  const teacherId = input.teacherId.trim();
  if (!teacherId) return [];

  let payloads = new Map<string, unknown>();
  try {
    payloads = await readLearnerProgressPayloads(
      input.seats.map((seat) => seat.userId),
    );
  } catch (error) {
    console.info("[class-xp]", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  return aggregateOwnedClassXp({
    sessionTeacherId: teacherId,
    classes: [{ classId: teacherId, teacherId, label: input.label }],
    students: input.seats.map((seat) => {
      const xp = readLearnerXpFields(payloads.get(seat.userId));
      return {
        classId: teacherId,
        teacherId,
        userId: seat.userId,
        username: seat.username,
        lifetimeXp: xp.lifetimeXp,
        liveBalance: xp.liveBalance,
      };
    }),
  });
}

export async function loadClassRoster(): Promise<
  { ok: true; roster: ClassRosterSnapshot } | { ok: false; error: string }
> {
  const started = performance.now();
  const authStarted = started;
  const userId = await readSignedInUserId();
  const authMs = performance.now() - authStarted;
  if (!userId) {
    return { ok: false, error: "Sign in as a teacher to open the class page." };
  }

  try {
    const admin = createAdminClient();
    const rosterStarted = performance.now();
    const teacherPromise = readTeacherClassRow(admin, userId);
    const seatsPromise = admin
      .from("profiles")
      .select("id, username, curriculum_cohort")
      .eq("teacher_id", userId)
      .eq("is_teacher", false)
      .order("username", { ascending: true });
    const [teacherResult, seatsResult] = await Promise.all([
      teacherPromise,
      seatsPromise,
    ]);
    const rosterMs = performance.now() - rosterStarted;
    if (!teacherResult.ok) return teacherResult;

    const { error: seatsError, data: seats } = seatsResult;
    if (seatsError) {
      return { ok: false, error: seatsError.message };
    }

    const teacher = teacherResult.teacher;
    const seatRecords = (seats ?? []).flatMap((row) => {
      const seatUserId = typeof row.id === "string" ? row.id.trim() : "";
      const username = typeof row.username === "string" ? row.username.trim() : "";
      if (!seatUserId || !username) return [];
      return [
        {
          userId: seatUserId,
          username,
          curriculumCohort: row.curriculum_cohort,
        },
      ];
    });
    const usernames = seatRecords.map((seat) => seat.username);

    const storedCohort = parseMasteryCohort(teacher.class_cohort);
    const inferredFromSeats = seatRecords
      .map((row) => parseMasteryCohort(row.curriculumCohort))
      .find((cohort): cohort is MasteryCohort => cohort != null);
    const classCohort = storedCohort ?? inferredFromSeats ?? null;

    let classPassword = "";
    let passwordWrite: ClassPasswordBackfillWrite | null = null;
    try {
      const stored = planClassPasswordBackfill(
        {
          class_password: teacher.class_password,
          class_password_enc: teacher.class_password_enc,
        },
        userId,
      );
      classPassword = stored.password.trim();
      passwordWrite = stored.write;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read the class password.";
      console.error("[class-password]", "read failed");
      return { ok: false, error: message };
    }

    const looksRandom =
      /^[A-Za-z0-9]{8,12}$/.test(classPassword) &&
      /[0-9]/.test(classPassword) &&
      /[a-z]/.test(classPassword) &&
      /[A-Z]/.test(classPassword);
    const replacePassword = !classPassword || (looksRandom && usernames.length === 0);
    if (replacePassword) {
      classPassword = generateClassPassword();
      passwordWrite = classPasswordCipherUpdate(classPassword, userId);
    }

    const followups: Promise<void>[] = [];
    if (!storedCohort && classCohort) {
      followups.push(
        Promise.resolve(
          admin
            .from("profiles")
            .update({ class_cohort: classCohort })
            .eq("id", userId)
            .eq("is_teacher", true)
            .then(({ error }) => {
              if (error) console.info("[class-page]", { cohortWrite: "failed" });
            }),
        ),
      );
    }

    const followStarted = performance.now();
    const [classes, saved] = await Promise.all([
      loadOwnedClassXp({
        teacherId: userId,
        label: classCohort ? `${masteryCohortLabel(classCohort)} class` : "Your class",
        seats: seatRecords,
      }),
      passwordWrite
        ? writeOwnedClassPassword(admin, userId, passwordWrite)
        : Promise.resolve({ ok: true as const }),
      Promise.all(followups),
    ]);
    const followMs = performance.now() - followStarted;
    if (!saved.ok) return saved;

    logClassPageTiming({
      authMs,
      rosterMs,
      followMs,
      totalMs: performance.now() - started,
      seats: usernames.length,
      writes: (passwordWrite ? 1 : 0) + followups.length,
      password: classPassword ? "set" : "missing",
    });

    return {
      ok: true,
      roster: {
        teacherId: userId,
        seatCap: teacher.seat_cap ?? 30,
        seatsUsed: usernames.length,
        classPassword,
        classCohort,
        usernames,
        classes,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the class page.";
    console.error("[class-roster]", "load failed");
    return { ok: false, error: message };
  }
}

export async function saveClassCohort(
  cohort: MasteryCohort,
): Promise<{ ok: true; classCohort: MasteryCohort } | { ok: false; error: string }> {
  const parsed = parseMasteryCohort(cohort);
  if (!parsed) {
    return { ok: false, error: "Pick Explorer, Pathfinder or Maverick." };
  }

  const access = await requireTeacherId();
  if (!access.ok) return access;

  const current = await loadClassRoster();
  if (!current.ok) return current;

  if (
    current.roster.seatsUsed > 0 &&
    current.roster.classCohort &&
    current.roster.classCohort !== parsed
  ) {
    return {
      ok: false,
      error: "This class already has students on another track.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ class_cohort: parsed })
    .eq("id", access.teacherId)
    .eq("is_teacher", true);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, classCohort: parsed };
}

export async function createClassSeats(input: {
  count: number;
  classPassword?: string;
  cohort?: MasteryCohort | null;
}): Promise<
  { ok: true; created: string[] } | { ok: false; error: string }
> {
  const access = await requireTeacherId();
  if (!access.ok) return access;

  const requested = Math.floor(input.count);
  if (!Number.isFinite(requested) || requested < 1) {
    return { ok: false, error: "Enter how many students." };
  }

  const admin = createAdminClient();
  const current = await loadClassRoster();
  if (!current.ok) return current;

  const remaining = current.roster.seatCap - current.roster.seatsUsed;
  if (remaining <= 0) {
    return { ok: false, error: "This class has no students left." };
  }
  const requestedCohort = parseMasteryCohort(input.cohort);
  if (requestedCohort && requestedCohort !== current.roster.classCohort) {
    const saved = await saveClassCohort(requestedCohort);
    if (!saved.ok) return saved;
    current.roster.classCohort = saved.classCohort;
  }
  const classCohort = current.roster.classCohort;
  if (!classCohort) {
    return {
      ok: false,
      error: "Pick Explorer, Pathfinder or Maverick before adding students.",
    };
  }
  const toCreate = Math.min(requested, remaining);
  const typedPassword = input.classPassword?.trim() ?? "";
  let classPassword = current.roster.classPassword;
  if (
    typedPassword.length >= MIN_PASSWORD_LENGTH &&
    typedPassword !== classPassword
  ) {
    const saved = await changeClassPassword(typedPassword);
    if (!saved.ok) return saved;
    classPassword = typedPassword;
  } else if (typedPassword.length >= MIN_PASSWORD_LENGTH) {
    classPassword = typedPassword;
  }
  if (!classPassword || classPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: "Type a class password so students can log in.",
    };
  }

  const { data: existingRows } = await admin.from("profiles").select("username");
  const taken = (existingRows ?? [])
    .map((row) => (typeof row.username === "string" ? row.username : ""))
    .filter(Boolean);
  const names = pickClassSeatUsernames(taken, toCreate);
  if (names.length < toCreate) {
    return { ok: false, error: "Not enough unique logins left. Try fewer students." };
  }

  const created: string[] = [];
  const birthYear = representativeBirthYearForCohort(classCohort);

  for (const username of names) {
    const authEmail = `seat+${crypto.randomUUID()}@${SEAT_AUTH_EMAIL_DOMAIN}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: authEmail,
      password: classPassword,
      email_confirm: true,
      user_metadata: { username, classSeat: true },
    });
    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message || `Could not create ${username}.`,
      };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        username,
        birth_year: birthYear,
        account_role: "child",
        account_status: "active",
        curriculum_cohort: classCohort,
        marketing_opt_in: false,
        is_teacher: false,
        teacher_id: access.teacherId,
        consent_approved_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return {
        ok: false,
        error: profileError.message || `Could not save ${username}.`,
      };
    }

    created.push(username);
  }

  return { ok: true, created };
}

export async function changeClassPassword(nextPassword: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const access = await requireTeacherId();
  if (!access.ok) return access;

  const password = nextPassword.trim();
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "Use at least 6 characters for the class password." };
  }

  let columns;
  try {
    columns = classPasswordCipherUpdate(password, access.teacherId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the class password.";
    console.error("[class-password]", message);
    return { ok: false, error: message };
  }

  const admin = createAdminClient();
  const saved = await writeOwnedClassPassword(admin, access.teacherId, columns);
  if (!saved.ok) return saved;

  const { data: seats, error: seatsError } = await admin
    .from("profiles")
    .select("id")
    .eq("teacher_id", access.teacherId)
    .eq("is_teacher", false);

  if (seatsError) {
    return { ok: false, error: seatsError.message };
  }

  for (const seat of seats ?? []) {
    // Auth keeps its own secret for username + class password sign-in.
    const { error } = await admin.auth.admin.updateUserById(seat.id, {
      password,
    });
    if (error) {
      return {
        ok: false,
        error: "Saved the class password, but could not update every seat login. Try again.",
      };
    }
  }

  return { ok: true };
}
