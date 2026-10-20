/**
 * Deletes a parent master and linked child logins.
 * Activity rows go before each Auth user, while the username is still reserved.
 */

export type HouseholdChildRecord = {
  id: string;
  role: string;
  username: string;
};

export type DeleteHouseholdAccountsAdmin = {
  deleteUsageEvents(
    username: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  deleteAuthUser(
    userId: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  deleteLeftoverRows(): Promise<{ ok: true } | { ok: false; error: string }>;
  confirmParentGone(): Promise<{ ok: true } | { ok: false; error: string }>;
};

const GENERIC_ERROR =
  "We could not delete this household. Your parent login is still active. Try again.";

const CHILD_ERROR =
  "We could not delete every linked learner account. Your parent login is still active. Try again.";

const LEFTOVER_ERROR =
  "We could not finish deleting household records. Your parent login is still active. Try again.";

const PARENT_ERROR =
  "Linked learners were removed, but we could not delete the parent account. Try again.";

const ACTIVITY_ERROR =
  "We could not delete activity records for this household. Your parent login is still active. Try again.";

export async function deleteHouseholdAccounts(
  admin: DeleteHouseholdAccountsAdmin,
  parent: { id: string; username: string },
  children: readonly HouseholdChildRecord[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  let removedChild = false;

  for (const child of children) {
    if (child.role !== "child" || child.id === parent.id) continue;

    const username = child.username.trim();
    if (username) {
      const usage = await admin.deleteUsageEvents(username);
      if (!usage.ok) {
        return { ok: false, error: removedChild ? CHILD_ERROR : ACTIVITY_ERROR };
      }
    }

    const auth = await admin.deleteAuthUser(child.id);
    if (!auth.ok) return { ok: false, error: CHILD_ERROR };
    removedChild = true;
  }

  const parentUsername = parent.username.trim();
  if (parentUsername) {
    const usage = await admin.deleteUsageEvents(parentUsername);
    if (!usage.ok) {
      return { ok: false, error: removedChild ? CHILD_ERROR : ACTIVITY_ERROR };
    }
  }

  const leftover = await admin.deleteLeftoverRows();
  if (!leftover.ok) return { ok: false, error: LEFTOVER_ERROR };

  const parentAuth = await admin.deleteAuthUser(parent.id);
  if (!parentAuth.ok) return { ok: false, error: PARENT_ERROR };

  const gone = await admin.confirmParentGone();
  if (!gone.ok) return { ok: false, error: GENERIC_ERROR };
  return { ok: true };
}
