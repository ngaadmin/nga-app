# Round 2 Dog Walking E2E changes for Melvin (7 items)

Source: the "Round 2 change register" sheet in the Dog Walking E2E register (17 Nov). Images of Cath's slides are in /workspace/cosmo/e2e/r2-slides/ (sNN-1.png, where NN is the slide number).

## R2-07 (sheet row 8, slide 5), 3 Melvin logic and flow
- Screen: Level 2, first silver, first bronze: number of people asked
- Change: The number field for the number of people asked should be empty. It is currently pre-populated with 3.
- Type: Logic-wiring tweak; then to: —
- Notes: Learner-entered field, no default (same principle as round 1 C004).

## R2-09 (sheet row 10, slide 7), 3 Melvin logic and flow
- Screen: Level 2, silver Pricing, bronze Research what others charge
- Change: The number field is pre-populated with 3 and should be empty.
- Type: Logic-wiring tweak; then to: —

## R2-10 (sheet row 11, slide 8), 3 Melvin logic and flow
- Screen: Level 2, silver Pricing, bronze Research what others charge (voice-over)
- Change: The voice-over must start automatically (it currently does not). The same applies to the other voice-over screens, including the next section "Jobs to cover your costs".
- Type: Logic-wiring tweak; then to: —
- Notes: See R2-22 (all voice-over screens start immediately). Voice is Ara.

## R2-13 (sheet row 14, slide 11), 3 Melvin logic and flow
- Screen: All voice-over screens, laptop browser
- Change: Consistent bug on voice-over screens when checked on a laptop browser: check and fix the position of the mute/unmute button.
- Type: Logic-wiring tweak; then to: —
- Notes: Check on desktop widths as well as 390x844.

## R2-17 (sheet row 18, slide 13), 3 Melvin logic and flow
- Screen: Level 4, first silver, end of the last bronze
- Change: Show the workbook with the order tracker (L5 page 22) after the last screen in this last bronze. Also keep it as the screen shown at the end of Level 5, silver milestone "Do the job".
- Type: Logic-wiring tweak; then to: —
- Notes: Uses the existing workbook viewer and the p22 PDF tracker (C060/C061).

## R2-22 (sheet row 23, slide 17), 3 Melvin logic and flow
- Screen: All voice-over screens in the Dog Walking kit
- Change: Every voice-over starts too late. It must start immediately when the screen loads. Apply to ALL voice-over screens in the Dog Walking Launchpad kit.
- Type: Logic-wiring tweak; then to: —
- Notes: Covers R2-10. Check every voice-over screen.

## R2-23 (sheet row 24, slide 18), 3 Melvin logic and flow
- Screen: Level corridors: bronze and silver tiles
- Change: Implement the locked status view (as on the Level 7 corridor, Level Up doors) across ALL bronze tiles and ALL silver tiles inside the level corridors, so it is clear which milestone the learner is at.
- Type: Logic-wiring tweak; then to: —
- Notes: Existing locked and Up next pattern, reused. No new template.
