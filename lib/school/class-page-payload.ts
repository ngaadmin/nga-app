/** Shape returned by public.load_teacher_class_page(). */

export type TeacherClassPageSeat = {
  id: string;
  username: string;
  curriculumCohort: string | null;
  payload: unknown;
};

export type TeacherClassPage =
  | { error: "signed_out" }
  | { error: "not_teacher" }
  | {
      error: null;
      id: string;
      isTeacher: boolean;
      accountStatus: string | null;
      seatCap: number | null;
      classPassword: string | null;
      classPasswordEnc: string | null;
      classCohort: string | null;
      seats: TeacherClassPageSeat[];
    };

function textOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseTeacherClassPage(data: unknown): TeacherClassPage | null {
  let value = data;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.error === "signed_out") return { error: "signed_out" };
  if (row.error === "not_teacher") return { error: "not_teacher" };
  if (row.error != null) return null;
  if (typeof row.id !== "string" || !row.id.trim()) return null;

  const seatsRaw = Array.isArray(row.seats) ? row.seats : [];
  const seats: TeacherClassPageSeat[] = [];
  for (const seat of seatsRaw) {
    if (!seat || typeof seat !== "object" || Array.isArray(seat)) continue;
    const record = seat as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const username = typeof record.username === "string" ? record.username.trim() : "";
    if (!id || !username) continue;
    seats.push({
      id,
      username,
      curriculumCohort: textOrNull(record.curriculum_cohort),
      payload: record.payload ?? null,
    });
  }

  return {
    error: null,
    id: row.id.trim(),
    isTeacher: row.is_teacher === true,
    accountStatus: textOrNull(row.account_status),
    seatCap: typeof row.seat_cap === "number" ? row.seat_cap : null,
    classPassword: textOrNull(row.class_password),
    classPasswordEnc: textOrNull(row.class_password_enc),
    classCohort: textOrNull(row.class_cohort),
    seats,
  };
}

export function isMissingClassPageRpc(error: {
  code?: string | null;
  message?: string | null;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST202" ||
    (message.includes("load_teacher_class_page") &&
      (message.includes("does not exist") ||
        message.includes("could not find") ||
        message.includes("schema cache")))
  );
}
