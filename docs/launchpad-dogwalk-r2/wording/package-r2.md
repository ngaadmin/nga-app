# STATUS: FINAL (Cosmo approved all 12, 17 Nov 2026 ~10:19am). For Cosmo to batch to Melvin; Storybird does not send to Melvin.

# Package R2 — Launchpad Dog Walking wording (12 items)

Storybird draft for Cosmo review. No files in the app or the register were edited. Nothing was sent to Melvin or built.

**Live source checked:** `origin/launchpad-venture-3nov` at SHA `04c8f85c55eeb2f94bce1732993007ec35571366` (17 Nov 2026, 9:02 AM Australia/Brisbane). Commit message: `TEST-ONLY: read the Typical week 'Keep' word from the payload.` This is the SHA Cosmo named for the Typical week playback, and it matches Cath's round-2 screenshots (the "Services" heading, "Keep $59.30 a week.", "Extra play time", and the C065 closer context). The older locked SHA `3075fc50` still has `packagesHeading: "Packages"` and the earlier Typical week strings, so it is not the right baseline for this round.

The app repo working tree was not changed (HEAD remains `1ca841a8`). Column D/L-style notes come from `/workspace/cosmo/e2e/r2-briefs/storybird.md` and the matching slides in `/workspace/cosmo/e2e/r2-slides/`.

**Copy rules:** US spelling, no em dashes, NextGenAchiever$ on screen, payload-led, You on lesson screens and I in the workbook, safe for 11-year-olds, no they/them/their on screens, no "Lego", "NGA", or "Duolingo." Lawn mowing is out of scope.

**16 Nov rule:** meaning changes and new-template / bespoke screens go to Cath first. None of these 12 items need a new template. New options and removals are Cath's own E2E asks, so they do not need to go back to her.

---

## R2-05 — "Services" becomes the service name on the L2 offer screen

- **Screen:** Level 2 / silver `l2-s1` / bronze `Decide what to sell` (`l2-s1-b1`) / offer-loop screen `l2-s1-b1-t1-offer`. Top bar is the current service name (in the screenshot, `Dog walking`). Slide 4. The heading in question is the aqua section label above the walk-length list, not the page title and not "Add another service."
- **Current text:** `Services`
- **Why it is still "Services" (Cath has asked three times):** this is not an unapplied change. It is the result of a different round-1 ask. C008 renamed this same slot from `Packages` to `Services`. That landed in commit `107fc930` (`TEST-ONLY: apply the approved 16 Nov wording batch.`). On SHA `3075fc50` the slot still said `Packages`. On `04c8f85c` it says `Services`. Cath's earlier asks for "Dog Walking" were never written to this field; C008 put the word "Services" there instead. That is why the heading did not become "Dog walking."
- **New text (recommended):** do not hardcode `Dog Walking` in `packagesHeading`. The offer loop is one service per step (`OfferLoopFlow` in `module2-flows.tsx`). The same `packagesHeading` string is shown on the Dog training (and Grooming / Dog sitting) step too. Hardcoding `Dog Walking` would label those steps incorrectly.
  - Set `packagesHeading` to `{service}`, and have the screen replace `{service}` with the current service label, the same way `serviceIntro` already does.
  - On this kit's first step that plays as `Dog walking` (matching the top bar, `surface.costs.dogWalking`, and `surface.sheets.dogWalking`).
- **Alternative if the heading must be exact title case:** play `Dog Walking` only when the current service is dog-walking, and still use each other service's own name on later steps. I do not recommend this; sentence-case `Dog walking` is already the kit's service name.
- **Field / slot path:** `floors[1].silvers[0].bronzes[0].tasks[0].screens[0].copy.packagesHeading`. Source: `lib/launchpad/content/planning/screens.ts` `offerLoopScreen().copy.packagesHeading`. Rendered in `components/launchpad/venture/screens/module2-flows.tsx` as `<ScreenPrompt>{screen.copy.packagesHeading}</ScreenPrompt>`. Type: `LaunchpadOfferLoopScreen.copy.packagesHeading` in `lib/launchpad/content/types.ts`. The `{service}` token is already supported on `copy.serviceIntro` in the same flow; `packagesHeading` does not replace it today, so Melvin needs that one substitution (or can render `service.label` directly, but a `{service}` payload value stays content-led).
- **Workbook impact:** none. The workbook page "What I am selling" already leads each block with the service name (`Dog walking: 30-minute walk and …`). It does not use `packagesHeading`.
- **Flags:** Meaning change **N** (section label only). New template **N**. Implementation risk: a hardcoded "Dog Walking" would break the other service steps in this same loop.

---

## R2-06 — Add "Feeding" as a Dog walking add-on

- **Screen:** the same offer-loop screen as R2-05, Extras list on the Dog walking step. Slide 4.
- **Current extras (Dog walking):** `Photo updates`, `Treats`, `Walk one dog only`, `Extra play time`. There is no Feeding add-on on this service.
- **New text:** add `Feeding` under Extras, after `Treats` (both are care extras). Reuse the existing catalog id `feeding` and label `Feeding` already used on Dog sitting, so `chipLabel("feeding")` stays unique.
- **Field / slot path:** `SERVICE_CATALOGS` entry `serviceId: "dog-walking"`, `extras` in `lib/launchpad/content/planning/catalog.ts`. The same catalog array is copied onto `offerLoopScreen().catalogs` and into the published payload on `l2-s1-b1-t1-offer`. Do not add a second Dog sitting Feeding; that service already has it.
- **Workbook impact:** if the learner ticks it, it appears in "What I am selling" with the other extras (`Dog walking: … with treats, extra play time, and feeding.`). No new workbook sentence is needed.
- **Flags:** Meaning change **N\*** (new offer option, but it is Cath's own E2E ask). New template **N**. Catalog tweak only.

---

## R2-08 — "When and who might want it" opening paragraph (L2 workbook page 4)

- **Screen:** Level 2 workbook, page 4, heading `When and who might want it` (`surface.sheets.whenWho`). Slide 6. Built in `WhatIAmSelling` in `components/launchpad/venture/handbook/planning-sheets.tsx`.
- **Current text:** the first paragraph under the heading is only the availability list, then a period, so it is not a sentence:
  - `weekday mornings, afternoons, and evenings, and weekend mornings, midday, afternoons, and evenings.`
  - The second paragraph is already a clear customer-feedback sentence: `I asked 3 people. They were interested in basic manners session, 30-minute walk, and extra play time. They wanted walks weekday midday and evenings, and weekend afternoons.`
- **Why it is confusing:** the first block is the learner's own availability (from `When can you work?`), but it has no stem. The lesson screen already has a clear stem, `I am available {when}.` (`offerLoopScreen().copy.whenSummary`). The workbook does not use that stem.
- **New text (recommended):** reuse the existing lesson stem so the first paragraph reads, for example: `I am available weekday mornings, afternoons, and evenings, and weekend mornings, midday, afternoons, and evenings.`
  - Leave the second paragraph as it is. It already spells out the customer feedback (`I asked… They were interested in… They wanted walks…`).
- **Alternative first paragraph:** `I can work weekday mornings, afternoons, and evenings, and weekend mornings, midday, afternoons, and evenings.`
- **Field / slot path:** playback is `planning-sheets.tsx` (the `whenWho` block). Recommended: play `copy.whenSummary` from `l2-s1-b1-t1-offer` (`I am available {when}.`) instead of a bare `playedBackTimes(...)` plus a hard-coded period. If a workbook-only key is preferred, add `surface.sheets.iAmAvailable` = `I am available ` in `lib/launchpad/content/surface-copy.ts`. Time phrases still come from `availabilityPhrase()` / `playedBackTimes()` in `lib/launchpad/content/planning/catalog.ts`.
- **Workbook impact:** this is a workbook-only change. The lesson "When can you work?" screen already shows `I am available {when}.`
- **Flags:** Meaning change **N**. New template **N**. The change is a missing stem, not a new screen.

---

## R2-11 — "5 other dog walkers" becomes a full sentence (L2 workbook page 7)

- **Screen:** Level 2 workbook, page 7, under `What others offer`. Slide 9. Built in `PricingPlaybackPage` in `planning-sheets.tsx`.
- **Current text:** `{walkersChecked} other dog walkers.` For the screenshot: `5 other dog walkers.` Then the per-service average-price sentences follow (`My competitors all offer 30-minute walk at an average of $25.` …). The number is already learner-driven (`competitor.walkersChecked`).
- **New text (recommended):** `I checked 5 other dog walkers.` The number stays whatever the learner entered.
- **Field / slot path:** the workbook currently prints `<ChosenValue>{competitor.walkersChecked}</ChosenValue> {s.competitor.checkedWalkers}` and drops the existing lesson stem. Keys already in `lib/launchpad/content/surface-copy.ts` `competitor`:
  - `iChecked`: `I checked`
  - `checkedWalkers`: `other dog walkers.`
  Wire the workbook to play `iChecked` + the number + `checkedWalkers`. No new wording key is required unless Cosmo prefers a single combined string.
- **Workbook impact:** workbook-only. The lesson competitor screen already starts with `I checked`. Keep `other dog walkers` here (R2-11 asks for that phrase). A later C017 idea of "other businesses" is not part of this row.
- **Flags:** Meaning change **N**. New template **N**.
- **Same-page note (not part of this row):** the screenshot also shows an empty `They often include .` and truncated comparison lines (`Mine is about the same as` / `Mine is lower than`). Those are separate playback glitches, not the sentence Cath asked to fix.

---

## R2-12 — Typical week numbers, made clearer (L2 workbook page 8)

- **Screen:** Level 2 workbook, page 8, `Jobs to cover my costs` / `Typical week`. Slide 10. Built in `TypicalWeekPage` in `planning-sheets.tsx`. Rewritten on top of Melvin's `04c8f85c` playback, which made the word `Keep` come from `surface.jobs.keep`.
- **Current text** (from the screenshot, multi-service mode):
  - `1 Dog walking + 1 Dog training a week.`
  - `Keep $59.30 a week.`
  - `1 × $24.70 + 1 × $34.60 = $59.30 a week.`
  - `About 2 weeks to cover $91 start-up.`
- **Why it reads clunky:** the first line is a fragment joined with plus signs; `Keep` is not a sentence; the last line drops "my" and "costs." Some joiners are still hard-coded in `TypicalWeekPage` (`" + "`, `"About "`, `" start-up."`), even after `04c8f85c`. `aWeekPeriod` (`a week.`) is reused on three lines, so it should not be changed globally.
- **New text (recommended), same four lines, I-voice, numbers unchanged:**
  1. `In a typical week I would do 1 Dog walking job and 1 Dog training job.`
  2. `I keep $59.30 a week.`
  3. `1 × $24.70 + 1 × $34.60 = $59.30 a week.` (math line stays; it already shows the working)
  4. `That's about 2 weeks to cover my $91 start-up costs.`
  - Single-service example: `In a typical week I would do 3 Dog walking jobs.` then the same keep / math / weeks lines.
- **Alternative (three lines, a little tighter):**
  1. `In a typical week I would do 1 Dog walking job and 1 Dog training job.`
  2. `I keep $59.30 a week (1 × $24.70 + 1 × $34.60).`
  3. `That's about 2 weeks to cover my $91 start-up costs.`
- **Field / slot path:** `lib/launchpad/content/surface-copy.ts` `jobs` and `TypicalWeekPage` in `planning-sheets.tsx`. Proposed keys (do not reuse `aWeekPeriod` for the mix line):
  - new `inATypicalWeek`: `In a typical week I would do `
  - new `jobWord` / `jobsWord` already has `jobsWord`: `jobs`; add `jobWord`: `job` if needed
  - change `keep` from `Keep` to `I keep`
  - new `weeksToCoverLead`: `That's about `
  - new `weeksToCoverMid`: `weeks to cover my `
  - new `weeksToCoverEnd`: ` start-up costs.`
  - mix joiner: use `surface.list.and` (`and`) instead of the hard-coded `" + "`
- **Workbook impact:** this is a workbook-only playback rewrite. The lesson Jobs to cover screens are unchanged.
- **Flags:** Meaning change **N**. New template **N**. The numbers and the math stay; only the surrounding words change. Melvin will also need to move the remaining hard-coded joiners into the payload to stay content-led.

---

## R2-15 — Drop "best choice" from the My calendar option

- **Screen:** Level 4 / silver `Take the order` (`l4-s2`, not the first silver) / bronze `Set up your order system` (`l4-s2-b1`) / screen `l4-s2-b1-t1-s1`, section 1 of 2. Slide 13. The brief's "first silver" is a slip; this bronze is in the second Level 4 silver.
- **Current option label:** `My calendar (best choice)`
- **New text (recommended):** `My calendar`
- **Field / slot path:** `ORDER_SYSTEM.trackerOptions` in `lib/launchpad/content/sales/copy.ts`, the `calendar` row's `label`. Copied onto the screen as `order.trackerOptions`. The workbook value is already `My calendar` (a handbook test asserts the workbook text does not contain "best choice"), so playback does not change if the learner already picked this option.
- **Workbook impact:** none for the option playback (`I will keep my orders in My calendar.`).
- **Same-screen flag:** the guidance just above the dropdown still says `Pick where you will keep your orders. A calendar is the best choice because it can repeat regular jobs and remind you before each one.` Cath asked only to change the option, so I have not rewritten the guidance as the main ask. If Cosmo wants the phrase gone from the whole screen, the smallest fix is: `Pick where you will keep your orders. A calendar can repeat regular jobs and remind you before each one.` That would also need a new voice-over if this screen is recorded; today it does not have one.
- **Flags:** Meaning change **N** for the option label. The optional guidance tweak slightly softens a recommendation. New template **N**.

---

## R2-16 — Add "Downloadable order tracker" as the first order-system option

- **Screen:** the same dropdown as R2-15. Slide 13. Links to the printable PDF tracker built for round 1 C060 / C061 (and to R2-17, which shows workbook page 22 after this bronze).
- **Current options, in order:**
  1. `My calendar (best choice)` (becomes `My calendar` under R2-15)
  2. `A paper notebook`
  3. `A notes page on my phone`
- **New text:** add, listed first, verbatim: `Downloadable order tracker`
  - Proposed id: `downloadable-tracker`
  - On-screen label: `Downloadable order tracker`
  - Workbook label (recommended, so the I-sentence reads naturally): `a downloadable order tracker`
  - Then the existing three options follow, with R2-15 applied to the calendar label.
- **Field / slot path:** `ORDER_SYSTEM.trackerOptions` in `lib/launchpad/content/sales/copy.ts`, copied to `l4-s2-b1-t1-s1` `order.trackerOptions`. Lesson stem stays `You will keep your orders in`. Workbook stem stays `I will keep my orders in `.
- **Workbook impact:** if this option is chosen, page "My order system" will read `I will keep my orders in a downloadable order tracker.` (or `… in Downloadable order tracker.` if the workbook label is left verbatim). The PDF itself lives on workbook page 22; this row is only the option wording. Melvin wires the link.
- **Flags:** Meaning change **N\*** (new option, Cath's own E2E ask). New template **N**. It is one more item in an existing dropdown, not a new screen.

---

## R2-18 — Add payment option "Up front (including prepaid)"

- **Screen:** Level 5 (not Level 4) / silver `Do the job` (`l5-s2`) / bronze `Wrap up the job` (`l5-s2-b2`) / screen `l5-s2-b2-t1-s1`. The dropdown is `I will ask for payment {option}.` Slide 14. The brief's "Level 4" is a slip; Wrap up the job and Record the job are Level 5 Delivery.
- **Current options:**
  1. `straight after the job`
  2. `when I send the proof`
  3. `before I leave`
- **New text:** add Cath's wording verbatim: `Up front (including prepaid)`
  - Proposed id: `up-front`
  - Recommended position: first, because it is the earliest timing. Alternative: append at the end so the current order does not shift.
- **Field / slot path:** `WRAP_UP_JOB.askPayOptions` in `lib/launchpad/content/delivery/copy.ts`, copied to the wrap screen as `wrap.askPayOptions`. Lesson and workbook both use `askPayBefore` (`I will ask for payment `) + the option label + `askPayAfter` (`.`).
- **Workbook impact:** "My plan after the job" will play the new option when it is chosen: `I will ask for payment Up front (including prepaid).` Mid-sentence capital U is slightly stiff. A workbook-only label `up front (including prepaid)` would read more naturally; the on-screen option should stay verbatim as Cath wrote it.
- **Implementation note for Melvin:** `lib/launchpad/content/delivery/logic.ts` currently defaults `paymentWhen` to `askPayOptions[1]`. If the new option is inserted first, that index would silently change from "when I send the proof" to "straight after the job." Default by option id, not by index.
- **Flags:** Meaning change **N\*** (new option, Cath's own wording). New template **N**.

---

## R2-19 — Remove the "Then I will tick Done?, Paid?" paragraph

- **Screen:** the same Wrap up the job screen as R2-18, section 2 of 2. Slide 15. The paragraph sits between the feedback question and `I will update my order tracker {when}.`
- **Current text:** `Then I will tick Done?, Paid? and Feedback asked? for this job in My order tracker in my workbook.`
- **New text:** remove the whole paragraph. The following line, `I will update my order tracker {when}.`, stays.
- **Field / slot path:** `WRAP_UP_JOB.trackerLine` in `lib/launchpad/content/delivery/copy.ts`, copied to the wrap screen as `wrap.trackerLine`. The same field is printed on the workbook page "My plan after the job" (`delivery-workbook.tsx`).
- **Workbook impact:** that paragraph also drops from "My plan after the job."
- **Flags:** Meaning change **N**. New template **N**. **Removal approved in Cath's own words** (no-drop rule satisfied).

---

## R2-20 — Remove the "parent or trusted adult" closing sentence

- **Screen:** the same Wrap up the job screen, last line. Slide 15.
- **Current text:** `Take payment with a parent or trusted adult nearby, and keep customer details private.`
- **New text:** remove the sentence. Nothing replaces it.
- **Field / slot path:** `WRAP_UP_JOB.note` in `lib/launchpad/content/delivery/copy.ts`, copied to the wrap screen as `wrap.note`. This line is lesson-only; it is not in the workbook playback.
- **Workbook impact:** none.
- **Flags:** Meaning change **N**. New template **N**. **Removal approved in Cath's own words.** It also matches the standing Launchpad rule that kits do not carry safety or parental-supervision warnings. Out of scope: `GET_READY.note` (`Always tell a parent or trusted adult where you're going and when you'll be back.`) and the travel option `a ride from a parent or trusted adult` are unchanged.
- **Note:** if a voice-over already reads this wrap-up page, the script should drop this sentence (and the R2-19 paragraph) when the audio is next recorded.

---

## R2-21 — Remove "in my workbook" from Record the job

- **Screen:** Level 5 / silver `Know your profit` (`l5-s3`) / bronze `Record the job and see what's left` (`l5-s3-b1`) / screen `l5-s3-b1-t1-s1`. Slide 16. The brief's "Level 4, Record the job" is a slip; this is Level 5. The title on screen is `Record the job and see what's left`.
- **Current text:** `I will write what I was paid in the Price column and tick the Paid? column in My order tracker in my workbook.`
  - This is the C059 recommended line, which already names `My order tracker` and the Price / Paid? columns.
- **New text:** `I will write what I was paid in the Price column and tick the Paid? column in My order tracker.`
- **Field / slot path:** `RECORD_JOB.trackerLine` in `lib/launchpad/content/delivery/copy.ts`, copied to the record screen as `record.trackerLine`. The same line is printed at the bottom of the workbook "My job record" page.
- **Workbook impact:** the workbook line loses the same three words, which also fits the printable / downloadable tracker (the tracker is not only inside the workbook).
- **Flags:** Meaning change **N**. New template **N**. Removal of those three words is Cath's own E2E ask. The rest of the approved C059 sentence stays.

---

## R2-24 — New title for the L7 Quarterly Business Review closer

- **Screen:** Level 7 / silver `Level Up` (`l7-s1`) / bronze `Grow` (`l7-s1-b3`) / closer page (section 4 of 4) on `l7-s1-b3-t1-s1`. Slide 19. This is the same closer whose body was rewritten in round 1 as C065. The date line is C066 and stays.
- **Current title:** `See you in {period}.` which plays as `See you in three months.` (`levelUpContent().grow.closerHeadline`, filled from the quarterly period). It sits directly after the growth-experiment plans, whose check-ins can be one month, two months, or three months, so "See you in three months" feels like another goal timeline.
- **Current body (unchanged):** `The goals you just set each have their own timeline. It's also good practice to review your whole business every three months. This review is separate from those goal check-ins.` Then `Your next check-in: {date}` and the calendar note.
- **New title options** (pick one; all drop the "See you in…" pattern so the title is clearly a whole-business review, not another goal deadline):
  1. **Recommended:** `Review your whole business`
  2. `Your quarterly business review`
  3. `A whole-business check-in`
- **Field / slot path:** `levelUpContent().grow.closerHeadline` in `lib/launchpad/content/level-up/content.ts`, rendered as the section heading on the Grow closer (`level-up-flow.tsx`). If the chosen title has no `{period}` token, the closer will show the title as written (the fill already no-ops when the token is absent). The date line still carries the next review date.
- **Workbook impact:** none found. The closer headline is not repeated on the Level 7 workbook growth-plan / weekly-focus pages.
- **Flags:** Meaning change **N** (title reframe Cath asked for; the body already explains the distinction). New template **N**.

---

## Meaning-change and template flags (summary)

| Item | Meaning change | New template / bespoke screen | Notes |
| --- | --- | --- | --- |
| R2-05 | N | N | Use `{service}`, do not hardcode "Dog Walking" on every step. |
| R2-06 | N* | N | New extras option; Cath's E2E ask. |
| R2-08 | N | N | Workbook stem only. |
| R2-11 | N | N | Workbook stem only. |
| R2-12 | N | N | Clearer stems; same numbers. |
| R2-15 | N | N | Optional same-screen guidance tidy flagged. |
| R2-16 | N* | N | New dropdown option; Cath's E2E ask. |
| R2-18 | N* | N | New payment-timing option; Cath's wording. |
| R2-19 | N | N | Removal in Cath's own words. |
| R2-20 | N | N | Removal in Cath's own words. |
| R2-21 | N | N | Drops three words from the C059 line, per Cath. |
| R2-24 | N | N | Title options for Cosmo to pick. |

---

## Open questions for Cosmo

1. **R2-05:** confirm the heading should play the current service name (`{service}` → `Dog walking` on this step), not a hardcoded `Dog Walking` on every service step. Also confirm sentence case (`Dog walking`) to match the rest of the kit.
2. **R2-15:** should the guidance paragraph also drop "best choice," or only the option label?
3. **R2-12:** recommended four-line rewrite, or the tighter three-line alternative?
4. **R2-16 / R2-18:** use a lowercase workbook label so the I-sentences read naturally (`a downloadable order tracker`, `up front (including prepaid)`), while the on-screen options stay verbatim?
5. **R2-18:** put `Up front (including prepaid)` first, or at the end of the list?
6. **R2-24:** which of the three titles should be used?

### R2-12 add-on (Cosmo, 17 Nov ~10:18am): playback sentence
- Current: "3 Dog walking a week." / "3 Dog walking + 2 Grooming a week."
- Proposed: "In a typical week, I'll do {n} {service} {job|jobs}." / "In a typical week, I'll do {n1} {service1} {job|jobs} and {n2} {service2} {job|jobs}."
  - e.g. "In a typical week, I'll do 3 Dog walking jobs and 2 Grooming jobs." / "...1 Dog walking job."
  - Use "job" when n = 1. With three or more services, use commas plus "and" before the last one, and no "+".
- This replaces the first line of the four-line R2-12 version above.

## FINAL decisions (Cosmo, 17 Nov 2026 ~10:19am). These override any open options above.
- **R2-05:** the heading is `{service}` (plays "Dog walking" on that step and follows each later loop step). Don't hardcode it.
- **R2-06:** add `Feeding` (id `feeding`) after Treats in the Dog walking extras.
- **R2-08:** workbook p4 uses the stem "I am available {when}." The feedback paragraph stays as is.
- **R2-11:** "I checked {n} other dog walkers."
- **R2-12:** "In a typical week, I'll do {n} {service} {job|jobs}[, ... and {n} {service} {job|jobs}]." Then "I keep $X a week.", the math line unchanged, and "That's about N weeks to cover my $X start-up costs." Use "job" when n = 1, commas plus "and" for 3+ services, and no "+".
- **R2-15:** the option label is `My calendar`. The guidance becomes "Pick where you will keep your orders. A calendar can repeat regular jobs and remind you before each one." (only "is the best choice because it" changes).
- **R2-16:** `Downloadable order tracker` is the FIRST option, verbatim. The workbook value is "a downloadable order tracker".
- **R2-18:** `Up front (including prepaid)` is the FIRST option, verbatim. Keep the current default answer, set by id, not index (`delivery/logic.ts`).
- **R2-19:** remove "Then I will tick Done?, Paid? and Feedback asked? for this job in My order tracker in my workbook." from the lesson and the workbook. Keep "I will update my order tracker {when}."
- **R2-20:** remove "Take payment with a parent or trusted adult nearby, and keep customer details private." (lesson only).
- **R2-21:** "...in My order tracker in my workbook." becomes "...in My order tracker." (lesson and workbook).
- **R2-24:** the title is "Your quarterly business review" (replaces "See you in {period}."). The C065 body is unchanged.
- The p7 leftovers are already fixed in 04c8f85c, so no action. Removals are Cath's own E2E asks.

