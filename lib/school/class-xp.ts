/**
 * Class lifetime XP totals.
 * Pure: no database and no session lookup. Callers pass the teacher id
 * taken from the server session, plus rows already limited to that teacher.
 * A class id or teacher id that arrived from the browser is not an input.
 */

export type ClassOwnership = {
  classId: string;
  teacherId: string;
  label: string;
};

export type ClassStudentXpSource = {
  classId: string;
  teacherId: string;
  userId: string;
  username: string;
  /** `wallet.lifetimePointsEarned` when that field is present. */
  lifetimeXp: number | null;
  /** `wallet.totalPoints`, the live balance that drops when coins are cashed in. */
  liveBalance: number | null;
};

export type ClassStudentXp = {
  username: string;
  lifetimeXp: number;
};

export type ClassXpTotal = {
  classId: string;
  label: string;
  totalLifetimeXp: number;
  students: ClassStudentXp[];
};

function cleanId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Finite and zero or above. Anything else counts as missing. */
function coerceXp(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}

function numericOrNull(value: unknown): number | null {
  return typeof value === "number" ? coerceXp(value) : null;
}

/**
 * Lifetime XP for one student.
 * Uses lifetime points when they are saved. When that field is missing,
 * falls back to the live balance. When both exist, the higher one wins so
 * a cash-in (live balance drops) does not shrink the class total, and a
 * wallet saved before lifetime XP existed still counts.
 */
export function resolveStudentLifetimeXp(input: {
  lifetimeXp: number | null | undefined;
  liveBalance: number | null | undefined;
}): number {
  const lifetime = coerceXp(input.lifetimeXp);
  const live = coerceXp(input.liveBalance);
  if (lifetime == null) return live ?? 0;
  if (live == null) return lifetime;
  return Math.max(lifetime, live);
}

/** Read XP fields from a learner_progress payload. Missing lifetime stays null. */
export function readLearnerXpFields(payload: unknown): {
  lifetimeXp: number | null;
  liveBalance: number | null;
} {
  let value = payload;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return { lifetimeXp: null, liveBalance: null };
    }
  }
  if (!isRecord(value) || !isRecord(value.wallet)) {
    return { lifetimeXp: null, liveBalance: null };
  }
  return {
    lifetimeXp: numericOrNull(value.wallet.lifetimePointsEarned),
    liveBalance: numericOrNull(value.wallet.totalPoints),
  };
}

/**
 * Classes this teacher owns, with each class total equal to the sum of
 * its students' lifetime XP.
 * Rows for any other teacher are dropped, even when their class id matches
 * a class this teacher owns.
 */
export function aggregateOwnedClassXp(input: {
  sessionTeacherId: string | null | undefined;
  classes: readonly ClassOwnership[];
  students: readonly ClassStudentXpSource[];
}): ClassXpTotal[] {
  const sessionTeacherId = cleanId(input.sessionTeacherId);
  if (!sessionTeacherId) return [];

  const owned = input.classes.filter((row) => {
    return (
      cleanId(row.teacherId) === sessionTeacherId && cleanId(row.classId).length > 0
    );
  });
  const ownedClassIds = new Set(owned.map((row) => cleanId(row.classId)));

  return owned.map((row) => {
    const classId = cleanId(row.classId);
    const byUser = new Map<string, ClassStudentXp>();

    for (const student of input.students) {
      if (cleanId(student.teacherId) !== sessionTeacherId) continue;
      if (cleanId(student.classId) !== classId) continue;
      if (!ownedClassIds.has(classId)) continue;

      const userId = cleanId(student.userId);
      const username = student.username.trim();
      if (!userId || !username) continue;

      const lifetimeXp = resolveStudentLifetimeXp(student);
      const existing = byUser.get(userId);
      if (!existing || lifetimeXp > existing.lifetimeXp) {
        byUser.set(userId, { username, lifetimeXp });
      }
    }

    const students = [...byUser.values()].sort((left, right) =>
      left.username.localeCompare(right.username),
    );
    const totalLifetimeXp = students.reduce(
      (sum, student) => sum + student.lifetimeXp,
      0,
    );

    return {
      classId,
      label: row.label.trim() || "Your class",
      totalLifetimeXp,
      students,
    };
  });
}
