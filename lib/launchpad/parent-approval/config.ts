/**
 * Launchpad parent approval stop (Cath, 17 Nov 2026, decisions.md).
 *
 * One hard stop per venture, just before the bronze where the learner starts
 * reaching out to customers. Levels 1 to 3 stay free. Ids live here, not in
 * the screens, so a later per-payload `parentEvents` block can replace them.
 */

/** The door the stop sits in front of: "Tell people about it". */
export const PARENT_APPROVAL_GATED_BRONZE_ID = "l4-s1-b4";

/**
 * Keys inside launchpad_learner_ventures.wrap_up_confirmed_at, a map of
 * ISO timestamps that the learner save never writes. Reused so the test build
 * needs no new table. A dedicated table is the proper home (see the report).
 */
export const APPROVAL_KEY_REQUESTED = "parent-approval-requested";
export const APPROVAL_KEY_YES = "parent-approval-yes";
export const APPROVAL_KEY_NO = "parent-approval-no";

/** Fired on window after a parent decides, so the red dot refreshes at once. */
export const PARENT_HUB_UNREAD_CHANGED_EVENT = "parent-hub:unread-changed";
