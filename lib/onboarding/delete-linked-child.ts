/**
 * Delete one learner linked to the signed-in parent.
 * The parent id comes from the session. A child id is deleted only when
 * parent_child has that exact pair. An id that is not linked to the caller
 * is rejected before any row or Auth user is touched.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DELETE_LINKED_CHILD_COPY = {
  invalid: "Choose a learner to delete.",
  notParent: "Only the parent can delete a linked learner.",
  notLinked: "That learner is not linked to this parent account.",
  failed: "We could not delete this learner. Try again.",
} as const;

export type LinkedChildTarget = {
  id: string;
  role: string;
  username: string;
};

export type DeleteLinkedChildStep =
  | { ok: true }
  | { ok: false; error: string };

export type DeleteLinkedChildAdmin = {
  loadCallerRole(
    parentId: string,
  ): Promise<{ ok: true; role: string | null } | { ok: false; error: string }>;
  findLinkedChild(
    parentId: string,
    childId: string,
  ): Promise<
    | { ok: true; child: LinkedChildTarget | null }
    | { ok: false; error: string }
  >;
  deleteLearnerProgress(childId: string): Promise<DeleteLinkedChildStep>;
  deleteConsentRequests(childId: string): Promise<DeleteLinkedChildStep>;
  deleteAuthUser(childId: string): Promise<DeleteLinkedChildStep>;
  deleteParentChildLink(
    parentId: string,
    childId: string,
  ): Promise<DeleteLinkedChildStep>;
  deleteProfile(childId: string): Promise<DeleteLinkedChildStep>;
  confirmAuthUserGone(childId: string): Promise<DeleteLinkedChildStep>;
};

export type DeleteLinkedChildResult =
  | { ok: true; username: string }
  | { ok: false; status: 400 | 403 | 500; error: string };

export function parseLinkedChildId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim().toLowerCase();
  return UUID_PATTERN.test(id) ? id : null;
}

function invalid(): DeleteLinkedChildResult {
  return { ok: false, status: 400, error: DELETE_LINKED_CHILD_COPY.invalid };
}

function forbidden(error: string): DeleteLinkedChildResult {
  return { ok: false, status: 403, error };
}

function failed(): DeleteLinkedChildResult {
  return { ok: false, status: 500, error: DELETE_LINKED_CHILD_COPY.failed };
}

/**
 * Hard-deletes one linked child.
 *
 * learner_progress and consent_requests go first so saved play and invite
 * tokens are gone even if a later step fails. The Auth user is deleted
 * while the parent_child row still exists, so a failed Auth delete can be
 * retried by the same parent. profiles cascade from auth.users; the
 * parent_child and profile deletes after that clear anything left behind.
 */
export async function deleteLinkedChildAccount(
  admin: DeleteLinkedChildAdmin,
  parentId: string,
  childId: string,
): Promise<DeleteLinkedChildResult> {
  const parent = parseLinkedChildId(parentId);
  const child = parseLinkedChildId(childId);
  if (!parent || !child || parent === child) return invalid();

  const caller = await admin.loadCallerRole(parent);
  if (!caller.ok) return failed();
  if (caller.role !== "parent_master") {
    return forbidden(DELETE_LINKED_CHILD_COPY.notParent);
  }

  const linked = await admin.findLinkedChild(parent, child);
  if (!linked.ok) return failed();
  if (!linked.child || linked.child.role !== "child" || linked.child.id !== child) {
    return forbidden(DELETE_LINKED_CHILD_COPY.notLinked);
  }

  const username = linked.child.username.trim();

  const progress = await admin.deleteLearnerProgress(child);
  if (!progress.ok) return failed();

  const consent = await admin.deleteConsentRequests(child);
  if (!consent.ok) return failed();

  const auth = await admin.deleteAuthUser(child);
  if (!auth.ok) return failed();

  const link = await admin.deleteParentChildLink(parent, child);
  if (!link.ok) return failed();

  const profile = await admin.deleteProfile(child);
  if (!profile.ok) return failed();

  const gone = await admin.confirmAuthUserGone(child);
  if (!gone.ok) return failed();

  return { ok: true, username };
}
