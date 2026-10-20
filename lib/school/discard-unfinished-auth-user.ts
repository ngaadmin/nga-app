/**
 * Rolls back an Auth user whose profile save failed.
 * Activity rows for the username actually stored (usually the stub) are removed
 * first. A failed activity delete still removes the login, because this user
 * was never handed to the teacher.
 */

export type DiscardUnfinishedAuthAdmin = {
  readUsername(userId: string): Promise<string | null>;
  deleteUsageEvents(username: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
};

export async function discardUnfinishedAuthUser(
  admin: DiscardUnfinishedAuthAdmin,
  userId: string,
): Promise<void> {
  const username = (await admin.readUsername(userId))?.trim() ?? "";
  if (username) {
    try {
      await admin.deleteUsageEvents(username);
    } catch {
      // The login is still removed below.
    }
  }
  await admin.deleteAuthUser(userId);
}
