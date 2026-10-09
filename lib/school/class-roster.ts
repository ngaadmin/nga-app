"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { pickClassSeatUsernames } from "@/lib/school/class-usernames";
import { generateClassPassword } from "@/lib/school/class-password";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import {
  parseMasteryCohort,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

const SEAT_AUTH_EMAIL_DOMAIN = "users.nextgenachievers.invalid";
const MIN_PASSWORD_LENGTH = 6;

export type ClassRosterSnapshot = {
  teacherId: string;
  seatCap: number;
  seatsUsed: number;
  classPassword: string;
  classCohort: MasteryCohort | null;
  usernames: string[];
};

async function requireTeacherId(): Promise<
  { ok: true; teacherId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
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

export async function loadClassRoster(): Promise<
  { ok: true; roster: ClassRosterSnapshot } | { ok: false; error: string }
> {
  const access = await requireTeacherId();
  if (!access.ok) return access;

  try {
    const admin = createAdminClient();
    const withCohort = await admin
      .from("profiles")
      .select("id, seat_cap, class_password, class_cohort")
      .eq("id", access.teacherId)
      .maybeSingle();
    const teacherQuery =
      withCohort.error && /class_cohort|does not exist/i.test(withCohort.error.message)
        ? await admin
            .from("profiles")
            .select("id, seat_cap, class_password")
            .eq("id", access.teacherId)
            .maybeSingle()
        : withCohort;
    const teacher = teacherQuery.data as
      | {
          id: string;
          seat_cap?: number | null;
          class_password?: string | null;
          class_cohort?: string | null;
        }
      | null;

    if (teacherQuery.error || !teacher?.id) {
      return { ok: false, error: "Could not load the class page." };
    }

    const { data: seats, error: seatsError } = await admin
      .from("profiles")
      .select("username, curriculum_cohort")
      .eq("teacher_id", access.teacherId)
      .eq("is_teacher", false)
      .order("username", { ascending: true });

    if (seatsError) {
      return { ok: false, error: seatsError.message };
    }

    const usernames = (seats ?? [])
      .map((row) => (typeof row.username === "string" ? row.username.trim() : ""))
      .filter(Boolean);

    const storedCohort = parseMasteryCohort(teacher.class_cohort);
    const inferredFromSeats = (seats ?? [])
      .map((row) => parseMasteryCohort(row.curriculum_cohort))
      .find((cohort): cohort is MasteryCohort => cohort != null);
    const classCohort = storedCohort ?? inferredFromSeats ?? null;

    if (!storedCohort && classCohort) {
      await admin
        .from("profiles")
        .update({ class_cohort: classCohort })
        .eq("id", access.teacherId)
        .eq("is_teacher", true);
    }

    let classPassword =
      typeof teacher.class_password === "string" ? teacher.class_password.trim() : "";
    const looksRandom =
      /^[A-Za-z0-9]{8,12}$/.test(classPassword) &&
      /[0-9]/.test(classPassword) &&
      /[a-z]/.test(classPassword) &&
      /[A-Z]/.test(classPassword);
    if (!classPassword || (looksRandom && usernames.length === 0)) {
      classPassword = generateClassPassword();
      await admin
        .from("profiles")
        .update({ class_password: classPassword })
        .eq("id", access.teacherId)
        .eq("is_teacher", true);
    }

    return {
      ok: true,
      roster: {
        teacherId: access.teacherId,
        seatCap: teacher.seat_cap ?? 30,
        seatsUsed: usernames.length,
        classPassword,
        classCohort,
        usernames,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not load the class page.",
    };
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

  const admin = createAdminClient();
  const { error: teacherError } = await admin
    .from("profiles")
    .update({ class_password: password })
    .eq("id", access.teacherId)
    .eq("is_teacher", true);

  if (teacherError) {
    return { ok: false, error: teacherError.message };
  }

  const { data: seats, error: seatsError } = await admin
    .from("profiles")
    .select("id")
    .eq("teacher_id", access.teacherId)
    .eq("is_teacher", false);

  if (seatsError) {
    return { ok: false, error: seatsError.message };
  }

  for (const seat of seats ?? []) {
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
