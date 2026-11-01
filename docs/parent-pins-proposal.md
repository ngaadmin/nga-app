# Parent PINs: merge or explain? (proposal, not built)

Today a parent has two 4-digit PINs:

| | Parent Hub PIN | Child data PIN |
|---|---|---|
| Stored in | `parent_tab_pins` (PBKDF2, server only) | `profiles.parent_pin_hash` |
| Asked for | Opening the Parent Hub, every approval and decline, the coins cash rate in Settings | Your child's data and privacy, My account, deleting a child |
| Lockout | 5 tries, then 5 minutes | per existing flow |
| Change it | Settings > Change Parent Hub PIN (new) | Settings > Change Parent PIN |
| Forgot it | Password reset, then set a new one | Emailed reset link |

## Option A: merge into one parent PIN (recommended)

Keep the Parent Hub PIN as the only parent PIN, because it is already server-side
with PBKDF2 and a lockout. Point the child-data gate (`unlockParentDataView`) at
`openParentTabGate`, then retire `profiles.parent_pin_hash` in a later
migration once every parent has a Hub PIN. Settings then shows one row,
"Change parent PIN".

- Pros: one thing to remember, one reset path, one lockout. Clear for parents.
- Cons: needs a careful rollout. Parents who only set the old PIN need a
  one-time "set your parent PIN" step. The data migration and the column drop
  are a separate, reviewed change (not in this PR).

## Option B: keep both and explain

Keep two PINs and label them everywhere: "Parent Hub PIN" (insights and
approvals) and "Child data PIN" (data, downloads, deleting). Add one line of help
under each Settings row saying where it is used.

- Pros: no data migration. Ships now.
- Cons: two PINs to remember and two reset paths. Parents will mix them up.

## Point 5 works with either option

Settings now has "Change Parent Hub PIN" next to "Change Parent PIN". It calls
`changeParentHubPin(pass, newPin)`, which updates the existing
`parent_tab_pins` row. With option A the old row is removed later and the Hub
row is renamed to "Change parent PIN". With option B both rows stay with
clearer labels. No migration is needed for this PR.
