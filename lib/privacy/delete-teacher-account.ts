import {
  removeOwnedClassSeats,
  type RemoveClassSeatsAdmin,
} from "@/lib/school/remove-class-seats";
import { deleteTeacherPhraseAccepted } from "@/lib/privacy/data-controls";

export type DeleteTeacherAdmin = RemoveClassSeatsAdmin & {
  loadTeacher(
    teacherId: string,
  ): Promise<
    | { ok: true; username: string }
    | { ok: false; error: string }
  >;
  deleteTeacherUsage(
    username: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  deleteTeacherAuth(
    teacherId: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
};

export type DeleteTeacherResult =
  | { ok: true; removedStudents: string[] }
  | { ok: false; error: string; removedStudents: string[] };

/**
 * Deletes every class seat, then the teacher's activity and login.
 * The phrase must be the exact word DELETE. A wrong phrase touches nothing.
 */
export async function deleteTeacherAccount(
  admin: DeleteTeacherAdmin,
  teacherId: string,
  phrase: unknown,
): Promise<DeleteTeacherResult> {
  if (!deleteTeacherPhraseAccepted(phrase)) {
    return {
      ok: false,
      error: "Type DELETE to confirm.",
      removedStudents: [],
    };
  }

  const ownerId = teacherId.trim();
  if (!ownerId) {
    return {
      ok: false,
      error: "Sign in as a teacher to delete this account.",
      removedStudents: [],
    };
  }

  const teacher = await admin.loadTeacher(ownerId);
  if (!teacher.ok) {
    return { ok: false, error: teacher.error, removedStudents: [] };
  }

  const seats = await removeOwnedClassSeats(admin, ownerId, { scope: "all" });
  if (!seats.ok) {
    return { ok: false, error: seats.error, removedStudents: seats.removed };
  }

  const usage = await admin.deleteTeacherUsage(teacher.username);
  if (!usage.ok) {
    return {
      ok: false,
      error: "Could not remove the teacher activity records. Try again.",
      removedStudents: seats.removed,
    };
  }

  const auth = await admin.deleteTeacherAuth(ownerId);
  if (!auth.ok) {
    return {
      ok: false,
      error: "The class was removed, but the teacher login is still there. Try again.",
      removedStudents: seats.removed,
    };
  }

  return { ok: true, removedStudents: seats.removed };
}
