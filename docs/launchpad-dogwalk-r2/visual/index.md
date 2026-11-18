# Jasper E2E Round 2 mocks (Dog Walking Launchpad)

Made 17 Nov 2026 (Australia/Brisbane) from Cosmo's brief at `/workspace/cosmo/e2e/r2-briefs/jasper.md` and Cath's slides in `/workspace/cosmo/e2e/r2-slides/`. Read only: nothing was sent, built or pushed, and the register was not edited. Mocks go to Cosmo for sign-off; not to Melvin.

**Build:** test alias `https://nga-app-git-launchpad-venture-3nov-nga-v2.vercel.app/test-launchpad-venture`, dog-walking, deployment `dpl_791zPArsJrRuXHujR8wzra8NjV8y`, git SHA `04c8f85c55eeb2f94bce1732993007ec35571366` (alias confirmed via Vercel 17 Nov, 9:06am Australia/Brisbane). Local source checkout is still `1ca841a8`; the intro copy and later lesson chrome were read from this alias and from the files cited below in that checkout. Captures: 390x844 @2x, headless Playwright, same method as `/workspace/visual-check-2097d5c7/`. The "before" is a live capture. The "after" is the live screen restyled in place (same DOM, fonts and art library), except R2-04 which loads one free web font for the replacement Bold face.

Each item has `<REF>-before.png`, `<REF>-after.png` and `<REF>-compare.png`. Scripts are in `tools/`, live captures and DOM dumps in `_live/` and `_dom/`. A filled workbook cover (page 1, after Continue) is kept as `_live/R2-01-cover-page.png` for reference only.

Checks on every after: no page scroll, no new text under 16px (the pre-existing 13px breadcrumb and 15px Previous chrome are unchanged), no em dashes, US spelling, no Penny, no new doodle patterns. "Add this goal" was raised from 15px to 16px once it moved out of the footer, so it meets the floor.

| Ref | Screen | Slide | What changed | Status |
|---|---|---|---|---|
| R2-01 | Your workbook intro (first open, end of L1 silver 1) | 1 | Adds the existing workbook cover illustration (`/launchpad/workbook/workbook-icon-512.png`, the same art as WorkbookMark) under the guidance, 260px, centered, 32px below the callout and 152px above Continue. Continue stays. | MOCKED |
| R2-02 | Same intro | 1 | Not mocked as an icon-button swap. No existing lesson / intro template supports a workbook-icon CTA. Continue is kept. The after is the R2-01 cover treatment only. | NOT MOCKED (icon swap); cover only, see finding |
| R2-03 | Set your goals, optional "Add another goal" (step 6 of 6) | 2 | Exact position swap: "Add this goal" sits under the goal card (centered, teal filled, now 16px). "Skip for now" sits in the footer next to Previous, still in the signed-off C003 style (16px #0A8FA8 on #E7F8FC). | MOCKED |
| R2-04 | Name your business, font picker | 3 | Replaces the Bold option (Poppins 700) with Alfa Slab One. The option label and the typed name ("Lazy Paws") render in the new face. Rounded (Fredoka) and Script (Pacifico) are unchanged. The label still reads "Bold". | MOCKED |
| R2-14 | Develop your marketing materials, business card preview (section 10 of 10) | 12 | Adds a blank contact block under the existing card copy: the workbook template label "How to get in touch", then three empty printed lines using the draft-poster contact placeholders ("Your name", "XXX-XXXXXXX", "SEND ME A MESSAGE"). No inputs and no data collection. | MOCKED |

## R2-01

**Paths:** `R2-01-before.png`, `R2-01-after.png`, `R2-01-compare.png`

The intro is the existing lesson context screen inside the first-open workbook dialog (`data-workbook-intro`, `data-lesson-surface`, `data-screen-type=context`): title, context line, guidance callout, navy Continue. That screen is sparse. The after places the existing illustrated workbook cover (spiral book, "business workbook" label, pencil, star, colored tabs) in the empty space. This is the same asset already used by `WorkbookMark` in `components/launchpad/venture/workbook-mark.tsx` (lines 2-12), served at `/launchpad/workbook/workbook-icon-512.png`. No new doodle pattern.

It sits 48px below the guidance (32px margin plus the icon file's own transparent padding) and 152px above Continue. Overflow 0. Continue is unchanged, so R2-02's "keep Continue" rule is met on the same after.

**Template risk:** low. This is a content/art addition on the existing context + LessonSurface template. `ContextScreen` today has no image slot (`components/launchpad/venture/screens/context-screen.tsx`), but `LessonSurface` already accepts a `decoration` node for art pinned to the lesson frame (`components/launchpad/venture/screens/screen-ui.tsx` lines 224-238). Wiring the existing cover asset through that slot, or as an optional image on the intro payload, does not need a new template or a bespoke screen.

## R2-02 (template finding)

**Paths:** `R2-02-before.png`, `R2-02-after.png`, `R2-02-compare.png` (after is the R2-01 cover + Continue)

Cath's instruction: replace Continue with the workbook icon that opens the workbook, only if an existing template already supports that icon button. If it does not, keep Continue and do the cover image only.

Finding: **no existing lesson or intro template supports a workbook-icon primary CTA.** Continue is kept.

What exists today:

- The intro itself uses the standard lesson footer: `LessonContinue`, a navy 140x44 text pill whose `children` type is `string` only (`components/launchpad/venture/screens/screen-ui.tsx` lines 246-257). There is no icon or image variant.
- `LessonSurface` takes an arbitrary `footer` ReactNode (same file, lines 203-214 and 233-236), but every lesson screen that uses it still passes `LessonContinue`. That generic slot is not a designed icon-button CTA.
- A workbook-icon button that opens the workbook does already exist, as `WorkbookMark` inside a 56px button:
  - Floor corridor: `components/launchpad/venture/corridor-floor.tsx` lines 196-208 (`data-corridor-workbook`, aria-label "Open your workbook").
  - Launchpad home, In Progress tile: `components/launchpad/venture-test/launchpad-home.tsx` (the 56px `data-handbook-button` beside Continue).
- Those are the corridor and home templates, not the lesson context / workbook-intro template this screen uses. Putting that button in the intro footer would be a new footer variant on the lesson template, which is the custom-template risk Cath ruled out.

So R2-02 is not mocked as a swap. The after only adds the R2-01 cover and leaves Continue in place.

## R2-03

**Paths:** `R2-03-before.png`, `R2-03-after.png`, `R2-03-compare.png`

Exact position swap, styles kept with each button:

- "Add this goal" moves to the centered slot under the goal card (the slot Skip used). It keeps the filled teal style (`#0CC1E0`). `ml-auto` (from the footer class on `data-workbook-next` in `task-workbook.tsx` line 126) is dropped so it centers. Font size is 16px, up from the footer's 15px, so a content CTA meets the floor.
- "Skip for now" moves to the footer, to the right of Previous, in the same C003 treatment already on this build: 16px bold `#0A8FA8` on `#E7F8FC`, 143x44 pill. It does not pick up the teal filled style.

Previous is unchanged (15px outline, pre-existing chrome). Overflow 0. No new template: same short-text goal screen and the same two existing buttons, swapped.

Note, not part of this change: Cath's slide 2 still shows "Come back to this later" under the footer. That line is not on the live `04c8f85c` screen, and this mock does not add or remove it.

## R2-04

**Paths:** `R2-04-before.png`, `R2-04-after.png`, `R2-04-compare.png`

**Pick: Alfa Slab One**, replacing Poppins 700 on the Bold option only.

Rationale: Bold (Poppins 700) and Rounded (Fredoka 600) are both geometric sans and read as nearly the same face at this size, which is Cath's note on slide 3. Alfa Slab One is a chunky slab serif, so the three options become a clear set: strong slab, soft rounded sans, and script. It stays legible for short kids' business names (the field caps at 24 characters, two lines) and is playful without competing with Pacifico.

**Source and license:** designed by JM Sole. Distributed on Google Fonts at `https://fonts.google.com/specimen/Alfa+Slab+One`. License: SIL Open Font License 1.1 (free for app use). Loaded for the mock with the Google Fonts CSS API; in product it should be loaded with `next/font/google` in `components/launchpad/venture/identity/identity-fonts.ts`, the same way Poppins, Fredoka and Pacifico are loaded today.

The after shows all three font options and the typed name "Lazy Paws" in Alfa Slab One (the name field is Inter / `font-sans` today; the mock applies the chosen face to the field so the name is visible in the new font on this single screen). Rounded and Script are untouched. The visible label is still "Bold" (existing copy). If that label should change to match the new face, that is Storybird's call; nothing was invented here.

**Implementation notes for the later build (not a template change):**

- Proposed id: `alfa-slab-one`, replacing `poppins-bold` in `NAME_FONTS` (`lib/launchpad/content/identity.ts` line 74) and `NAME_FONT_CLASS`.
- Alfa Slab One ships only weight 400, like Pacifico, so the teal name should use a 24px floor (`NAME_FONT_MIN_PX`), not the 19px floor used for bold sans. Dark ink at 18px on this picker is fine.
- Saved answers that still hold `poppins-bold` will need a one-line migration onto the new id.
- Other screens only render the saved name, icon and font, as Cath said, so they update automatically. No template changes.

**Template risk:** none. Single-screen change to an existing font option on the existing name form.

## R2-14

**Paths:** `R2-14-before.png`, `R2-14-after.png`, `R2-14-compare.png`

The brief names this as Level 3. On the live alias the screen is **Level 4, Sales**, bronze `l4-s1-b2`, "Develop your marketing materials", section 10 of 10, heading "What my business card will say". That is the screen on Cath's slide 12, so the mock is of that live page. Cosmo may want the register's "Level 3" wording aligned.

The after adds a blank contact area under the existing card copy, with no fields the learner can type into:

- Section label "How to get in touch" (already used on the workbook Business card template in `lib/launchpad/content/surface-copy.ts`, templates page `business-card`).
- Three empty printed lines, using the exact placeholders from the draft poster contact box (`public/launchpad/posters/draft-poster.png`): "Your name", "XXX-XXXXXXX", "SEND ME A MESSAGE". 16px, gray `#9AA3B5`, on the existing template-line rule (`1.5px #8390AF`).

No new copy was written. No personal data is collected. The block is 140px tall, 187px above Continue, overflow 0.

**Template risk:** low. This is a formatting addition on the existing marketing-materials playback screen, using the existing template-line treatment and existing poster / workbook labels. It is not a new card template and not a data-collection screen.

## What was not done

- R2-02's workbook-icon CTA was not mocked, for the template reason above.
- No mocks were sent to Melvin.
- The option label "Bold" was not renamed.
