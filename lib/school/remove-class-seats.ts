/**
 * Delete class seats owned by one teacher.
 * The teacher id comes from the signed-in session. A class id or user id
 * from the browser is never used to choose who gets deleted.
 */

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{2,20}$/;

export type OwnedClassSeat = {
  id: string;
  username: string;
  accountRole: string;
};

export type RemoveClassSeatsTarget =
  | { scope: "one"; username: string }
  | { scope: "all" };

export type RemoveClassSeatsAdmin = {
  listOwnedSeats(
    teacherId: string,
  ): Promise<
    { ok: true; seats: OwnedClassSeat[] } | { ok: false; error: string }
  >;
  deleteProgress(
    userId: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  deleteUsageEvents(
    username: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  deleteAuthUser(
    userId: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
};

export type RemoveClassSeatsResult =
  | { ok: true; removed: string[] }
  | { ok: false; error: string; removed: string[] };

export function pickClassSeatsToRemove(
  seats: readonly OwnedClassSeat[],
  teacherId: string,
  target: RemoveClassSeatsTarget,
): { ok: true; seats: OwnedClassSeat[] } | { ok: false; error: string } {
  const ownerId = teacherId.trim();
  const owned = seats.filter((seat) => {
    const id = seat.id.trim();
    const username = seat.username.trim();
    return (
      id.length > 0 &&
      id !== ownerId &&
      seat.accountRole === "child" &&
      username.length > 0
    );
  });

  if (target.scope === "all") {
    return {
      ok: true,
      seats: [...owned].sort((left, right) =>
        left.username.localeCompare(right.username, undefined, {
          sensitivity: "base",
        }),
      ),
    };
  }

  const username = target.username.trim();
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "That student is not in this class." };
  }

  const needle = username.toLowerCase();
  const match = owned.filter(
    (seat) => seat.username.trim().toLowerCase() === needle,
  );
  if (match.length !== 1) {
    return { ok: false, error: "That student is not in this class." };
  }

  return { ok: true, seats: match };
}

/**
 * Deletes saved progress, then activity rows, then the Auth user.
 * Activity rows go while the username is still reserved. Profile, household,
 * and progress rows cascade from auth.users; the progress delete runs first
 * so a later Auth failure still drops the saved play for that seat.
 */
export async function removeOwnedClassSeats(
  admin: RemoveClassSeatsAdmin,
  teacherId: string,
  target: RemoveClassSeatsTarget,
): Promise<RemoveClassSeatsResult> {
  const ownerId = teacherId.trim();
  if (!ownerId) {
    return { ok: false, error: "Sign in as a teacher to remove students.", removed: [] };
  }

  const listed = await admin.listOwnedSeats(ownerId);
  if (!listed.ok) {
    return {
      ok: false,
      error: "Could not load this class. Try again.",
      removed: [],
    };
  }

  const picked = pickClassSeatsToRemove(listed.seats, ownerId, target);
  if (!picked.ok) {
    return { ok: false, error: picked.error, removed: [] };
  }

  const removed: string[] = [];
  for (const seat of picked.seats) {
    const progress = await admin.deleteProgress(seat.id);
    if (!progress.ok) {
      return {
        ok: false,
        error: "Could not remove that student's saved progress. Try again.",
        removed,
      };
    }

    const usage = await admin.deleteUsageEvents(seat.username.trim());
    if (!usage.ok) {
      return {
        ok: false,
        error: "Could not remove that student's activity records. Try again.",
        removed,
      };
    }

    const auth = await admin.deleteAuthUser(seat.id);
    if (!auth.ok) {
      return {
        ok: false,
        error:
          "Saved progress was removed, but the login is still there. Try again.",
        removed,
      };
    }

    removed.push(seat.username.trim());
  }

  return { ok: true, removed };
}
