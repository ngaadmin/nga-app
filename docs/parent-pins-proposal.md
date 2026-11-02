# One Parent PIN: what changed in code, and the migration plan (NOT applied)

Status: decided by Cath (2 Nov 2026). Keep the **Parent PIN**
(`profiles.parent_pin_hash`) as the only parent PIN. The code change ships on
branch `profile-settings-hub-2nov` (PR #95). **No migration, no SQL and no
change to stored PIN data has been made.** Previews share the production
database, so every step below that touches data is a plan for a separate,
reviewed change.

## Before

| | Parent Hub PIN | Parent PIN |
|---|---|---|
| Stored in | `parent_tab_pins` (PBKDF2, server only, DB lockout counter) | `profiles.parent_pin_hash` |
| Asked for | Opening the Parent Hub, approvals and declines, the cash rate | Child data and privacy, My account, deleting accounts |
| Change it | Settings > Change Parent Hub PIN | Settings > Change Parent PIN |
| Forgot it | Account password, then set a new Hub PIN | Emailed reset link |

## What the code does now (this PR)

- One gate component, titled "Parent PIN" (`components/parent/parent-pin-gate.tsx`).
  It guards opening the Parent Hub (every time), approvals and declines, the
  cash rate in Settings, My account, and Your data & privacy. The "which PIN"
  explanation lines are gone.
- `lib/parent/parent-tab-server.ts` checks the PIN against
  `profiles.parent_pin_hash` (`assessParentPin`). It no longer reads or writes
  `parent_tab_pins`. A check makes **no database write**.
- A correct PIN returns the in-memory Hub gate pass (10 minutes) **and** sets the
  signed, httpOnly parent data grant cookie (15 minutes), so the child
  "Data & privacy" section in the Hub works without a second PIN.
- Wrong tries are limited per parent: 8 tries per 15 minutes, shared with the
  other Parent PIN checks (`parent-pin:<userId>` bucket).
- No Parent PIN yet: the gate asks the parent to create one. That writes
  `profiles.parent_pin_hash` through the normal `persistParentPin` flow, only
  when none exists. This is the same write the app already made before.
- Settings: "Change Parent Hub PIN" is removed. "Change Parent PIN" stays.
- "Forgot your PIN?" in the gate uses the existing Parent PIN reset email.

## Migration plan (proposed, not applied)

Run each step only after review, against a branch database first.

1. **Measure.** Read-only counts:
   - parents with a `parent_tab_pins` row and a `parent_pin_hash` (no action);
   - parents with a `parent_tab_pins` row but **no** `parent_pin_hash` (Hub-only);
   - parents with neither.
2. **Hub-only accounts.** Do **not** copy Hub PIN hashes into
   `parent_pin_hash`. The two use different hash formats and copying a secret
   between columns is risky. These parents will see "Create your Parent PIN"
   the next time they open the Hub (already live in this code). Optionally
   email them before release: "We've simplified to one Parent PIN."
3. **Retire the Hub PIN table**, after the code has been on production for one
   release with no rollback:
   - revoke app access to `public.parent_tab_pins` (service role only today);
   - after a further release, drop the table (or null its `pin_hash` and
     lockout columns first if a softer step is wanted);
   - remove the `parent_tab_pins` migration references and types.
4. **Forgot-PIN email flow.** Keep the existing emailed reset
   (`parent_pin_reset_hash`, `parent_pin_reset_expires_at`, 30-minute
   single-use link). Check that the reset token secret (`parentPinResetSecretReady()` in `lib/auth/parent-pin-reset-token.ts`) and the reset email are set up in production
   and that the reset email works before release. The old Hub "use your
   password" reset is removed.
5. **Rollback.** Because the Hub table is only unread, not deleted, reverting
   the code restores the old two-PIN behavior until step 3 runs.

## Risks to check before release

- **Lockout is weaker and per instance.** The Hub PIN had a database lockout
  (5 tries, then 5 minutes). The Parent PIN check now uses the in-memory rate
  limit (8 per 15 minutes per server instance). Under several serverless
  instances an attacker gets more tries. Consider a DB-backed counter on
  `profiles` in the migration.
- **One PIN unlocks more.** A correct PIN now opens the Hub and the data
  grant together. A child who knows the Parent PIN can reach downloads and
  the delete screens (delete still asks for the PIN again in the confirm).
- **Hub-only parents** are asked to create a new PIN. Some will think their
  PIN was lost. Plan the message.
- **Stale rows.** `parent_tab_pins` stays in the database, unread, holding
  PIN hashes until step 3. Keep it service-role only.
- **Forgot PIN depends on email.** If the reset secret or email sending is
  not set up in production, a parent who forgets the PIN is stuck.
- **Two timers.** The Hub pass lasts 10 minutes, the data grant 15. If the
  grant runs out while the Hub is open, the child Data & privacy actions show
  "Enter your parent PIN first." Re-opening the Hub fixes it.
- **Teacher view** is unchanged by this work.
