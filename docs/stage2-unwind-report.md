# Stage 2 unwind report

Stage 2 removes old lesson files and importers. It does not add a master-workbook reader and it does not change the copy learners play today.

Base commit for every removed path: `23625f2f21fe3ad5aea812f9c8b4f2cdcc8fe91c` on `explorer-m1-images-b3`. Recover a file with `git show 23625f2f21fe3ad5aea812f9c8b4f2cdcc8fe91c:<path>`. The same bytes are also copied under `archive/stage2-lesson-files/`, which is outside the TypeScript program and the lint set.

The master workbook (sheets Explorer M1, Pathfinder M1, Maverick M1, Lesson Details) wins every difference below. Live lesson routes still read the files in [Kept until stage 3](#kept-until-stage-3).

## Verification

`npx tsc --noEmit` passed. `npm run build` passed and prerendered `/dashboard/academy/lesson/1` through `/9` plus `/dashboard/academy/lesson/shell`. The same loaders the lesson page uses resolved lessons 1–9 for Explorer, Pathfinder, and Maverick (27 payloads, every one with screens). `npm run lint` exited 0 with the existing unused-variable warnings. The player was not clicked in a browser. This change does not rewrite screen templates or the payload files those routes read.

## Inventory

Classes:

- **(a) Keep.** The player, the screen templates, or the future reader still need it.
- **(b) Superseded.** The master workbook replaces it. Removed when nothing in the build loads it. Kept, with a note, when removing it would break lesson routes.
- **(c) Unused.** Nothing in the player or the future reader loads it.

### (a) Kept

| Path | Why |
|---|---|
| `components/academy/lesson/screens/` and `lesson-*-game.tsx` | Shared screen templates the player renders. |
| `lib/academy/lessons/types/screens/` | Screen type contracts those templates read. |
| `lib/academy/lessons/payload/map-payload-lesson.ts` | Maps a payload row onto those templates. Stage 3 still needs this mapper. |
| `lib/academy/lessons/payload/parse-authoring-table.ts` | CSV and first-sheet xlsx parser the current loaders use. It reads only `sheet1`. |
| `lib/academy/lessons/content/design-shell.ts` | Dev gallery at `/dashboard/academy/lesson/shell`. Not a shipped lesson. |
| `public/academy-audio/explorer-m1/` and illustration files | Media the player already ships. |

### (b) Superseded, removed

Baked lessons and the old authoring kit. Nothing in the registry or the lesson routes imported them. Tests that imported `m1-l1.ts` through `m1-l5.ts` were pointed at the payload or at the design shell.

| Group | What it was |
|---|---|
| `lib/academy/lessons/content/m1-l1.ts` … `m1-l5.ts` | Hand-maintained or generated lesson definitions. The registry does not register them. |
| `lib/academy/lessons/content/data/explorer/` | Output of the older Explorer phase-1 importer (JSON + TS, including lesson 3 and 4 drafts). |
| `templates/lesson-authoring/` | Authoring CSVs, generated TS, character roster, game-type cheat sheet, and instructions for `npm run lesson:import`. |
| `lib/academy/lessons/content/README.md` | Rewritten in place. The previous text is in the archive. |

### (b) Superseded, kept until stage 3

Removing these breaks Explorer, Pathfinder, or Maverick lesson routes, or the importer that rebuilds `lessons.json`.

| Bytes | Path | Who plays it |
|---:|---|---|
| 62933 | `lib/academy/lessons/payload/source/Screens1.csv` | Pathfinder and Maverick. Explorer fallback. |
| 2398 | `lib/academy/lessons/payload/source/Lesson-Details.csv` | Titles, characters, and skill ids for every cohort, including Explorer metadata inside `lessons.json`. |
| 162696 | `lib/academy/lessons/payload/source/explorer-m1/lessons.json` | Explorer lessons 1–9, including story beats. |
| 35481 | `lib/academy/lessons/payload/source/explorer-m1/workbook.xlsx` | Input to the Explorer converter. Sheet 2 is Module 2 and is not played. |
| 639 | `lib/academy/lessons/payload/source/explorer-m1/intro.json` | Module intro copy. The converter skips the workbook's intro row and reads this file. |
| 7213 | `lib/academy/lessons/payload/source/explorer-m1/narration.csv` | Image briefs the converter checks against the workbook. |
| 3139 | `lib/academy/lessons/payload/source/explorer-m1/manifest.json` | Audio file names and durations. The Academy map preloads the intro clip from this file. |
| 15420 | `lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook.ts` | Builds `lessons.json`. |
| 4780 | `tools/import-explorer-m1.ts` | `npm run lesson:import:explorer-m1`. |

### (c) Unused, removed

| Path | Why it is dead |
|---|---|
| `lib/academy/lessons/content/_template.ts` | Scaffold. No import. |
| `lib/academy/lessons/spreadsheet-schema.ts` | Old Explorer column names (`lessonId`, `gameArchetype`, …) and an archetype-to-type map. Only re-exported. The master uses the same game-type slugs as the player (`word-drop`, `binary-choice`, …). |
| `tools/import-lesson-from-sheet.mjs` | Wrote baked `m1-l*.ts` from `Lesson-Details.csv` + `Screens.csv`. `npm run lesson:import` pointed here and is removed. |
| `tools/import-explorer-workbook.mjs` | Wrote `content/data/explorer/`. Not a package script. |
| `tools/export-course-authoring.ts` | Exported the empty `LESSON_DEFINITIONS` map back into `templates/lesson-authoring/`. |
| `tools/dump-explorer-rows.mjs`, `tools/_dump-l3.mjs`, `tools/_find-ids.mjs`, `tools/_inspect-xlsx.mjs`, `tools/_parse-xlsx.mjs`, `tools/_search-xlsx.mjs` | One-off workbook dumps. No lesson copy of their own. |

## Files removed

48 files, 443,662 bytes. The byte table is `archive/stage2-lesson-files/README.md`. Largest items:

| Bytes | Path |
|---:|---|
| 47276 | `tools/import-explorer-workbook.mjs` |
| 38298 | `tools/import-lesson-from-sheet.mjs` |
| 22552 | `templates/lesson-authoring/Screens.csv` |
| 20085 | `lib/academy/lessons/content/data/explorer/m1-l2.ts` |
| 19853 | `lib/academy/lessons/content/data/explorer/m1-l2.json` |
| 15472 | `lib/academy/lessons/content/data/explorer/m1-l4.ts` |
| 15240 | `lib/academy/lessons/content/data/explorer/m1-l4.json` |
| 14657 | `lib/academy/lessons/content/_template.ts` |
| 13264 | `tools/export-course-authoring.ts` |
| 12588 | `lib/academy/lessons/content/m1-l1.ts` |
| 12502 | `lib/academy/lessons/content/data/explorer/m1-l1.ts` |
| 12270 | `lib/academy/lessons/content/data/explorer/m1-l1.json` |
| 12040 | `templates/lesson-authoring/example-m1-l1/Generated-m1-l1.ts` |
| 12022 | `templates/lesson-authoring/Generated-m1-l1.ts` |
| 11971 | `lib/academy/lessons/content/data/explorer/m1-l3.ts` |
| 11856 | `lib/academy/lessons/content/m1-l4.ts` |
| 11739 | `lib/academy/lessons/content/data/explorer/m1-l3.json` |
| 11445 | `lib/academy/lessons/content/m1-l3.ts` |
| 11089 | `lib/academy/lessons/content/m1-l2.ts` |
| 10806 | `lib/academy/lessons/content/m1-l5.ts` |
| 10386 | `templates/lesson-authoring/Generated-m1-l5.ts` |

The baked content files alone (`content/m1-l1.ts`–`m1-l5.ts` plus `content/data/explorer/`) are about 220 KB. That is the unused content called out in the stage 1 notes.

## Parity summary

Compared against the master workbook on trimmed text, with spaces collapsed, line breaks kept, and curly quotes straightened. Capitalization still counts. A cell whose whole value is `copied` is resolved from that row's Explorer cell first.

Master shape: 110 rows on each cohort sheet (26 scenario beats + 84 playable screens) and 27 Lesson Details rows (9 lessons × 3 cohorts).

| Source | Fields that match | Fields that differ | Of those, old-only | Notes |
|---|---:|---:|---:|---|
| `Screens1.csv` | 825 | 669 | 533 | Live Pathfinder and Maverick copy. No scenario beats. |
| `workbook.xlsx` sheet Explorer M1 Screens | 586 | 48 | 20 | Same grid as the master. 26 of the diffs are an empty Audio column. |
| `lessons.json` (what Explorer plays) | 528 | 33 | 32 | Includes story beats. |
| `intro.json` | 1 | 2 | 2 | "goes" vs "moves", and a shorter image brief. |
| `narration.csv` | 21 | 29 | 13 | 25 beats, aligned in order after the intro. |
| `Lesson-Details.csv` | 143 | 19 | 6 | Shared titles and characters vs per-cohort master rows. |
| Baked TS/JSON and authoring templates | — | — | 909 unique strings | Listed in the full diff. Many are the same sentence stored as both `.json` and `.ts`. |

### Game types

`lessons.json` game types match the Explorer sheet. `Screens1.csv` does not, on these screens for every cohort:

| Screen | Screens1.csv | Master |
|---|---|---|
| Lesson 2 screen 4 | `budget-select` | `multiple-choice` |
| Lesson 6 screen 7 | `allocation-slider` | `drag-to-target` |
| Lesson 7 screen 4 | `savings-goal` | `binary-choice` |
| Lesson 7 screen 5 | `binary-choice` | `savings-goal` |
| Lesson 7 screen 6 | `multiple-choice` | `binary-choice` |
| Lesson 8 screen 8 | `binary-choice` | `completion` |

`Screens1.csv` also has lesson 8 screens `7-alt` and `9`. The master has `7-games` instead of `7-alt`, and no screen `9`.

### Lesson details the master changes

- Lesson 6 title: live CSV says "Stay Above Zero". Master says "The movie night" for every cohort.
- Lesson 7 title: live CSV says "Levelling up". Master says "Leveling up".
- Explorer lesson 3 lead: live CSV and `lessons.json` say Mia. Master says Lars. The lesson 3 screens already follow Lars.
- Maverick lead: live CSV says Aiden on every lesson. Master says Senna. Maverick screen copy in `Screens1.csv` is still the Aiden story.
- Master adds a per-cohort `Characters` cast (Pippa, Mason, Max, Mom, Dad, and others). The live CSV has a single support-character cell.

### Audio

26 Explorer clips are on disk and in `manifest.json`. Nine master filenames differ from that manifest (new hashes, files not in the repo):

- `explorer-m1-intro-beat1-3cb1a9a8.mp3` (disk has `explorer-m1-intro-beat1-6a9361ab.mp3`)
- `explorer-m1-l2-beat1-cff52583.mp3` (disk has `explorer-m1-l2-beat1-7a5ee3c6.mp3`)
- `explorer-m1-l2-beat2-923533ed.mp3` (disk has `explorer-m1-l2-beat2-f61aa9bb.mp3`)
- `explorer-m1-l4-beat2-e3a30f92.mp3` (disk has `explorer-m1-l4-beat2-ed7459dc.mp3`)
- `explorer-m1-l4-beat3-32c15d3e.mp3` (disk has `explorer-m1-l4-beat3-e61399db.mp3`)
- `explorer-m1-l5-beat3-dfde6164.mp3` (disk has `explorer-m1-l5-beat3-63e30b80.mp3`)
- `explorer-m1-l6-beat4-52418502.mp3` (disk has `explorer-m1-l6-beat4-89cafab4.mp3`)
- `explorer-m1-l7-beat3-9806274c.mp3` (disk has `explorer-m1-l7-beat3-33ba5d20.mp3`)
- `explorer-m1-l9-beat1-96835870.mp3` (disk has `explorer-m1-l9-beat1-0f124ac0.mp3`)

Pathfinder and Maverick each name 26 clips. None of those files exist under `public/academy-audio/`.

The Explorer workbook's Audio column is blank on every beat. Clips are joined through `narration.csv` and `manifest.json`. The full diff lists each blank cell against the master filename.

## Old-only content (not in the master)

This is the preservation list. Master wins, so stage 3 must not assume these strings will be recreated from the master. They remain in the archive, and the Module 2 sheet remains inside the kept workbook.

1. **Explorer Module 2** (`workbook.xlsx` sheet `Explorer M2 Screens`): 99 content rows, lessons 1–9, including branching screens and scenario beats. The converter reads only the first sheet and rejects module numbers other than 1, so this sheet is not in `lessons.json` and is not played. 307 filled fields, 206 of which do not appear anywhere in the master. The full text is in the diff under "Old-only: Explorer Module 2".
2. **`Screens1.csv` Pathfinder and Maverick stories**, plus the older Explorer column in that same file. 533 differing fields are not in the master. Examples: Holly's mall and eyelash story, Aiden's delivery-gig and earbud story, lesson 2 screen 4 `budget-select`, lesson 8 screens `7-alt` and `9`.
3. **Baked lessons 1–5** (`m1-l1.ts`–`m1-l5.ts`, `content/data/explorer/`, and `templates/lesson-authoring/Generated-m1-l*.ts`). Their screen copy is an earlier draft (Holly at the mall, Lars shop/phone-case variants, lesson titles such as "Money In, Money Out"). Unique old-only strings across removed files: 909, with the same sentence often repeated in a JSON/TS pair.
4. **Character roster rows** that the master Lesson Details cast does not use: Lucas, Dash, Immi, Eva, Tom. Immi still appears inside old Pathfinder screen copy. The master Maverick cast uses Senna, Max, and Saskia. The master Pathfinder cast uses Holly, Pippa, and Senna.
5. **Titles and spellings** only in the live details file: "Stay Above Zero", "Levelling up".
6. **Intro sentence** "goes from being broke" (`intro.json` and the played intro). The master says "moves from being broke".
7. **Image briefs** that omit the master's "(Senna younger)" tag. The converter currently requires the workbook brief to equal the narration brief, so those shorter briefs are load-bearing for a re-import today.
8. **Authoring instructions** in `templates/lesson-authoring/INSTRUCTIONS.md` (how to fill the old two-CSV kit). Not player copy. Archived with the kit.

## What still renders

| Cohort | Route | Source today |
|---|---|---|
| Explorer | `/dashboard/academy/lesson/1` … `/9` | `lessons.json` |
| Pathfinder | same routes | `Screens1.csv` + `Lesson-Details.csv` |
| Maverick | same routes | `Screens1.csv` + `Lesson-Details.csv` |
| Dev gallery | `/dashboard/academy/lesson/shell` | `design-shell.ts` |

No lesson route was pointed at the deleted files.

## What blocks stage 3

1. `parseAuthoringTable` reads the first worksheet only. The master has four sheets, and Pathfinder and Maverick are not sheet 1.
2. The Explorer converter rejects any row whose module is not 1, skips the intro row, and throws when an image brief does not match `narration.csv`. Pointing it at the master fails. The reader has to be new, not a tweak that still requires `intro.json` plus narration.
3. Lesson Details changed shape: one row per cohort, with `Main Character`, `Characters`, `Skill Name`, and `Skill ID`. The loader expects Field/Value rows and one character set shared by all cohorts.
4. Nine Explorer audio filenames in the master are not the files on disk. Pathfinder and Maverick audio is named and not shipped. A reader that copies those filenames into `AUDIO:` will 404 until the clips exist.
5. Maverick's played story is still Aiden. The master story is Senna, and several master rows say the art does not exist yet (Max, Saskia, older Senna). Shipping the master copy without that art changes broken-image behavior.
6. Module 2 exists only on `workbook.xlsx` sheet 2. A reader that trusts the master alone will drop it. Decide whether Module 2 stays in the product before deleting the workbook.
7. `manifest.json` is what the Academy map uses to start the lesson 1 intro clip on tap. The reader has to keep a real file on that gesture.
8. `Screens1.csv` lesson 8 uses `7-alt` and screen `9`. The master uses `7-games` and ends on screen `8`. The cash-path tests assert the live sheet. They will need an update when the reader switches sources, not before.

## Full diff

The sections below are the field-by-field list. "OLD-ONLY" means the old value (12 characters or more, ignoring case and extra space) does not occur anywhere in the master workbook. "master wins" means the values differ and the master text is the one to publish later.

## Parity diff

Compared on normalized text: trim, collapse spaces, keep line breaks, and straighten curly quotes and dashes. Capitalization still counts. A `copied` cell in an old combined sheet is resolved from that row's Explorer cell before compare. Master wins every difference. A field is marked OLD-ONLY when its normalized text (12 characters or more) does not appear anywhere in the master workbook.

Master rows: Explorer 110, Pathfinder 110, Maverick 110, Lesson Details 27. Scenario beats: Explorer 26, Pathfinder 26, Maverick 26.


### Screens1.csv versus the three cohort sheets

`Screens1.csv` is what Pathfinder and Maverick play today, and it is the Explorer fallback. It has no scenario-beat rows and no audio column. Pathfinder settings live in the `Game Settings` column.


#### Screens1.csv — explorer

Rows in this source: 85. Master explorer rows: 110.

#### explorer L1 S1 — text (OLD-ONLY)

Old:

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be ______ right away!
```

Master:

```
Lars just got $20 for his birthday! He runs to the store, but his brain tricks him into thinking cash must be ______ right away!
```


#### explorer L1 S1 — settings (master wins)

Old:

```
(blank)
```

Master:

```
OPTIONS: spent | saved | hidden
CORRECT: spent
```


#### explorer L1 S1 — error (OLD-ONLY)

Old:

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```

Master:

```
(blank)
```


#### explorer L1 S2 — text (OLD-ONLY)

Old:

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...
```

Master:

```
Lars buys a giant bag of sour worms and a fidget spinner. He's super happy, but ten minutes later...
```


#### explorer L1 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🍬 ...the candy is gone and the toy feels boring.
CHOICE B: 💵 ...his $20 cash magically reappears.
CORRECT: A
```

Master:

```
CHOICE A: 🍬 ...the candy is gone and the toy feels boring.
CHOICE B: 💵 ...his $20 magically comes back.
CORRECT: A
```


#### explorer L1 S2 — error (OLD-ONLY)

Old:

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```

Master:

```
(blank)
```


#### explorer L1 S3 — text (OLD-ONLY)

Old:

```
Lars's money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```

Master:

```
Lars's money is gone, and the fun lasted only 10 minutes. Tap each item to see if it's short fun or fun that lasts!
```


#### explorer L1 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: 🍬 Sour Worms
SHORT: 🍿 Cinema Popcorn
LONG: 🎧 Wireless Headphones
LONG: 🛹 Skateboard
```

Master:

```
ITEMS:
SHORT: 🍬 Sour worms
SHORT: 🍿 Movie popcorn
LONG: 🎧 Wireless headphones
LONG: 🛹 Skateboard
```


#### explorer L1 S4 — text (OLD-ONLY)

Old:

```
Your turn! Drag each item into the correct bucket.
```

Master:

```
Your turn! Drag each item into the right bucket. How long will the fun really last?
```


#### explorer L1 S4 — image (master wins)

Old:

```
(blank)
```

Master:

```
not allowed
```


#### explorer L1 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: 🍕 Pizza slice
SHORT: 🥤 Bubble tea with all the toppings
LONG: 🎮 Gaming controller
LONG: 🃏 Deck of cards
```

Master:

```
ITEMS:
SHORT: 🍕 Pizza slice
SHORT: 🥤 Slushie with extra syrup
LONG: 🎮 Game controller
LONG: 🃏 Deck of cards
```


#### explorer L1 S5 — text (OLD-ONLY)

Old:

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```

Master:

```
The next day, Lars gets his $5 allowance. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### explorer L1 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 To trick his brain into buying fast.
CHOICE B: ❤️ Because the game creators love him.
CORRECT: A
```

Master:

```
CHOICE A: 🧠 To trick his brain into buying fast.
CHOICE B: ❤️ Because the game makers love him.
CORRECT: A
```


#### explorer L1 S5 — error (master wins)

Old:

```
Don't fall for the flashing countdown!
```

Master:

```
Don't fall for the flashing countdown! Try again!
```


#### explorer L1 S6 — text (OLD-ONLY)

Old:

```
Help Lars by giving him a 'buy freeze' so his brain has time to think.
```

Master:

```
Help Lars by giving him a 'buy freeze', so his brain has time to think.
```


#### explorer L1 S6 — settings (master wins)

Old:

```
HOLD: ❄️ HOLD TO FREEZE ❄️
```

Master:

```
HOLD: ❄️ HOLD TO FREEZE ❄️
FROZEN: ❄️ FROZEN ❄️
SUCCESS: Frozen! Now Lars has time to think.
```


#### explorer L1 S7 — text (OLD-ONLY)

Old:

```
The freeze worked!

The next morning, Lars realized he didn't even want that skin anymore.

He kept his money safe for a new gaming headset. 🎧

Congratulations for helping him avoid wasting his money! 🎉
```

Master:

```
The freeze worked! The next morning, Lars doesn't even want that skin anymore. What did the freeze help him do with his $5?
```


#### explorer L1 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: Continue → GO Screen 8
```

Master:

```
CHOICE A: 💰 Keep his $5 safe
CHOICE B: 🎮 Buy the skin even faster
CORRECT: A
```


#### explorer L1 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### explorer L2 S1 — text (OLD-ONLY)

Old:

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```

Master:

```
Lars promised Senna a $10 phone case for his birthday on Saturday. Lars only has the $5 he kept safe. True or false: he can buy the case now.
```


#### explorer L2 S1 — error (OLD-ONLY)

Old:

```
Nope! That cash is already gone.
```

Master:

```
(blank)
```


#### explorer L2 S2 — text (OLD-ONLY)

Old:

```
Lars spent all his money on things he wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'
```

Master:

```
Lars spent his birthday money on things he wanted, and saved nothing for things he needs. Help him sort each item.
```


#### explorer L2 S2 — image (master wins)

Old:

```
(blank)
```

Master:

```
not allowed
```


#### explorer L2 S2 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: 📱 Phone case (birthday present)
NEED: 🔌 Phone cable
WANT: 🍫 Beast Munch
WANT: 🎮 New game skin
```

Master:

```
ITEMS:
NEED: 📱 Phone case (birthday present)
NEED: 🔌 Phone charging cable
WANT: 🍫 Fancy chocolate bar
WANT: 🎮 New game skin
```


#### explorer L2 S3 — text (OLD-ONLY)

Old:

```
Which item is the one Lars 'Needs' to buy before he spends money on what he 'Wants' to buy?
```

Master:

```
Needs come before wants. In each round, tap the one Lars should buy first.
```


#### explorer L2 S3 — settings (OLD-ONLY)

Old:

```
ROUNDS:
A: 📱 A new phone case, even though his old one is still fine | B: 🎁 A new phone case he promised his brother | CORRECT: B
A: 💡 A light for his bike to be seen in the dark | B: 🖱️ A new gaming mouse with lights (his old one still works) | CORRECT: A
A: 🍱 Buy lunch for all his friends and have nothing left | B: 🚍 A bus pass to get him to school | CORRECT: B
```

Master:

```
ROUNDS:
A: 📱 A new case for his own phone (his is fine) | B: 🎁 The phone case he promised Senna | CORRECT: B
A: 💡 A bike light so he's seen at night | B: 🖱️ A glowing game mouse (his works fine) | CORRECT: A
A: 🍱 Pay for lunch for all his friends | B: 🥪 Buy lunch at school for himself | CORRECT: B
```


#### explorer L2 S4 — game type (OLD-ONLY)

Old:

```
budget-select
```

Master:

```
multiple-choice
```


#### explorer L2 S4 — text (OLD-ONLY)

Old:

```
You have $30 left. Check the boxes to buy what you actually need.
```

Master:

```
Lars writes a list of things he might buy next. Which ones does he really need? Select all that apply.
```


#### explorer L2 S4 — image (master wins)

Old:

```
not allowed
```

Master:

```
lars-sitting-512.webp
```


#### explorer L2 S4 — settings (OLD-ONLY)

Old:

```
TOTAL: 30
ITEMS:
NEED: 🚍 Bus Pass ($15)
WANT: ⚡Energy Drink ($10)
NEED: 🔌 Phone Cable ($15)
CORRECT: bus,cable
```

Master:

```
CHOICE A: 🎒 A new backpack
CHOICE B: 🥤 Fancy smoothie
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```


#### explorer L2 S4 — error (OLD-ONLY)

Old:

```
Uncheck the thing you don't really need.
```

Master:

```
(blank)
```


#### explorer L2 S5 — text (OLD-ONLY)

Old:

```
Lars has $25 💰
He needs $20 for Senna's phone case 🎁
Slide to save at least $20 👇
```

Master:

```
On Friday, Lars earns $10 helping Mom with chores. Now he has $15. The phone case costs $10.

Slide to keep at least $10 for the gift.
```


#### explorer L2 S5 — settings (OLD-ONLY)

Old:

```
TOTAL: 25
KEEP: 20
ITEM: Phone case
```

Master:

```
TOTAL: 15
KEEP: 10
ITEM: 🎁 Phone case
```


#### explorer L2 S5 — error (OLD-ONLY)

Old:

```
Slide until $20 is locked for the gift.
```

Master:

```
(blank)
```


#### explorer L2 S6 — text (OLD-ONLY)

Old:

```
Lars has only $10 left in his savings and sees a $5 bundle-deal for his favourite lemonade. Drag the choices in the correct order, starting with what would be best for Lars to do.
```

Master:

```
Lars has $5 left after saving the gift money. At the store, a sign says 2-FOR-1 JUICE! Rank his choices from best to worst.
```


#### explorer L2 S6 — image (master wins)

Old:

```
lars-deciding-512.webp
```

Master:

```
not allowed
```


#### explorer L2 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Don't buy anything - keep the $10 for 'needs'.
ITEMS: Choose something cheaper, so he has some money left.
ITEMS: Borrow money from dad to buy the lemonade.
ORDER: keep,cheaper,borrow
```

Master:

```
ITEMS: 🫙 Keep his $5 for things he needs.
ITEMS: 🧃 Buy the deal while it lasts.
ITEMS: 🙅 Borrow money to get the deal.
ORDER: keep, buy, borrow
```


#### explorer L2 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Not quite! Keeping his $5 comes first. Try again!
```


#### explorer L2 S7 — text (OLD-ONLY)

Old:

```
Fast forward to the next week. Drag the gift to Senna to help Lars deliver his promise.
```

Master:

```
It's Saturday, Senna's birthday, and the party is about to start. Drag the gift to Senna so Lars can keep his promise.
```


#### explorer L2 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: concept-gift-box / TARGET: senna-celebrating
```

Master:

```
SOURCE: concept-gift-box
TARGET: senna-celebrating
SUCCESS: Promise kept! Happy birthday, Senna! 🎉
```


#### explorer L2 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### explorer L3 S1 — text (OLD-ONLY)

Old:

```
Mia spent all her pocket money. She accidentally steps on Holly's headphones and breaks them. Holly crashes out because:
```

Master:

```
He accidentally breaks Senna's headphones. What's the problem Lars faces?
```


#### explorer L3 S1 — image (OLD-ONLY)

Old:

```
holly-mia-sidebyside.webp
```

Master:

```
lars-senna-chatting.webp
```


#### explorer L3 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Mia has no money to buy a new pair
CHOICE B: Mia tries to fix them with sticky tape and now they're even worse
CHOICE C: the dog runs off with one of the pieces
CORRECT: A
```

Master:

```
CHOICE A: 💸 Lars has no money for a new pair.
CHOICE B: 🩹 Lars tapes them up and makes them worse.
CHOICE C: 🐶 A dog runs off with one of the pieces.
CORRECT: A
```


#### explorer L3 S1 — error (OLD-ONLY)

Old:

```
Haha, maybe. Try again!
```

Master:

```
(blank)
```


#### explorer L3 S2 — text (OLD-ONLY)

Old:

```
Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.
```

Master:

```
Where did his money go? New headphones cost $20, but Lars's wallet is empty. Drag everything Lars bought into the Spent bucket.
```


#### explorer L3 S2 — image (master wins)

Old:

```
(blank)
```

Master:

```
not allowed
```


#### explorer L3 S2 — settings (OLD-ONLY)

Old:

```
TOTAL: $40
ITEMS:
SPENT: 🧸 Squishy toy - $25
SPENT: 🫧 Slime - $8
SPENT: 🍫 Snacks - $7
```

Master:

```
TOTAL: $20
ITEMS:
SPENT: 🐙 Squishy toy - $10
SPENT: 🫧 Slime - $5
SPENT: 🍫 Snacks - $5
```


#### explorer L3 S3 — text (OLD-ONLY)

Old:

```
Holly explains that keeping Spare Cash gives you options. Match the event to what's possible if you have cash:
```

Master:

```
Senna isn't upset for long, but Lars hates this feeling. Senna says keeping Cash for Emergencies gives you choices. Match each event to what you could do.
```


#### explorer L3 S3 — image (master wins)

Old:

```
holly-hands-on-hips-512.webp
```

Master:

```
not allowed
```


#### explorer L3 S3 — settings (OLD-ONLY)

Old:

```
PAIRS:
I broke my sister's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favourite game now
```

Master:

```
PAIRS:
I broke my brother's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favorite game now
```


#### explorer L3 S4 — text (OLD-ONLY)

Old:

```
Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.
```

Master:

```
Senna helps Lars make a plan, so he's never caught out again. Put the plan in order, first to last.
```


#### explorer L3 S4 — settings (OLD-ONLY)

Old:

```
ITEMS: 💵 Get your pocket money.
ITEMS: 🫙 Move a small amount to your Emergencies jar.
ITEMS: 🎮 Spend what is left on fun.
ORDER: get-your-pocket-money-0,move-a-small-amount-to-your-emergencies-jar-1,spend-what-is-left-on-fun-2
```

Master:

```
ITEMS: 💵 First, Lars gets his allowance.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: allowance, jar, fun
```


#### explorer L3 S5 — text (OLD-ONLY)

Old:

```
Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Mia do?
```

Master:

```
A few weeks later, Lars has saved $20, just enough for Senna's new headphones. Then he sees a $5 toy car. "I'll buy it now and save more next week," he thinks. What should he do?
```


#### explorer L3 S5 — image (master wins)

Old:

```
mia-thinking
```

Master:

```
lars-deciding-512.webp
```


#### explorer L3 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: Buy the toy and save $10 more next week.
CHOICE B: Buy the headphones to fix what she broke first.
CHOICE C: Buy the toy and hope the headphones don't cost $40.
CORRECT: B
```

Master:

```
CHOICE A: 🚗 Buy the toy car and save $5 more next week.
CHOICE B: 🎧 Buy Senna's new headphones first.
CHOICE C: 🤞 Buy the toy car and hope headphones cost less.
CORRECT: B
```


#### explorer L3 S5 — error (OLD-ONLY)

Old:

```
That's a trap! Stick to the plan to avoid stress later.
```

Master:

```
That's a trap! Stick to the plan, so there's no stress later. Try again!
```


#### explorer L3 S6 — text (OLD-ONLY)

Old:

```
Because I didn't ______ everything, I had ______ to ______ the headphones immediately.
```

Master:

```
Lars thinks: "Because I didn't ______ it all, I had cash to ______ Senna's headphones right away."
```


#### explorer L3 S6 — image (master wins)

Old:

```
mia-celebrating
```

Master:

```
lars-celebrating-512.webp
```


#### explorer L3 S6 — settings (OLD-ONLY)

Old:

```
OPTIONS: save | spend | cash for emergencies | borrowed money | replace | throw away
CORRECT: spend, cash for emergencies, replace
```

Master:

```
OPTIONS: 💸 spend | 🫙 save | 🔧 replace | 🗑️ throw away
CORRECT: 💸 spend, 🔧 replace
```


#### explorer L3 S6 — error (OLD-ONLY)

Old:

```
Not quite. Try another combo!
```

Master:

```
(blank)
```


#### explorer L3 S7 — text (OLD-ONLY)

Old:

```
Mia could fix the problem because she had cash for emergencies. What are the other benefits of not spending all of your money? Select the best answer:
```

Master:

```
Lars could replace the headphones because he kept some cash aside. Which are good things about keeping some money? Pick all that apply.
```


#### explorer L3 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: If I lose something, I can replace it myself.
CHOICE B: I won't have to ask my parents for money if I need something.
CHOICE C: I can save for a big goal instead of wasting it on small stuff that doesn't last.
CHOICE D: I worry less if I can afford things that I want, or have to buy.
CHOICE E: All of the above.
CORRECT: E
```

Master:

```
CHOICE A: 🔧 If something breaks, I can replace it.
CHOICE B: 🎯 I can save for something big.
CHOICE C: 😌 I worry less about paying for things.
CHOICE D: 🛍️ I can buy every deal I see.
CORRECT: A+B+C
```


#### explorer L3 S7 — error (OLD-ONLY)

Old:

```
Yes, but take a look at the other options and see if there's a better answer.
```

Master:

```
(blank)
```


#### explorer L3 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### explorer L4 S1 — text (OLD-ONLY)

Old:

```
Senna’s whole group is buying a game skin before it leaves the shop. Everyone’s saying it’ll be gone soon. Lars sees Senna hold off anyway. What skill is Senna practicing?
```

Master:

```
Lars's friends are all buying the game skin before the timer runs out. Mason sees that Lars is holding off. What is Lars really doing by waiting?
```


#### explorer L4 S1 — image (master wins)

Old:

```
lars-senna-sidebyside.webp
```

Master:

```
lars-mason-sidebyside.webp
```


#### explorer L4 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Senna is just slow at clicking.
CHOICE B: Senna has run out of money.
CHOICE C: Senna stops to think.
CORRECT: C
```

Master:

```
CHOICE A: 🐢 Lars is just slow at clicking.
CHOICE B: 🫙 Lars has run out of money.
CHOICE C: 🧠 Lars stops to think.
CORRECT: C
```


#### explorer L4 S1 — error (OLD-ONLY)

Old:

```
Look again at what Senna is choosing to do.
```

Master:

```
(blank)
```


#### explorer L4 S2 — text (OLD-ONLY)

Old:

```
Senna explains why he waited: "Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed."

Drag the steps into order.
```

Master:

```
The next day, Mason asks why Lars waited. "First I saw the countdown. Then I remembered my buy freeze," Lars says. Put Lars's story in order, first to last.
```


#### explorer L4 S2 — settings (OLD-ONLY)

Old:

```
ITEMS: 👀 Senna sees the one-time offer.
ITEMS: 🧠 Senna remembers the price could drop later.
ITEMS: ⏳ Senna waits a day and checks again.
ITEMS: 😊 Senna is happy he waited - he can buy the same item for even less.
ORDER: senna-sees-the-one-time-offer-0,senna-remembers-the-price-could-drop-later-1,senna-waits-a-day-and-checks-again-2,senna-is-happy-he-waited-he-can-buy-the-same-item-for-even-less-3
```

Master:

```
ITEMS: ⏰ Lars sees the countdown.
ITEMS: 🧠 He remembers his buy freeze.
ITEMS: 🏷️ Next day, the skin is half price.
ITEMS: 😊 Lars is glad he waited.
ORDER: countdown, freeze, half, glad
```


#### explorer L4 S3 — text (OLD-ONLY)

Old:

```
Which one helps Lars stop and think?
```

Master:

```
Lars's head is buzzing about the skin. In each round, which thought helps him stop and think?
```


#### explorer L4 S3 — settings (master wins)

Old:

```
(blank)
```

Master:

```
ROUNDS:
A: ⏰ It ends soon. I have to buy it now! | B: 💰 I can wait and maybe get it cheaper. | CORRECT: B
A: 🔥 It looks so cool. I need it right now! | B: 😴 I'll sleep on it and decide tomorrow. | CORRECT: B
A: 👥 Everyone has it. I can't be left out! | B: 💬 I'll ask my friends if it's any good. | CORRECT: B
```


#### explorer L4 S3 — error (OLD-ONLY)

Old:

```
That thought is rushing you. Pick the one that helps you stop.
```

Master:

```
(blank)
```


#### explorer L4 S4 — text (OLD-ONLY)

Old:

```
Select which parts of the sign are making Lars rush.
```

Master:

```
A bright sign outside a store grabs Lars's eye. Which parts of the sign are trying to make him rush? Pick all that apply.
```


#### explorer L4 S4 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CHOICE A: DON'T MISS OUT!
CHOICE B: ONLY 2 LEFT!
CHOICE C: ENDS TOMORROW!
CHOICE D: Made in France
CHOICE E: Quality checked
CORRECT: A+B+C
```


#### explorer L4 S4 — error (master wins)

Old:

```
That's just sign info, not a rush trick.
```

Master:

```
Hold up! That's just sign info, not a rush trick. Try again!
```


#### explorer L4 S4 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Options match the existing sign art (fishing-rod-sign.webp).
```


#### explorer L4 S5 — text (OLD-ONLY)

Old:

```
Lars gets a limited-time offer for extra lives in his game. He remembers Senna's advice and stops. What should he ask himself?
```

Master:

```
Lars gets a limited-time offer for extra lives in his game. He remembers the skin that dropped to half price, so he pauses. What should he ask himself? Pick all that apply.
```


#### explorer L4 S5 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CHOICE A: Do I really need this?
CHOICE B: Do I want it now, or is something rushing me?
CHOICE C: Will I have enough left for my goals?
CHOICE D: CLICK HERE TO BUY NOW!
CORRECT: A+B+C
```


#### explorer L4 S5 — error (OLD-ONLY)

Old:

```
Not quite! That button is trying to do the thinking for you. Don't let it!
```

Master:

```
(blank)
```


#### explorer L4 S6 — text (OLD-ONLY)

Old:

```
Lars chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.
```

Master:

```
Lars keeps his money instead of buying extra lives. Drag his money from Spend Now to Save for Later.
```


#### explorer L4 S6 — settings (master wins)

Old:

```
(blank)
```

Master:

```
SOURCE: 🛒 Spend Now
TARGET: 🐷 Save for Later
ITEM: money-coin.webp
IMAGE: piggy-bank.webp
SUCCESS: Money saved!
```


#### explorer L4 S7 — text (OLD-ONLY)

Old:

```
Lars wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.
```

Master:

```
Lars's startup money started at $0. He put the money from three things he skipped into his envelope. Drag each one into the box to watch his startup money climb.
```


#### explorer L4 S7 — settings (OLD-ONLY)

Old:

```
TARGET: 20
LABEL: Savings
DROP: Things Lars didn't buy
ITEMS: 🍫 Snacks at school ($5) 🎮 Extra lives bundle ($5) 🔦 Flashlight ($10)
```

Master:

```
TARGET: 10
LABEL: Startup money
DROP: Things Lars didn't buy
ITEMS: 🍫 Snacks at school ($2) 🎮 Extra lives bundle ($3) ✨ Glow sticks ($5)
```


#### explorer L4 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### explorer L5 S1 — text (OLD-ONLY)

Old:

```
It is Senna's birthday. The local gelato store offers a birthday discount. Senna wants Lars to come with him and get one too. Going along so he is not left out is a ______ for Lars.
```

Master:

```
It's Mia's birthday, and the gelato shop has a birthday deal. Mia wants Lars to get one too. For Lars, his own gelato is a ______.
```


#### explorer L5 S1 — image (master wins)

Old:

```
lars-senna-sidebyside.webp
```

Master:

```
lars-mia-sidebyside.webp
```


#### explorer L5 S1 — settings (master wins)

Old:

```
(blank)
```

Master:

```
OPTIONS: 🍦 want | ✅ need | 🧾 bill
CORRECT: 🍦 want
```


#### explorer L5 S1 — error (OLD-ONLY)

Old:

```
A limited time offer does not make it a 'need'.
```

Master:

```
(blank)
```


#### explorer L5 S2 — text (OLD-ONLY)

Old:

```
The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?
```

Master:

```
The gelato costs $5. The only money Lars has is his $10 startup money. What should he do?
```


#### explorer L5 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: Skip buying his own gelato and ask Senna to share his.
CHOICE B: Buy his own because the deal is only on today
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Skip his own gelato and ask if Mia wants to share.
CHOICE B: 🍦 Buy his own, because the deal ends today.
CORRECT: A
```


#### explorer L5 S2 — error (OLD-ONLY)

Old:

```
The bike parts are the 'need'. The gelato is the 'want'.
```

Master:

```
(blank)
```


#### explorer L5 S3 — text (OLD-ONLY)

Old:

```
The gelato is a 'need' because the deal is only available today.
```

Master:

```
True or false: the gelato is a 'Need' because the deal is only on today.
```


#### explorer L5 S3 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CORRECT: False
```


#### explorer L5 S3 — error (OLD-ONLY)

Old:

```
A limited time offer does not turn a 'want' into a 'need'.
```

Master:

```
Nope! A deal that ends today doesn't turn a want into a need. Try again!
```


#### explorer L5 S4 — text (OLD-ONLY)

Old:

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Lars right now?
```

Master:

```
Sort each item into the right bucket. Is it a want or a need for Lars right now?
```


#### explorer L5 S4 — image (master wins)

Old:

```
(blank)
```

Master:

```
not allowed
```


#### explorer L5 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: ⛑️ New helmet for the race
WANT: 🍦 His own gelato
WANT: 🍨 Extra gelato toppings
NEED: 🎫 Race registration fee
```

Master:

```
ITEMS:
NEED: 🍋 Lemons for his stand
NEED: 🥤 Paper cups for his stand
WANT: 🍦 His own gelato
WANT: 🍨 Extra gelato toppings
```


#### explorer L5 S5 — text (OLD-ONLY)

Old:

```
Lars does not want to feel left out, but the birthday deal expires today. What now?
```

Master:

```
The birthday deal is only on today. Lars feels left out without his own cup. What should he do now?
```


#### explorer L5 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🤝 Share a gelato and keep at least half of what he would otherwise have spent.
CHOICE B: 🍦 Buy one so he isn't the odd one out
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Stick with sharing Mia's gelato.
CHOICE B: 🍦 Buy his own before the deal ends.
CORRECT: A
```


#### explorer L5 S5 — error (master wins)

Old:

```
Try again!
```

Master:

```
(blank)
```


#### explorer L5 S6 — text (OLD-ONLY)

Old:

```
Put these in the order Lars should try. Best first.
```

Master:

```
Look back at Lars's trip to the gelato shop. Put what he did in order, first to last.
```


#### explorer L5 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Ask if this is a 'want' or a 'need'
ITEMS: Share a gelato with Senna
ITEMS: Buy his own because it is only today
ORDER: ask,share,buy
```

Master:

```
ITEMS: 🤔 First, Lars asks if it's a want or a need.
ITEMS: 🤝 Then he asks Mia if they can share hers.
ITEMS: 🍦 Mia says yes, and they both dig in.
ORDER: want, share, yes
```


#### explorer L5 S7 — text (OLD-ONLY)

Old:

```
Senna was happy to share the gelato without Lars having to pay for it. Lars can buy what he needs for his race.
```

Master:

```
Mia is happy to share her gelato, and Lars doesn't have to pay. What happens to his $10 startup money?
```


#### explorer L5 S7 — settings (master wins)

Old:

```
CONTINUE → GO Screen 8
```

Master:

```
CHOICE A: 🫙 It stays safe at $10
CHOICE B: 🍦 It drops to $5
CORRECT: A
```


#### explorer L5 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### explorer L6 S1 — text (OLD-ONLY)

Old:

```
Lars’s friend Mason asks him to the cinema this weekend. Ticket and popcorn are $18. Lars's mom says: “I’ll pay half if you can pay the other half.”
```

Master:

```
Mia asks Lars to the movies. The ticket and popcorn cost $10, and Mom will pay half. Lars has saved $8 from his allowance. Can he pay his half?
```


#### explorer L6 S1 — image (master wins)

Old:

```
lars-mason-chatting.webp
```

Master:

```
lars-mia-chatting.webp
```


#### explorer L6 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: True
CHOICE B: False
CORRECT: A
```

Master:

```
CHOICE A: ✅ Yes, he has enough
CHOICE B: ❌ No, he's short
CORRECT: A
```


#### explorer L6 S1 — error (OLD-ONLY)

Old:

```
Keeping some money earlier is what makes paying his half possible.
```

Master:

```
(blank)
```


#### explorer L6 S2 — text (OLD-ONLY)

Old:

```
Last week Lars almost bought a Dart Blaster 🎯. He had $15 in his money jar. What would have happened if he had bought it?
```

Master:

```
Earlier this week, Lars nearly bought a $5 mini dart blaster, but he decided he didn't need it. What would have happened if he had bought it?
```


#### explorer L6 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: 😬 He might not have had enough left to pay his half.
CHOICE B: 🎟️ The cinema ticket would have been free.
CHOICE C: 🎁 Mason would've paid for everything.
CORRECT: A
```

Master:

```
CHOICE A: 😬 He'd have $3, not enough for his $5 half.
CHOICE B: 🎟️ The movie ticket would have been free.
CHOICE C: 🎁 Mia would have paid for everything.
CORRECT: A
```


#### explorer L6 S2 — error (OLD-ONLY)

Old:

```
Buying the Dart Blaster would have left him with less than $15.
```

Master:

```
(blank)
```


#### explorer L6 S3 — text (OLD-ONLY)

Old:

```
Sort what Lars can do with the money he kept.
```

Master:

```
Because he didn't buy the blaster, Lars has $8. His half of the movie costs $5. Which are good ideas for Lars? Sort each idea into Yes or No.
```


#### explorer L6 S3 — image (master wins)

Old:

```
(blank)
```

Master:

```
not allowed
```


#### explorer L6 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
YES: 🎟️ Pay his half for the cinema
YES: 💰 Use the money for something else this weekend
NO: 🎯 Buy the dart blaster and go to the cinema
NO: 🚫 Never spend any money
```

Master:

```
ITEMS:
YES: 🎟️ Pay his $5 half
YES: 💰 Save the remaining $3 for later
NO: 🎯 Buy the dart blaster and movie ticket
NO: 🙋 Borrow $5 from Senna
```


#### explorer L6 S4 — text (master wins)

Old:

```
True or False?
```

Master:

```
True or false? Check each statement against Lars's story.
```


#### explorer L6 S4 — settings (OLD-ONLY)

Old:

```
ROUNDS:
Round 1 | Lars saved his money last week so now he can pay his half of the cinema outing. | True | False | CORRECT: A
Round 2 | Mason will pay for everything because Lars spent all his money. | True | False | CORRECT: B
Round 3 | Lars bought the Dart Blaster and now he has less than $15 left. | True | False | CORRECT: B
```

Master:

```
ROUNDS:
Round 1 | Lars kept his money earlier this week. Now he can pay his half. | True | False | CORRECT: A
Round 2 | Mia will pay for everything because Lars spent all his money. | True | False | CORRECT: B
Round 3 | Lars has to borrow from his brother Senna to go. | True | False | CORRECT: B
```


#### explorer L6 S5 — text (OLD-ONLY)

Old:

```
Lars has enough to pay his half of the $18 outing.
```

Master:

```
Lars's parents will pay half of the $10. Lars pays the other half from the $8 he has. How much will Lars have left?
```


#### explorer L6 S5 — settings (OLD-ONLY)

Old:

```
How much does Lars have left after he pays his half?
CHOICE A: 💵 $6
CHOICE B: 🎟️ $9
CHOICE C: 🫙 $0
CORRECT: A
```

Master:

```
CHOICE A: 💵 $3
CHOICE B: 🎟️ $5
CHOICE C: 🫙 $0
CORRECT: A
```


#### explorer L6 S5 — error (OLD-ONLY)

Old:

```
$15 minus $9 leaves $6.
```

Master:

```
Not quite! $8 minus $5 leaves $3. Try again!
```


#### explorer L6 S6 — text (OLD-ONLY)

Old:

```
Drag the items in order, to show what just happened.
```

Master:

```
Look back at Lars's week. Put what happened in order, first to last.
```


#### explorer L6 S6 — settings (OLD-ONLY)

Old:

```
ITEMS:
Lars didn't buy the Dart Blaster last week.
Lars has enough money and spends $9 on his half.
Lars still has $6 left.
ORDER: didn't buy, spends, left
```

Master:

```
ITEMS: 🎯 Earlier this week, Lars skips a $5 dart blaster.
ITEMS: 📱 Today, Mia asks him to the movies.
ITEMS: ✅ Lars says yes. He can pay his half!
ORDER: blaster, asks, yes
```


#### explorer L6 S7 — game type (master wins)

Old:

```
allocation-slider
```

Master:

```
drag-to-target
```


#### explorer L6 S7 — text (OLD-ONLY)

Old:

```
Lars grins and tells Mason “I’m in!”.
```

Master:

```
At the ticket counter, Mom pays her half. Drag Lars's $5 to the counter.
```


#### explorer L6 S7 — image (master wins)

Old:

```
lars-mason-sidebyside.webp
```

Master:

```
lars-mia-sidebyside.webp
```


#### explorer L6 S7 — settings (OLD-ONLY)

Old:

```
TOTAL: 15
KEEP: 9
ITEM: Cinema
Slide to move $9 from Lars's money jar to pay his half. ($6 remains.)
```

Master:

```
SOURCE: 💵 $5
TARGET: 🎟️ Ticket counter
SUCCESS: Paid his half, and $3 is still safe!
```


#### explorer L6 S7 — error (OLD-ONLY)

Old:

```
Slide until $9 is set aside for the cinema. $6 stays in the jar.
```

Master:

```
(blank)
```


#### explorer L6 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### explorer L7 S1 — text (OLD-ONLY)

Old:

```
Lars and Mia see a gelato deal. Lars ______.
```

Master:

```
Lars and Mia walk past a store with a slushie deal, on today only. Before reaching for his wallet, Lars ______.
```


#### explorer L7 S1 — settings (OLD-ONLY)

Old:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Mia to pay for it CORRECT: 🧠 stops and thinks
```

Master:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Mia to pay
CORRECT: 🧠 stops and thinks
```


#### explorer L7 S1 — error (OLD-ONLY)

Old:

```
Not quite. He needs to stop and think first.
```

Master:

```
(blank)
```


#### explorer L7 S2 — text (OLD-ONLY)

Old:

```
Lars remembers he still needs to pay for Senna's headphones that he broke. Replacing Senna's headphones is a...
```

Master:

```
Mia is designing Lars's sign. Today they buy the poster board and markers together. Lars's share is $6. Is paying his share a want or a need?
```


#### explorer L7 S2 — image (master wins)

Old:

```
lars-senna-chatting.webp
```

Master:

```
lars-thinking-512.webp
```


#### explorer L7 S2 — settings (master wins)

Old:

```
CHOICE A: ✨ Want CHOICE B: ✅ Need CORRECT: B
```

Master:

```
CHOICE A: ✨ Want
CHOICE B: ✅ Need
CORRECT: B
```


#### explorer L7 S2 — error (OLD-ONLY)

Old:

```
Replacing the headphones is a need.
```

Master:

```
(blank)
```


#### explorer L7 S4 — game type (master wins)

Old:

```
savings-goal
```

Master:

```
binary-choice
```


#### explorer L7 S4 — text (OLD-ONLY)

Old:

```
Lars has $45. Drag the items to see what is left.
```

Master:

```
Lars has $8: his $3 spare plus this week's $5 allowance. He pays his $6 share first. A slushie is $2. What should Lars do?
```


#### explorer L7 S4 — image (master wins)

Old:

```
lars-hands-on-hips-512.webp
```

Master:

```
lars-deciding-512.webp
```


#### explorer L7 S4 — settings (OLD-ONLY)

Old:

```
AVAILABLE: $45 
ITEMS: 🎧 Headphones ($40) 🍦 Gelato ($5)
```

Master:

```
CHOICE A: 🥤 Buy his own slushie with his last $2
CHOICE B: 🤝 Share one slushie with Mia
CORRECT: B
```


#### explorer L7 S4 — error (OLD-ONLY)

Old:

```
Check the total against the $45.
```

Master:

```
Hold up! His own slushie would use his last $2. Try again!
```


#### explorer L7 S5 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
savings-goal
```


#### explorer L7 S5 — text (OLD-ONLY)

Old:

```
Lars has $45. Headphones are $40. One gelato is $5. He can pay for the headphones and buy his own gelato - but would have $0 left. What should he do?
```

Master:

```
Let's check the other choice. Drag his $6 share and a $2 slushie into the box to see what Lars would have left.
```


#### explorer L7 S5 — image (master wins)

Old:

```
lars-deciding-512.webp
```

Master:

```
concept-wallet.webp
```


#### explorer L7 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🍦 Buy his own gelato ($5) CHOICE B: 🤝 Find another way so he has some money left 
CORRECT: B
```

Master:

```
AVAILABLE: $8
ITEMS: 🎨 Sign supplies ($6) 🥤 Slushie ($2)
```


#### explorer L7 S5 — error (OLD-ONLY)

Old:

```
Buying his own uses the last $5. There will be nothing left.
```

Master:

```
(blank)
```


#### explorer L7 S7 — text (OLD-ONLY)

Old:

```
Mia and Lars decide to share one gelato, so they can still enjoy the treat and Lars also has some money left over.
```

Master:

```
Lars and Mia each pay $1 and share one slushie. Drag the slushie to Mia to share it.
```


#### explorer L7 S7 — image (master wins)

Old:

```
lars-mia-chatting.webp
```

Master:

```
lars-celebrating-512.webp
```


#### explorer L7 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: 🍦 Gelato TARGET: 🤝 Share with Mia
```

Master:

```
SOURCE: 🥤 Slushie
TARGET: 🤝 Share with Mia
SUCCESS: Shared! And Lars still has $1.
```


#### explorer L7 S7 — error (OLD-ONLY)

Old:

```
Drag the gelato to share it with Mia.
```

Master:

```
(blank)
```


#### explorer L7 S8 — image (master wins)

Old:

```
lars-celebrating-512.webp
```

Master:

```
(blank)
```


#### explorer L7 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: none
```


#### explorer L7 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image left blank: the live penny-fistpump.webp is retired art.
```


#### explorer L9 S1 — text (OLD-ONLY)

Old:

```
Tap a skill. Finish all three, then tap Finish.
```

Master:

```
Tap a skill to test yourself. When all three are done, tap Finish.
```


#### explorer L9 S2 — text (OLD-ONLY)

Old:

```
Catch Impulse Spending means pausing before you spend so you don't buy on impulse.
```

Master:

```
Catch Impulse Spending means pausing before you spend. Which one is a pause?
```


#### explorer L9 S2 — settings (master wins)

Old:

```
CONTINUE → GO Screen 3
```

Master:

```
CHOICE A: 😴 Sleep on it first → GO Screen 3
CHOICE B: ⏰ Buy before the timer ends → GO Screen 3
CORRECT: A
```


#### explorer L9 S3 — text (master wins)

Old:

```
A flashing “only 1 minute left” deal is a good reason to buy straight away.
```

Master:

```
True or false: a flashing "only 1 minute left" deal is a good reason to buy straight away.
```


#### explorer L9 S3 — error (OLD-ONLY)

Old:

```
A countdown is trying to rush you.
```

Master:

```
(blank)
```


#### explorer L9 S4 — text (OLD-ONLY)

Old:

```
Choose Needs Over Wants means covering what you actually need before spending on wants.
```

Master:

```
Choose Needs Over Wants means covering what you need before you spend on wants. Which one does Lars's stand need?
```


#### explorer L9 S4 — settings (master wins)

Old:

```
CONTINUE → GO Screen 5
```

Master:

```
CHOICE A: 🍋 Lemons for his stand → GO Screen 5
CHOICE B: 🍬 A big bag of candy → GO Screen 5
CORRECT: A
```


#### explorer L9 S5 — text (OLD-ONLY)

Old:

```
Lars needs to replace broken headphones. He also wants a new game skin. What should he buy first?
```

Master:

```
Lars's school shoes have a hole, and he needs new ones. He also wants a new game skin. Which should he buy first?
```


#### explorer L9 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🎧 Headphones → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```

Master:

```
CHOICE A: 👟 School shoes → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```


#### explorer L9 S5 — error (OLD-ONLY)

Old:

```
Not quite! Which one can't wait? Try again!
```

Master:

```
(blank)
```


#### explorer L9 S6 — text (OLD-ONLY)

Old:

```
Don't Spend Money You Don't Have means not spending everything so you still have money for later.
```

Master:

```
Don't Spend Money You Don't Have means never going below zero. Lars has $4. A comic costs $7. Can he buy it?
```


#### explorer L9 S6 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 7
```

Master:

```
CHOICE A: ❌ No, he's $3 short → GO Screen 7
CHOICE B: 🙋 Yes, if he borrows $3 → GO Screen 7
CORRECT: A
```


#### explorer L9 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Hold up! Borrowing means spending money he doesn't have. Try again!
```


#### explorer L9 S7 — text (OLD-ONLY)

Old:

```
If you spend all your money now, you might not ______ something important later.
```

Master:

```
Lars kept his $10 startup money safe, then earned $5 doing chores. Now he has $15, so he can ______ his whole stand kit!
```


#### explorer L9 S7 — settings (OLD-ONLY)

Old:

```
OPTIONS: 💸 afford | ✨ want | 👀 see CORRECT: 💸 afford
CONTINUE → GO Screen 1
```

Master:

```
OPTIONS: 💸 afford | 🙈 forget | 🗑️ lose
CORRECT: 💸 afford
CONTINUE → GO Screen 1
```


#### explorer L9 S8 — image (master wins)

Old:

```
lars-celebrating-512.webp
```

Master:

```
(blank)
```


#### explorer L9 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: gold
```


#### explorer L9 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image blank as live. Gold medals medal-skill1/2/3-gold.webp exist if Melvin wants them here.
```


#### explorer L7 S3 — text (OLD-ONLY)

Old:

```
Replacing Senna's headphones comes before the gelato. Which skill is that?
```

Master:

```
Paying his share comes before the slushie. Which skill is he using?
```


#### explorer L7 S3 — image (master wins)

Old:

```
lars-thinking-512.webp
```

Master:

```
lars-hands-on-hips-512.webp
```


#### explorer L7 S3 — settings (master wins)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: B
```

Master:

```
CHOICE A: 🧠 Catch Impulse Spending
CHOICE B: ✅ Choose Needs Over Wants
CHOICE C: 💰 Don't Spend Money You Don't Have
CORRECT: B
```


#### explorer L7 S3 — error (OLD-ONLY)

Old:

```
That skill is Choose Needs Over Wants.
```

Master:

```
(blank)
```


#### explorer L7 S6 — game type (master wins)

Old:

```
multiple-choice
```

Master:

```
binary-choice
```


#### explorer L7 S6 — text (OLD-ONLY)

Old:

```
Sharing the gelato leaves Lars some money. Buying his own leaves $0. Which skill is he using when he shares?
```

Master:

```
What if the slushie cost $3? After his share, Lars has $2. Can he buy his own?
```


#### explorer L7 S6 — image (master wins)

Old:

```
lars-mia-sidebyside.webp
```

Master:

```
lars-mia-chatting.webp
```


#### explorer L7 S6 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: C
```

Master:

```
CHOICE A: ❌ No, he's $1 short
CHOICE B: 🙋 Yes, if Mia lends him $1
CORRECT: A
```


#### explorer L7 S6 — error (OLD-ONLY)

Old:

```
That skill is Don't Spend Money You Don't Have.
```

Master:

```
(blank)
```


#### explorer L8 S1 — text (OLD-ONLY)

Old:

```
Lars has $15. He sees a phone case for $9. What do you want Lars to do?
```

Master:

```
Lars sees a glow-in-the-dark yo-yo for $6. What do you want Lars to do?
```


#### explorer L8 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🛍️ Buy it. He wants it and will have money left over → SET cash=6 → GO Screen 1-buy
CHOICE B: ✋ Don’t buy it. He doesn’t need it → SET cash=15 → GO Screen 1-keep
```

Master:

```
CHOICE A: 🪀 Buy it. He wants it and will still have money left → SET cash=4 → GO Screen 1-buy
CHOICE B: ✋ Don't buy it. He doesn't need it → SET cash=10 → GO Screen 1-keep
```


#### explorer L8 S1-buy — text (OLD-ONLY)

Old:

```
Lars buys the phone case for $9. He has {cash} left.
```

Master:

```
Lars buys the yo-yo for $6. He has {cash} left.
```


#### explorer L8 S1-keep — text (OLD-ONLY)

Old:

```
Lars leaves the phone case. He still has {cash}.
```

Master:

```
Lars puts the yo-yo back and keeps walking. He still has {cash}.
```


#### explorer L8 S2 — text (OLD-ONLY)

Old:

```
Lars has {cash} left. An arcade game card is $8. What do you want Lars to do?
```

Master:

```
Lars has {cash} left when he passes the arcade. A game card costs $5. What do you want Lars to do?
```


#### explorer L8 S2 — settings (OLD-ONLY)

Old:

```
IF cash >= 8 THEN
CHOICE A: 🕹️ Pay $8 → SET cash=cash-8 → GO Screen 2-played
CHOICE B: 💰 Skip the arcade and keep the money → GO Screen 2-kept
IF cash < 8 THEN
TEXT: Lars has {cash} left. The arcade card is $8, so he can’t pay. What do you want Lars to do?
CHOICE A: 💭 See what would have happened if he hadn’t bought the case → GO Screen 2-alt
CHOICE B: 🚶 Skip the arcade → GO Screen 2-short
```

Master:

```
IF cash >= 5 THEN
CHOICE A: 🕹️ Pay $5 and play → SET cash=cash-5 → GO Screen 2-played
CHOICE B: 💰 Skip the arcade and keep the money → GO Screen 2-kept
IF cash < 5 THEN
TEXT: Lars has {cash}. The arcade card is $5, so he can't pay. What do you want Lars to do?
CHOICE A: 💭 See what would have happened if he hadn't bought the yo-yo → GO Screen 2-alt
CHOICE B: 🚶 Skip the arcade → GO Screen 2-short
```


#### explorer L8 S2-played — text (OLD-ONLY)

Old:

```
Lars pays $8 and plays the arcade. He has {cash} left.
```

Master:

```
Lars pays $5 and plays with his friends. He has {cash} left.
```


#### explorer L8 S2-kept — text (OLD-ONLY)

Old:

```
Lars skips the arcade and keeps his {cash}.
```

Master:

```
Lars skips the arcade, chats with his friends instead and keeps his {cash}.
```


#### explorer L8 S2-short — text (OLD-ONLY)

Old:

```
Lars can’t pay the $8. He skips the arcade and keeps his {cash}.
```

Master:

```
Lars can't pay the $5, so he skips it and keeps his {cash}.
```


#### explorer L8 S2-alt — text (OLD-ONLY)

Old:

```
If Lars hadn’t bought the case he would have $15 and could pay for the arcade card.
```

Master:

```
If Lars hadn't bought the yo-yo, he'd still have $10. He could pay for the card.
```


#### explorer L8 S2-alt — image (master wins)

Old:

```
lars-hands-on-hips-512.webp
```

Master:

```
lars-thinking-512.webp
```


#### explorer L8 S3 — text (OLD-ONLY)

Old:

```
Senna has $20. Friends are asking him along to a skateboard session that costs $8. What do you want Senna to do?
```

Master:

```
Meanwhile, across town, Mia has $10. Her friends invite her to a skate park session that costs $5. What do you want Mia to do?
```


#### explorer L8 S3 — image (OLD-ONLY)

Old:

```
senna-deciding-512.webp
```

Master:

```
mia-thinking.webp
```


#### explorer L8 S3 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🛹 Yes, Senna will join ($8) → SET cash=12 → GO Screen 4
CHOICE B: 💰 No, he doesn't want to spend the money → SET cash=20 → GO Screen 4-alt
```

Master:

```
CHOICE A: 🛹 Yes, Mia joins in ($5) → GO Screen 4
CHOICE B: 💰 No, she doesn't want to spend the money → GO Screen 4-alt
```


#### explorer L8 S3 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Melvin: Mia's art files in the repo are capitalized (Mia-*.webp). Rename them or confirm the lowercase names used here. Any skate park art should show Mia with her helmet on.
```


#### explorer L8 S4 — text (OLD-ONLY)

Old:

```
Senna has {cash} left. After the session, the friend group want to go for lunch. Senna is happy he said yes to the skateboarding, because now he can join the lunch too.
```

Master:

```
Mia has $5 left after a fun afternoon at the skate park. When the group goes for a snack, she's glad she said yes.
```


#### explorer L8 S4 — image (master wins)

Old:

```
senna-celebrating-512.webp
```

Master:

```
mia-celebrating.webp
```


#### explorer L8 S4-alt — text (OLD-ONLY)

Old:

```
The next day everyone is talking about how good the skateboard session was, and they all went to lunch after. Senna still has his {cash}, but he missed all of it.
```

Master:

```
The next day, everyone is talking about the skate park, and the snack after. Mia still has her $10, but she missed all of it.
```


#### explorer L8 S4-alt — image (OLD-ONLY)

Old:

```
senna-walking-lookaway-512.webp
```

Master:

```
mia-walking.webp
```


#### explorer L8 S5 — text (OLD-ONLY)

Old:

```
Later, Mia has $14. She wants a new water bottle for $9. What do you want Mia to do?
```

Master:

```
Later that afternoon, Lars has {cash}. He sees a cool water bottle for $4. What do you want Lars to do?
```


#### explorer L8 S5 — image (master wins)

Old:

```
lars-mia-chatting.webp
```

Master:

```
lars-deciding-512.webp
```


#### explorer L8 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧴 Buy the water bottle ($9) → SET cash=5 → GO Screen 5-buy
CHOICE B: 💰 Don’t buy the water bottle → SET cash=14 → GO Screen 5-save
```

Master:

```
IF cash >= 4 THEN
CHOICE A: 🧴 Buy the water bottle ($4) → SET cash=cash-4 → GO Screen 5-buy
CHOICE B: 💰 Don't buy the water bottle → GO Screen 5-save
```


#### explorer L8 S5-buy — text (OLD-ONLY)

Old:

```
Mia buys the water bottle for $9. She has {cash} left.
```

Master:

```
Lars buys the water bottle and fills it straight away. He has {cash} left.
```


#### explorer L8 S5-buy — image (master wins)

Old:

```
lars-mia-sidebyside.webp
```

Master:

```
lars-walking-512.webp
```


#### explorer L8 S5-save — text (OLD-ONLY)

Old:

```
Mia skips the water bottle. She still has {cash}.
```

Master:

```
Lars skips the water bottle for now. He still has {cash}.
```


#### explorer L8 S5-save — image (master wins)

Old:

```
lars-mia-sidebyside.webp
```

Master:

```
lars-hands-on-hips-512.webp
```


#### explorer L8 S6 — text (OLD-ONLY)

Old:

```
Mia has {cash} left. Lars asks if she wants to come to the cinema with a group of friends. What do you want Mia to do?
```

Master:

```
Then Mason messages: some friends are going bowling tonight. A game is $5. Lars has {cash}. What do you want Lars to do?
```


#### explorer L8 S6 — image (master wins)

Old:

```
lars-mia-sidebyside.webp
```

Master:

```
lars-mason-chatting.webp
```


#### explorer L8 S6 — settings (OLD-ONLY)

Old:

```
IF cash = 5 THEN
CHOICE A: 🎟️ Ask if the group will switch to a cheaper session she can afford ($5) → SET cash=0 → GO Screen 7
CHOICE B: 🚶 Skip the cinema → SET cash=5 → GO Screen 7-skip
IF cash = 14 THEN
CHOICE A: 🎬 Go to the cinema ($8) → SET cash=6 → GO Screen 7-alt
CHOICE B: 🏠 Don’t go to the cinema and save all her money → SET cash=14 → GO Screen 7-home
```

Master:

```
IF cash >= 5 THEN
CHOICE A: 🎳 Go bowling ($5) → SET cash=cash-5 → GO Screen 7
CHOICE B: 🏠 Stay home and keep his money → GO Screen 7-home
IF cash < 5 THEN
CHOICE A: 🧩 Ask if everyone can play board games at Mason's place instead (free) → GO Screen 7-games
CHOICE B: 🚶 Skip bowling → GO Screen 7-skip
```


#### explorer L8 S7 — text (OLD-ONLY)

Old:

```
You picked “Ask if the group will switch to a cheaper session she can afford ($5)”. The group said yes. Mia got her water bottle and still went to the cinema with everyone. She has {cash} left.
```

Master:

```
Lars bowls with the whole group. He has {cash} left.
```


#### explorer L8 S7 — image (master wins)

Old:

```
mia-celebrating
```

Master:

```
lars-celebrating-512.webp
```


#### explorer L8 S7-skip — text (OLD-ONLY)

Old:

```
You picked “Skip the cinema”. Mia has the new water bottle and {cash} left, and she missed the cinema.
```

Master:

```
Lars has {cash}, but he misses the night with his friends.
```


#### explorer L8 S7-skip — image (master wins)

Old:

```
lars-mia-chatting.webp
```

Master:

```
lars-sitting-512.webp
```


#### explorer L8 S7-alt (text)

```
You picked “Go to the cinema ($8)”. Mia did not buy the bottle, but she joined the group. She has {cash} left.
```


#### explorer L8 S7-home — text (OLD-ONLY)

Old:

```
You picked “Don’t go to the cinema and save all her money”. Mia still has {cash}, and she missed the bottle and the cinema.
```

Master:

```
Lars keeps his {cash}, but he misses bowling with his friends.
```


#### explorer L8 S7-home — image (master wins)

Old:

```
lars-mia-sidebyside.webp
```

Master:

```
lars-sitting-512.webp
```


#### explorer L8 S8 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
completion
```


#### explorer L8 S8 — text (OLD-ONLY)

Old:

```
Every choice you made shaped Senna's day. Spending on things that matter to you, like time with friends, can be worth it. Keeping some money back is smart too. It's about finding the right balance. That's real money thinking!
```

Master:

```
(blank)
```


#### explorer L8 S8 — image (OLD-ONLY)

Old:

```
senna-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### explorer L8 S8 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 9
```

Master:

```
MEDAL: none
```


- Master-only screen (not in this source): explorer L8 S7-games `binary-choice`

- Scenario beat count: source 0, master 26.


#### Screens1.csv — pathfinder

Rows in this source: 85. Master pathfinder rows: 110.

#### pathfinder L1 S1 — text (OLD-ONLY)

Old:

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be ______ right away!
```

Master:

```
Holly just got $25 for her birthday! She heads to a pop-up stand at the mall, but her brain tricks her into thinking cash must be ______ right away!
```


#### pathfinder L1 S1 — settings (master wins)

Old:

```
OPTIONS: Spent | Saved | Hidden
CORRECT: Spent
```

Master:

```
OPTIONS: spent | saved | hidden
CORRECT: spent
```


#### pathfinder L1 S1 — error (OLD-ONLY)

Old:

```
Not quite! Holly's friends are showing off - what's her brain pushing her to do with that $25?
```

Master:

```
(blank)
```


#### pathfinder L1 S2 — text (OLD-ONLY)

Old:

```
Holly gets her eyelashes done right away with the $25 but ten minutes later...
```

Master:

```
Holly buys a giant bag of sour candy, a fidget toy and a phone stand. She's super happy, but ten minutes later...
```


#### pathfinder L1 S2 — settings (OLD-ONLY)

Old:

```
ID: short-fun-reality
CHOICE A: 🍬 ...the initial excitement fades and her $25 is gone.
CHOICE B: 💵 ...her $25 magically reappears in her wallet.
CORRECT: A
```

Master:

```
CHOICE A: 🍬 ...the candy is gone and the gadgets feel boring.
CHOICE B: 💵 ...her $25 magically comes back.
CORRECT: A
```


#### pathfinder L1 S2 — error (OLD-ONLY)

Old:

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```

Master:

```
(blank)
```


#### pathfinder L1 S3 — text (OLD-ONLY)

Old:

```
Holly's $25 is gone and she only had a few minutes of excitement. Tap each item to see whether it's short fun or longer fun!
```

Master:

```
Holly's money is gone, and the fun lasted only 10 minutes. Tap each item to see if it's short fun or fun that lasts!
```


#### pathfinder L1 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: 🧪 Glow-in-the-dark slime kit
SHORT: 🍬 Candy salad
LONG: 🧥 Viral hoodie
LONG: 🥤 Water bottle
```

Master:

```
ITEMS:
SHORT: 🍬 Sour candy
SHORT: 🍩 Doughnut box
LONG: 🔊 Wireless speaker
LONG: 🛹 Skateboard
```


#### pathfinder L1 S4 — text (OLD-ONLY)

Old:

```
Your turn! Drag each item into the correct bucket.
```

Master:

```
Your turn! Drag each item into the right bucket. How long will the fun really last?
```


#### pathfinder L1 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: 🧋 Giant bubble tea
SHORT: 🪄 Cheap glow sticks / LED toys
LONG: 🔊 Wireless speaker for hangouts
LONG: 📓 Journal + good pen set
```

Master:

```
ITEMS:
SHORT: 🧋 Giant bubble tea
SHORT: 🍕 Pizza slice
LONG: 🎒 Backpack
LONG: 🎮 Game controller
```


#### pathfinder L1 S5 — text (OLD-ONLY)

Old:

```
Holly's playing online and a game alert flashes: "Limited time - new skin 70% off! 15 MINUTES LEFT!" Why is the game rushing her?
```

Master:

```
Back home, Holly gets her $10 allowance. Then her phone flashes: 💥 NEW SKIN 70% OFF! ONLY 15 MINUTES LEFT! 💥 Why is the game rushing her?
```


#### pathfinder L1 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 To stop her from pausing to decide if she really needs it.
CHOICE B: ❤️ Because they want to make sure she gets a good deal.
CORRECT: A
```

Master:

```
CHOICE A: 🧠 To trick her brain into buying fast.
CHOICE B: ❤️ Because the game makers love her.
CORRECT: A
```


#### pathfinder L1 S5 — error (master wins)

Old:

```
Don't fall for the flashing countdown!
```

Master:

```
Don't fall for the flashing countdown! Try again!
```


#### pathfinder L1 S6 — text (OLD-ONLY)

Old:

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, by silencing the chat alerts.
```

Master:

```
Help Holly by giving her a 'buy freeze', so her brain has time to think.
```


#### pathfinder L1 S6 — settings (OLD-ONLY)

Old:

```
HOLD: 🔕 HOLD TO SILENCE 🔕
```

Master:

```
HOLD: ❄️ HOLD TO FREEZE ❄️
FROZEN: ❄️ FROZEN ❄️
SUCCESS: Frozen! Now Holly has time to think.
```


#### pathfinder L1 S7 — text (OLD-ONLY)

Old:

```
Holly chooses to keep her money instead of giving in to the rush. She stays in control of spending.
```

Master:

```
The freeze worked! The next morning, Holly doesn't even want that skin anymore. What did the freeze help her do with her $10?
```


#### pathfinder L1 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: Continue → GO Screen 8
```

Master:

```
CHOICE A: 💰 Keep her $10 safe
CHOICE B: 🎮 Buy the skin even faster
CORRECT: A
```


#### pathfinder L2 S1 — text (OLD-ONLY)

Old:

```
Tomorrow is Mia's birthday. Holly opens her savings jar to buy the phone case she promised her sister... but the jar is completely empty. True or False: Holly can still buy the present.
```

Master:

```
Holly promised Pippa a $20 board game for her birthday on Saturday. Holly only has the $10 she kept safe. True or false: she can buy it now.
```


#### pathfinder L2 S1 — image (OLD-ONLY)

Old:

```
holly-mia-chatting.webp
```

Master:

```
(blank)
```


#### pathfinder L2 S1 — error (OLD-ONLY)

Old:

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```

Master:

```
(blank)
```


#### pathfinder L2 S2 — text (OLD-ONLY)

Old:

```
Holly spent all her money on things she wanted, but didn't save anything for things she needs to buy. Help Holly identify which items are 'Things she wants' or 'Things she needs'
```

Master:

```
Holly spent her birthday money on things she wanted, and saved nothing for things she needs. Help her sort each item.
```


#### pathfinder L2 S2 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: 📱 Phone case (birthday present)
NEED: 🔌 Phone cable
WANT: 🍫 Beast Munch
WANT: 💄 Cosmetics
```

Master:

```
ITEMS:
NEED: 🎁 Board game (birthday present)
NEED: 🔌 Phone charging cable
WANT: 🍫 Fancy chocolate bar
WANT: 🎮 New game skin
```


#### pathfinder L2 S3 — text (OLD-ONLY)

Old:

```
Which item is the one Holly 'Needs' to buy before she spends money on what she 'Wants' to buy?
```

Master:

```
Needs come before wants. In each round, tap the one Holly should buy first.
```


#### pathfinder L2 S3 — settings (OLD-ONLY)

Old:

```
ROUNDS:
A: 📱 A new phone case, even though her old one is still fine | B: 🎁 A new phone case she promised her sister | CORRECT: B
A: 🐕 A new lead for her dog as the old one broke | B: 🧥 A new hoodie that everyone at school has | CORRECT: A
A: 🍱 Buy lunch for all her friends and have nothing left | B: 🥪 Buy lunch at school with her tuckshop money | CORRECT: B
```

Master:

```
ROUNDS:
A: 🎲 A board game for herself (she has plenty) | B: 🎁 The board game she promised Pippa | CORRECT: B
A: 🥽 New swim goggles for training (hers cracked) | B: 🎧 Glowing gaming headphones (hers work fine) | CORRECT: A
A: 🍕 Pay for pizza for all her friends | B: 🥪 Buy lunch at school for herself | CORRECT: B
```


#### pathfinder L2 S4 — game type (OLD-ONLY)

Old:

```
budget-select
```

Master:

```
multiple-choice
```


#### pathfinder L2 S4 — text (OLD-ONLY)

Old:

```
You have $30 left. Check the boxes to buy what you actually need.
```

Master:

```
Holly writes a list of things she might buy next. Which ones does she really need? Select all that apply.
```


#### pathfinder L2 S4 — image (master wins)

Old:

```
not allowed
```

Master:

```
holly-sitting-512.webp
```


#### pathfinder L2 S4 — settings (OLD-ONLY)

Old:

```
TOTAL: 30
ITEMS:
NEED: 🚍 Bus Pass ($15)
WANT: ⚡ Energy Drink ($10)
NEED: 🐕 Dog lead ($15)
CORRECT: bus,dog lead
```

Master:

```
CHOICE A: 📚 Notebooks for school
CHOICE B: 🧋 Large bubble tea
CHOICE C: 💧 Water bottle
CORRECT: A+C
```


#### pathfinder L2 S4 — error (OLD-ONLY)

Old:

```
Uncheck the item you don't really 'need'.
```

Master:

```
(blank)
```


#### pathfinder L2 S5 — text (OLD-ONLY)

Old:

```
Holly has $25 💰
She needs $20 for her sister's phone case 🎁
Slide to save at least $20 👇
```

Master:

```
On Friday, Holly earns $15 helping Mom with chores. Now she has $25. The board game costs $20.

Slide to keep at least $20 for the gift.
```


#### pathfinder L2 S5 — settings (OLD-ONLY)

Old:

```
TOTAL: 25
KEEP: 20
ITEM: Phone case
```

Master:

```
TOTAL: 25
KEEP: 20
ITEM: 🎁 Board game
```


#### pathfinder L2 S5 — error (OLD-ONLY)

Old:

```
Slide until $20 is locked for the gift.
```

Master:

```
(blank)
```


#### pathfinder L2 S6 — text (OLD-ONLY)

Old:

```
Holly has only $5 left in her savings and sees a $5 bundle-deal for her favourite lemonade. Drag the choices in the correct order, starting with what would be best for Holly to do.
```

Master:

```
Holly has $5 left after saving the gift money. At the store, a sign says 2-FOR-1 SODAS! Rank her choices from best to worst.
```


#### pathfinder L2 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Don't buy anything - keep the $5 for 'needs'.
ITEMS: Choose something cheaper, so she has some money left.
ITEMS: Borrow money from dad to buy the lemonade.
ORDER: keep,cheaper,borrow
```

Master:

```
ITEMS: 🫙 Keep her $5 for things she needs.
ITEMS: 🥤 Buy the deal while it lasts.
ITEMS: 🙅 Borrow money to get the deal.
ORDER: keep, buy, borrow
```


#### pathfinder L2 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Not quite! Keeping her $5 comes first. Try again!
```


#### pathfinder L2 S7 — text (OLD-ONLY)

Old:

```
Fast forward to the next week. Drag the gift to Mia to help Holly deliver her promise.
```

Master:

```
It's Saturday, Pippa's birthday, and the party is about to start. Drag the gift to Pippa so Holly can keep her promise.
```


#### pathfinder L2 S7 — image (OLD-ONLY)

Old:

```
holly-mia-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L2 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: concept-gift-box / TARGET: mia-celebrating
```

Master:

```
SOURCE: concept-gift-box
TARGET: pippa-celebrating
SUCCESS: Promise kept! Happy birthday, Pippa! 🎉
```


#### pathfinder L2 S7 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Target art needed: Pippa (Holly's younger sister) celebrating. No Pippa art yet. RESOLVED (Cath, 25 Oct): the sister is named Pippa.
```


#### pathfinder L3 S1 — text (OLD-ONLY)

Old:

```
Holly spent all her pocket money. She accidentally steps on Mia's headphones and breaks them. Mia crashes out because:
```

Master:

```
She accidentally breaks Pippa's headphones. What's the problem Holly faces?
```


#### pathfinder L3 S1 — image (OLD-ONLY)

Old:

```
holly-mia-chatting.webp
```

Master:

```
(blank)
```


#### pathfinder L3 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Holly has no money to buy a new pair
CHOICE B: Holly tries to fix them with sticky tape and now they're even worse
CHOICE C: the dog runs off with one of the pieces
CORRECT: A
```

Master:

```
CHOICE A: 💸 Holly has no money for a new pair.
CHOICE B: 🩹 Holly tapes them up and makes them worse.
CHOICE C: 🐶 A dog runs off with one of the pieces.
CORRECT: A
```


#### pathfinder L3 S1 — error (OLD-ONLY)

Old:

```
Haha, maybe. But let's try again.
```

Master:

```
(blank)
```


#### pathfinder L3 S2 — text (OLD-ONLY)

Old:

```
Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.
```

Master:

```
Where did her money go? New headphones cost $40, but Holly's wallet is empty. Drag everything Holly bought into the Spent bucket.
```


#### pathfinder L3 S2 — settings (OLD-ONLY)

Old:

```
TOTAL: $40
ITEMS:
SPENT: 🧸 Squishy toy - $25
SPENT: 🫧 Slime - $8
SPENT: 🍫 Snacks - $7
```

Master:

```
TOTAL: $40
ITEMS:
SPENT: 🍟 Snacks after practice - $15
SPENT: 🎮 Game credits - $15
SPENT: 🔦 Mini gadgets - $10
```


#### pathfinder L3 S3 — text (OLD-ONLY)

Old:

```
Mia explains that keeping Cash for Emergencies gives you options. Match the event to what's possible if you have cash:
```

Master:

```
Pippa isn't upset for long, but Holly hates this feeling. Senna says keeping Cash for Emergencies gives you choices. Match each event to what you could do.
```


#### pathfinder L3 S3 — image (OLD-ONLY)

Old:

```
holly-mia-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L3 S3 — settings (OLD-ONLY)

Old:

```
PAIRS:
I broke my sister's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favourite game now
```

Master:

```
PAIRS:
I broke my sister's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favorite game now
```


#### pathfinder L3 S4 — text (OLD-ONLY)

Old:

```
Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.
```

Master:

```
Senna helps Holly make a plan, so she's never caught out again. Put the plan in order, first to last.
```


#### pathfinder L3 S4 — settings (OLD-ONLY)

Old:

```
ITEMS: 💵 Earn money.
ITEMS: 🫙 Move a small amount to your Emergencies jar.
ITEMS: 🎮 Spend what is left on fun.
ORDER: earn-money-0,move-a-small-amount-to-your-emergencies-jar-1,spend-what-is-left-on-fun-2
```

Master:

```
ITEMS: 💵 First, Holly gets her allowance.
ITEMS: 🫙 Next, some goes in her Emergencies jar.
ITEMS: 🎮 Last, she spends what's left on fun.
ORDER: allowance, jar, fun
```


#### pathfinder L3 S5 — text (OLD-ONLY)

Old:

```
Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 craft bundle she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Holly do?
```

Master:

```
A few weeks later, Holly has saved $40, just enough for Pippa's new headphones. Then she sees a $10 phone stand. "I'll buy it now and save more next week," she thinks. What should she do?
```


#### pathfinder L3 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: Buy the craft bundle and save $10 more next week.
CHOICE B: Buy the headphones to fix what she broke first.
CHOICE C: Buy the craft bundle and hope the headphones don't cost $40.
CORRECT: B
```

Master:

```
CHOICE A: 📱 Buy the phone stand and save $10 more next week.
CHOICE B: 🎧 Buy Pippa's new headphones first.
CHOICE C: 🤞 Buy the phone stand and hope headphones cost less.
CORRECT: B
```


#### pathfinder L3 S5 — error (OLD-ONLY)

Old:

```
That's a trap! Stick to the plan to avoid stress later.
```

Master:

```
That's a trap! Stick to the plan, so there's no stress later. Try again!
```


#### pathfinder L3 S6 — text (OLD-ONLY)

Old:

```
Because I didn't ______ everything, I had ______ to ______ the headphones immediately.
```

Master:

```
Holly thinks: "Because I didn't ______ it all, I had cash to ______ Pippa's headphones right away."
```


#### pathfinder L3 S6 — settings (OLD-ONLY)

Old:

```
OPTIONS: save | spend | cash for emergencies | borrowed money | replace | throw away
CORRECT: spend, cash for emergencies, replace
```

Master:

```
OPTIONS: 💸 spend | 🫙 save | 🔧 replace | 🗑️ throw away
CORRECT: 💸 spend, 🔧 replace
```


#### pathfinder L3 S6 — error (OLD-ONLY)

Old:

```
Not quite. Let's try again.
```

Master:

```
(blank)
```


#### pathfinder L3 S7 — text (OLD-ONLY)

Old:

```
Holly could fix the problem because she had cash for emergencies. What are the other benefits of not spending all of your money? Select the best answer:
```

Master:

```
Holly could replace the headphones because she kept some cash aside. Which are good things about keeping some money? Pick all that apply.
```


#### pathfinder L3 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: If I lose something, I can replace it myself.
CHOICE B: I won't have to ask my parents for money if I need something.
CHOICE C: I can save for a big goal instead of wasting it on small stuff that doesn't last.
CHOICE D: I worry less if I can afford things that I want, or have to buy.
CHOICE E: All of the above.
CORRECT: E
```

Master:

```
CHOICE A: 🔧 If something breaks, I can replace it.
CHOICE B: 🎯 I can save for something big.
CHOICE C: 😌 I worry less about paying for things.
CHOICE D: 🛍️ I can buy every deal I see.
CORRECT: A+B+C
```


#### pathfinder L3 S7 — error (OLD-ONLY)

Old:

```
Yes, but take a look at the other options and see if there's a better answer.
```

Master:

```
(blank)
```


#### pathfinder L4 S1 — text (OLD-ONLY)

Old:

```
Holly’s whole group is buying a game skin before it leaves the shop. Everyone’s saying it’ll be gone soon. Immi sees Holly hold off anyway. What skill is Holly practicing?
```

Master:

```
Holly's friends are all buying the game skin before the timer runs out. Senna sees that Holly is holding off. What is Holly really doing by waiting?
```


#### pathfinder L4 S1 — image (OLD-ONLY)

Old:

```
holly-immi-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L4 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Holly is just slow at clicking.
CHOICE B: Holly has run out of money.
CHOICE C: Holly stops to think.
CORRECT: C
```

Master:

```
CHOICE A: 🐢 Holly is just slow at clicking.
CHOICE B: 🫙 Holly has run out of money.
CHOICE C: 🧠 Holly stops to think.
CORRECT: C
```


#### pathfinder L4 S1 — error (OLD-ONLY)

Old:

```
Not quite! Take another look at what Holly is choosing to do.
```

Master:

```
(blank)
```


#### pathfinder L4 S2 — text (OLD-ONLY)

Old:

```
Holly explains why she waited: "Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed."

Drag the steps into order.
```

Master:

```
The next day, Senna asks why Holly waited. "First I saw the countdown. Then I remembered my buy freeze," Holly says. Put Holly's story in order, first to last.
```


#### pathfinder L4 S2 — settings (OLD-ONLY)

Old:

```
ITEMS: 👀 Holly sees the one-time offer.
ITEMS: 🧠 Holly remembers the price could drop later.
ITEMS: ⏳ Holly waits a day and checks again.
ITEMS: 😊 Holly is happy she waited - she can buy the same item for even less.
ORDER: holly-sees-the-one-time-offer-0,holly-remembers-the-price-could-drop-later-1,holly-waits-a-day-and-checks-again-2,holly-is-happy-she-waited-she-can-buy-the-same-item-for-even-less-3
```

Master:

```
ITEMS: ⏰ Holly sees the countdown.
ITEMS: 🧠 She remembers her buy freeze.
ITEMS: 🏷️ Next day, the skin is half price.
ITEMS: 😊 Holly is glad she waited.
ORDER: countdown, freeze, half, glad
```


#### pathfinder L4 S3 — text (OLD-ONLY)

Old:

```
Which one helps Holly stop and think?
```

Master:

```
Holly's head is buzzing about the skin. In each round, which thought helps her stop and think?
```


#### pathfinder L4 S3 — settings (OLD-ONLY)

Old:

```
ROUNDS:
A: ⏰ It's a limited time offer - I have to buy it now! | B: 💰 I can wait and get it cheaper later. | CORRECT: B
A: 🔥 It looks cool, I need it right now! | B: 😴 I'll sleep on it and decide tomorrow. | CORRECT: B
A: 👥 Everyone has it, I don't want to be left out. | B: 💬 I'll ask my friends if it's actually any good. | CORRECT: B
```

Master:

```
ROUNDS:
A: ⏰ It ends soon. I have to buy it now! | B: 💰 I can wait and maybe get it cheaper. | CORRECT: B
A: 🔥 It looks so cool. I need it right now! | B: 😴 I'll sleep on it and decide tomorrow. | CORRECT: B
A: 👥 Everyone has it. I can't be left out! | B: 💬 I'll ask my friends if it's any good. | CORRECT: B
```


#### pathfinder L4 S3 — error (OLD-ONLY)

Old:

```
That thought is rushing you. Pick the one that helps you stop.
```

Master:

```
(blank)
```


#### pathfinder L4 S4 — text (OLD-ONLY)

Old:

```
Select which parts of the sign are making Holly rush.
```

Master:

```
A bright sign outside a store grabs Holly's eye. Which parts of the sign are trying to make her rush? Pick all that apply.
```


#### pathfinder L4 S4 — settings (OLD-ONLY)

Old:

```
CHOICE A: DON'T MISS OUT!
CHOICE B: ONLY 2 LEFT!
CHOICE C: ENDS TOMORROW!
CHOICE D: Made in France
CHOICE E: Quality Guaranteed
CORRECT: A+B+C
```

Master:

```
CHOICE A: DON'T MISS OUT!
CHOICE B: ONLY 2 LEFT!
CHOICE C: ENDS TOMORROW!
CHOICE D: Sizes 5 to 10
CHOICE E: Quality checked
CORRECT: A+B+C
```


#### pathfinder L4 S4 — error (master wins)

Old:

```
That's just sign info, not a rush trick.
```

Master:

```
Hold up! That's just sign info, not a rush trick. Try again!
```


#### pathfinder L4 S4 — notes (master wins)

Old:

```
(blank)
```

Master:

```
New sign art needed (sneaker store sign) with exactly these five lines. Or reuse fishing-rod-sign.webp and swap D back to 'Made in France'.
```


#### pathfinder L4 S5 — text (OLD-ONLY)

Old:

```
Holly gets a limited-time offer for extra lives in her game. She remembers Mia's advice and stops. What should she ask herself?
```

Master:

```
Holly gets a limited-time offer for extra lives in her game. She remembers the skin that dropped to half price, so she pauses. What should she ask herself? Pick all that apply.
```


#### pathfinder L4 S5 — error (OLD-ONLY)

Old:

```
Not quite! That button is trying to do the thinking for you. Don't let it!
```

Master:

```
(blank)
```


#### pathfinder L4 S6 — text (OLD-ONLY)

Old:

```
Holly chooses to keep her money. Swipe her money from 'Spend Now' to 'Save for Later'.
```

Master:

```
Holly keeps her money instead of buying extra lives. Drag her money from Spend Now to Save for Later.
```


#### pathfinder L4 S6 — settings (OLD-ONLY)

Old:

```
SOURCE: Spend Now
TARGET: Save for Later
ITEM: money-coin.webp
IMAGE: piggy-bank.webp
SUCCESS: Coins saved!
```

Master:

```
SOURCE: 🛒 Spend Now
TARGET: 🐷 Save for Later
ITEM: money-coin.webp
IMAGE: piggy-bank.webp
SUCCESS: Money saved!
```


#### pathfinder L4 S7 — text (OLD-ONLY)

Old:

```
Holly wants to do a $20 nail-art workshop. To afford it, she said no to three things. Drag them into the box to reach her goal.
```

Master:

```
Holly's startup money started at $0. She put the money from three things she skipped into her envelope. Drag each one into the box to watch her startup money climb.
```


#### pathfinder L4 S7 — settings (OLD-ONLY)

Old:

```
TARGET: 20
LABEL: Savings
DROP: Things Holly didn't buy
ITEMS: 🍫 Snacks at school ($5) 🎮 Extra lives bundle ($5) 🔦 Flashlight ($10)
```

Master:

```
TARGET: 20
LABEL: Startup money
DROP: Things Holly didn't buy
ITEMS: 🍟 Snacks after practice ($5) 🎮 Extra lives bundle ($5) 📚 Comic book ($10)
```


#### pathfinder L5 S1 — text (OLD-ONLY)

Old:

```
It is Immi's birthday. The local gelato store offers a birthday discount. Immi wants Holly to come with her and get one too. Going along so she is not left out is a ______ for Holly.
```

Master:

```
It's Senna's birthday, and the gelato shop has a birthday deal. Senna wants Holly to get one too. For Holly, her own gelato is a ______.
```


#### pathfinder L5 S1 — image (OLD-ONLY)

Old:

```
holly-immi-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L5 S1 — settings (OLD-ONLY)

Old:

```
OPTIONS: Want | Need | Bill
CORRECT: Want
```

Master:

```
OPTIONS: 🍦 want | ✅ need | 🧾 bill
CORRECT: 🍦 want
```


#### pathfinder L5 S1 — error (OLD-ONLY)

Old:

```
A limited time offer does not make it a 'need'.
```

Master:

```
(blank)
```


#### pathfinder L5 S2 — text (OLD-ONLY)

Old:

```
The birthday discount is only on today. Holly is saving for an exchange trip overseas and can't really afford the gelato. What should she do?
```

Master:

```
The gelato costs $6. The only money Holly has is her $20 startup money. What should she do?
```


#### pathfinder L5 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: Skip buying her own gelato and ask Immi to share hers.
CHOICE B: Buy her own because the deal is only on today
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Skip her own gelato and ask if Senna wants to share.
CHOICE B: 🍦 Buy her own, because the deal ends today.
CORRECT: A
```


#### pathfinder L5 S2 — error (OLD-ONLY)

Old:

```
The money for the exchange trip is the 'need'. The gelato is the 'want'.
```

Master:

```
(blank)
```


#### pathfinder L5 S3 — text (OLD-ONLY)

Old:

```
The gelato is a 'need' because the deal is only available today.
```

Master:

```
True or false: the gelato is a 'Need' because the deal is only on today.
```


#### pathfinder L5 S3 — settings (master wins)

Old:

```
CORRECT: false
```

Master:

```
CORRECT: False
```


#### pathfinder L5 S3 — error (OLD-ONLY)

Old:

```
A limited time offer does not turn a 'want' into a 'need'.
```

Master:

```
Nope! A deal that ends today doesn't turn a want into a need. Try again!
```


#### pathfinder L5 S4 — text (OLD-ONLY)

Old:

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Holly right now?
```

Master:

```
Sort each item into the right bucket. Is it a want or a need for Holly right now?
```


#### pathfinder L5 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: 🎫 Airline ticket
WANT: 🍦 Her own gelato
WANT: 🍨 Extra gelato toppings
NEED: 🪪 A new passport
```

Master:

```
ITEMS:
NEED: 🦴 Dog treats for her walks
NEED: 🛍️ Poop bags for her walks
WANT: 🍦 Her own gelato
WANT: 🍨 Extra gelato toppings
```


#### pathfinder L5 S5 — text (OLD-ONLY)

Old:

```
Holly does not want to feel left out, but the birthday deal expires today. What now?
```

Master:

```
The birthday deal is only on today. Holly feels left out without her own cup. What should she do now?
```


#### pathfinder L5 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🤝 Share a gelato and keep at least half of what she would otherwise have spent.
CHOICE B: 🍦 Buy one so she isn't the odd one out
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Stick with sharing Senna's gelato.
CHOICE B: 🍦 Buy her own before the deal ends.
CORRECT: A
```


#### pathfinder L5 S5 — error (master wins)

Old:

```
Try again!
```

Master:

```
(blank)
```


#### pathfinder L5 S6 — text (OLD-ONLY)

Old:

```
Put these in the order Holly should try. Best first.
```

Master:

```
Look back at Holly's trip to the gelato shop. Put what she did in order, first to last.
```


#### pathfinder L5 S6 — image (master wins)

Old:

```
not allowed
```

Master:

```
(blank)
```


#### pathfinder L5 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Ask if this is a 'want' or a 'need'
ITEMS: Share a gelato with Immi
ITEMS: Buy her own because it is only today
ORDER: ask,share,buy
```

Master:

```
ITEMS: 🤔 First, Holly asks if it's a want or a need.
ITEMS: 🤝 Then she asks Senna if they can share his.
ITEMS: 🍦 Senna says yes, and they both dig in.
ORDER: want, share, yes
```


#### pathfinder L5 S7 — text (OLD-ONLY)

Old:

```
Immi was happy to share the gelato without Holly having to pay for it. Holly stays on track with saving for her big trip.
```

Master:

```
Senna is happy to share his gelato, and Holly doesn't have to pay. What happens to her $20 startup money?
```


#### pathfinder L5 S7 — settings (master wins)

Old:

```
CONTINUE → GO Screen 8
```

Master:

```
CHOICE A: 🫙 It stays safe at $20
CHOICE B: 🍦 It drops to $14
CORRECT: A
```


#### pathfinder L6 S1 — text (OLD-ONLY)

Old:

```
Immi asks Holly to the cinema this weekend. Ticket and popcorn are $18. Holly's mom says: “I’ll pay half if you can pay the other half.”
```

Master:

```
Senna asks Holly to the movies. The ticket and popcorn cost $18, and Mom will pay half. Holly has saved $12 from her allowance. Can she pay her half?
```


#### pathfinder L6 S1 — image (OLD-ONLY)

Old:

```
holly-immi-chatting.webp
```

Master:

```
(blank)
```


#### pathfinder L6 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: True
CHOICE B: False
CORRECT: A
```

Master:

```
CHOICE A: ✅ Yes, she has enough
CHOICE B: ❌ No, she's short
CORRECT: A
```


#### pathfinder L6 S1 — error (OLD-ONLY)

Old:

```
Keeping some money earlier is what makes paying her half possible.
```

Master:

```
(blank)
```


#### pathfinder L6 S2 — text (OLD-ONLY)

Old:

```
Last week Holly almost bought a craft pack. She had $15 in her money jar. What would have happened if she had bought it?
```

Master:

```
Earlier this week, Holly nearly bought a $5 keychain flashlight, but she decided she didn't need it. What would have happened if she had bought it?
```


#### pathfinder L6 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: 😬 She might not have had enough left to pay her half.
CHOICE B: 🎟️ The cinema ticket would have been free.
CHOICE C: 🎁 Immi would've paid for everything.
CORRECT: A
```

Master:

```
CHOICE A: 😬 She'd have $7, not enough for her $9 half.
CHOICE B: 🎟️ The movie ticket would have been free.
CHOICE C: 🎁 Senna would have paid for everything.
CORRECT: A
```


#### pathfinder L6 S2 — error (OLD-ONLY)

Old:

```
Buying the craft pack would have left her with less than $15.
```

Master:

```
(blank)
```


#### pathfinder L6 S3 — text (OLD-ONLY)

Old:

```
Sort what Holly can do with the money she kept.
```

Master:

```
Because she didn't buy the flashlight, Holly has $12. Her half of the movie costs $9. Which are good ideas for Holly? Sort each idea into Yes or No.
```


#### pathfinder L6 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
YES: 🎟️ Pay her half for the cinema
YES: 💰 Use the money for something else this weekend
NO: 🎨 Buy the craft pack and go to the cinema
NO: 🚫 Never spend any money
```

Master:

```
ITEMS:
YES: 🎟️ Pay her $9 half
YES: 💰 Save the remaining $3 for later
NO: 🔦 Buy the flashlight and movie ticket
NO: 🙋 Borrow $9 from Pippa
```


#### pathfinder L6 S4 — text (master wins)

Old:

```
True or False?
```

Master:

```
True or false? Check each statement against Holly's story.
```


#### pathfinder L6 S4 — settings (OLD-ONLY)

Old:

```
ROUNDS:
Round 1 | Holly saved her money last week so now she can pay her half of the cinema outing. | True | False | CORRECT: A
Round 2 | Immi will pay for everything because Holly spent all her money. | True | False | CORRECT: B
Round 3 | Holly bought the craft pack and now she has less than $15 left. | True | False | CORRECT: B
```

Master:

```
ROUNDS:
Round 1 | Holly kept her money earlier this week. Now she can pay her half. | True | False | CORRECT: A
Round 2 | Senna will pay for everything because Holly spent all her money. | True | False | CORRECT: B
Round 3 | Holly has to borrow from her sister Pippa to go. | True | False | CORRECT: B
```


#### pathfinder L6 S5 — text (OLD-ONLY)

Old:

```
Holly has enough to pay her half of the $18 outing.
```

Master:

```
Holly's mom will pay half of the $18. Holly pays the other half from the $12 she has. How much will Holly have left?
```


#### pathfinder L6 S5 — settings (OLD-ONLY)

Old:

```
How much does Holly have left after she pays her half?
CHOICE A: 💵 $6
CHOICE B: 🎟️ $9
CHOICE C: 🫙 $0
CORRECT: A
```

Master:

```
CHOICE A: 💵 $3
CHOICE B: 🎟️ $9
CHOICE C: 🫙 $0
CORRECT: A
```


#### pathfinder L6 S5 — error (OLD-ONLY)

Old:

```
$15 minus $9 leaves $6.
```

Master:

```
Not quite! $12 minus $9 leaves $3. Try again!
```


#### pathfinder L6 S6 — text (OLD-ONLY)

Old:

```
Drag the items in order, to show what just happened.
```

Master:

```
Look back at Holly's week. Put what happened in order, first to last.
```


#### pathfinder L6 S6 — settings (OLD-ONLY)

Old:

```
ITEMS:
Holly didn't buy the craft pack last week.
Holly has enough money and spends $9 on her half.
Holly still has $6 left.
ORDER: didn't buy, spends, left
```

Master:

```
ITEMS: 🔦 Earlier this week, Holly skips a $5 keychain flashlight.
ITEMS: 📱 Today, Senna asks her to the movies.
ITEMS: ✅ Holly says yes. She can pay her half!
ORDER: flashlight, asks, yes
```


#### pathfinder L6 S7 — game type (master wins)

Old:

```
allocation-slider
```

Master:

```
drag-to-target
```


#### pathfinder L6 S7 — text (OLD-ONLY)

Old:

```
Holly grins and tells Immi “I’m in!”.
```

Master:

```
At the ticket counter, Mom pays her half. Drag Holly's $9 to the counter.
```


#### pathfinder L6 S7 — image (OLD-ONLY)

Old:

```
holly-immi-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L6 S7 — settings (OLD-ONLY)

Old:

```
TOTAL: 15
KEEP: 9
ITEM: Cinema
Slide to move $9 from Holly's money jar to pay her half. ($6 remains.)
```

Master:

```
SOURCE: 💵 $9
TARGET: 🎟️ Ticket counter
SUCCESS: Paid her half, and $3 is still safe!
```


#### pathfinder L6 S7 — error (OLD-ONLY)

Old:

```
Slide until $9 is set aside for the cinema. $6 stays in the jar.
```

Master:

```
(blank)
```


#### pathfinder L7 S1 — text (OLD-ONLY)

Old:

```
Holly and Immi see a gelato deal. Holly ______.
```

Master:

```
Holly and Senna walk past a café with a bubble tea deal, on today only. Before reaching for her wallet, Holly ______.
```


#### pathfinder L7 S1 — image (OLD-ONLY)

Old:

```
holly-immi-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L7 S1 — settings (OLD-ONLY)

Old:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Immi to pay for it CORRECT: 🧠 stops and thinks
```

Master:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Senna to pay
CORRECT: 🧠 stops and thinks
```


#### pathfinder L7 S1 — error (OLD-ONLY)

Old:

```
Not quite. She needs to stop and think first.
```

Master:

```
(blank)
```


#### pathfinder L7 S2 — text (OLD-ONLY)

Old:

```
Holly remembers she still needs to pay for Mia's headphones that she broke. Replacing Mia's headphones is a...
```

Master:

```
Senna is designing Holly's logo. Today they buy the art supplies together. Holly's share is $7. Is paying her share a want or a need?
```


#### pathfinder L7 S2 — image (OLD-ONLY)

Old:

```
holly-mia-chatting.webp
```

Master:

```
holly-thinking-512.webp
```


#### pathfinder L7 S2 — settings (master wins)

Old:

```
CHOICE A: ✨ Want CHOICE B: ✅ Need CORRECT: B
```

Master:

```
CHOICE A: ✨ Want
CHOICE B: ✅ Need
CORRECT: B
```


#### pathfinder L7 S2 — error (OLD-ONLY)

Old:

```
Replacing the headphones is a need.
```

Master:

```
(blank)
```


#### pathfinder L7 S4 — game type (master wins)

Old:

```
savings-goal
```

Master:

```
binary-choice
```


#### pathfinder L7 S4 — text (OLD-ONLY)

Old:

```
Holly has $45. Drag the items to see what is left.
```

Master:

```
Holly has $13: her $3 spare plus this week's $10 allowance. She pays her $7 share first. A bubble tea is $6. What should Holly do?
```


#### pathfinder L7 S4 — image (master wins)

Old:

```
holly-hands-on-hips-512.webp
```

Master:

```
holly-deciding-512.webp
```


#### pathfinder L7 S4 — settings (OLD-ONLY)

Old:

```
AVAILABLE: $45 
ITEMS: 🎧 Headphones ($40) 🍦 Gelato ($5)
```

Master:

```
CHOICE A: 🧋 Buy her own bubble tea with her last $6
CHOICE B: 🤝 Share one bubble tea with Senna
CORRECT: B
```


#### pathfinder L7 S4 — error (OLD-ONLY)

Old:

```
Check the total against the $45.
```

Master:

```
Hold up! Her own bubble tea would use her last $6. Try again!
```


#### pathfinder L7 S5 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
savings-goal
```


#### pathfinder L7 S5 — text (OLD-ONLY)

Old:

```
Holly has $45. Headphones are $40. One gelato is $5. She can pay for the headphones and buy her own gelato - but would have $0 left. What should she do?
```

Master:

```
Let's check the other choice. Drag her $7 share and a $6 bubble tea into the box to see what Holly would have left.
```


#### pathfinder L7 S5 — image (master wins)

Old:

```
holly-deciding-512.webp
```

Master:

```
(blank)
```


#### pathfinder L7 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🍦 Buy her own gelato ($5) CHOICE B: 🤝 Find another way so she has some money left 
CORRECT: B
```

Master:

```
AVAILABLE: $13
ITEMS: 🎨 Logo supplies ($7) 🧋 Bubble tea ($6)
```


#### pathfinder L7 S5 — error (OLD-ONLY)

Old:

```
Buying her own uses the last $5. There will be nothing left.
```

Master:

```
(blank)
```


#### pathfinder L7 S7 — text (OLD-ONLY)

Old:

```
Holly and Immi decide to share one gelato, so they can still enjoy the treat and Holly also has some money left over.
```

Master:

```
Holly and Senna each pay $3 and share one bubble tea. Drag the bubble tea to Senna to share it.
```


#### pathfinder L7 S7 — image (OLD-ONLY)

Old:

```
holly-immi-chatting.webp
```

Master:

```
holly-celebrating-512.webp
```


#### pathfinder L7 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: 🍦 Gelato TARGET: 🤝 Share with Immi
```

Master:

```
SOURCE: 🧋 Bubble tea
TARGET: 🤝 Share with Senna
SUCCESS: Shared! And Holly still has $3.
```


#### pathfinder L7 S7 — error (OLD-ONLY)

Old:

```
Drag the gelato to share it with Immi.
```

Master:

```
(blank)
```


#### pathfinder L7 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image left blank, as Explorer.
```


#### pathfinder L9 S1 — text (OLD-ONLY)

Old:

```
Tap a skill. Finish all three, then tap Finish.
```

Master:

```
Tap a skill to test yourself. When all three are done, tap Finish.
```


#### pathfinder L9 S2 — text (OLD-ONLY)

Old:

```
Catch Impulse Spending means pausing before you spend so you don't buy on impulse.
```

Master:

```
Catch Impulse Spending means pausing before you spend. Which one is a pause?
```


#### pathfinder L9 S2 — settings (master wins)

Old:

```
CONTINUE → GO Screen 3
```

Master:

```
CHOICE A: 😴 Sleep on it first → GO Screen 3
CHOICE B: ⏰ Buy before the timer ends → GO Screen 3
CORRECT: A
```


#### pathfinder L9 S3 — text (master wins)

Old:

```
A flashing “only 1 minute left” deal is a good reason to buy straight away.
```

Master:

```
True or false: a flashing "only 15 minutes left" deal is a good reason to buy straight away.
```


#### pathfinder L9 S3 — error (OLD-ONLY)

Old:

```
A countdown is trying to rush you.
```

Master:

```
(blank)
```


#### pathfinder L9 S4 — text (OLD-ONLY)

Old:

```
Choose Needs Over Wants means covering what you actually need before spending on wants.
```

Master:

```
Choose Needs Over Wants means covering what you need before you spend on wants. Which one does Holly's dog walking need?
```


#### pathfinder L9 S4 — settings (master wins)

Old:

```
CONTINUE → GO Screen 5
```

Master:

```
CHOICE A: 🦴 Dog treats for her walks → GO Screen 5
CHOICE B: 🍬 A big bag of candy → GO Screen 5
CORRECT: A
```


#### pathfinder L9 S5 — text (OLD-ONLY)

Old:

```
Holly needs to replace broken headphones. She also wants a new game skin. What should she buy first?
```

Master:

```
Holly's swimsuit for training has a hole, and she needs a new one. She also wants a new game skin. Which should she buy first?
```


#### pathfinder L9 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🎧 Headphones → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```

Master:

```
CHOICE A: 🩱 Swimsuit → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```


#### pathfinder L9 S5 — error (OLD-ONLY)

Old:

```
Not quite! Which one can't wait? Try again!
```

Master:

```
(blank)
```


#### pathfinder L9 S6 — text (OLD-ONLY)

Old:

```
Don't Spend Money You Don't Have means not spending everything so you still have money for later.
```

Master:

```
Don't Spend Money You Don't Have means never going below zero. Holly has $6. A phone case costs $10. Can she buy it?
```


#### pathfinder L9 S6 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 7
```

Master:

```
CHOICE A: ❌ No, she's $4 short → GO Screen 7
CHOICE B: 🙋 Yes, if she borrows $4 → GO Screen 7
CORRECT: A
```


#### pathfinder L9 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Hold up! Borrowing means spending money she doesn't have. Try again!
```


#### pathfinder L9 S7 — text (OLD-ONLY)

Old:

```
If you spend all your money now, you might not ______ something important later.
```

Master:

```
Holly kept her $20 startup money safe, then earned $10 doing chores. Now she has $30, so she can ______ her whole startup kit!
```


#### pathfinder L9 S7 — settings (OLD-ONLY)

Old:

```
OPTIONS: 💸 afford | ✨ want | 👀 see CORRECT: 💸 afford
CONTINUE → GO Screen 1
```

Master:

```
OPTIONS: 💸 afford | 🙈 forget | 🗑️ lose
CORRECT: 💸 afford
CONTINUE → GO Screen 1
```


#### pathfinder L9 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image blank as Explorer. Gold medals medal-skill1/2/3-gold.webp exist if Melvin wants them here.
```


#### pathfinder L7 S3 — text (OLD-ONLY)

Old:

```
Replacing Mia's headphones comes before the gelato. Which skill is that?
```

Master:

```
Paying her share comes before the bubble tea. Which skill is she using?
```


#### pathfinder L7 S3 — image (master wins)

Old:

```
holly-thinking-512.webp
```

Master:

```
holly-hands-on-hips-512.webp
```


#### pathfinder L7 S3 — settings (master wins)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: B
```

Master:

```
CHOICE A: 🧠 Catch Impulse Spending
CHOICE B: ✅ Choose Needs Over Wants
CHOICE C: 💰 Don't Spend Money You Don't Have
CORRECT: B
```


#### pathfinder L7 S3 — error (OLD-ONLY)

Old:

```
That skill is Choose Needs Over Wants.
```

Master:

```
(blank)
```


#### pathfinder L7 S6 — game type (master wins)

Old:

```
multiple-choice
```

Master:

```
binary-choice
```


#### pathfinder L7 S6 — text (OLD-ONLY)

Old:

```
Sharing the gelato leaves Holly some money. Buying her own leaves $0. Which skill is she using when she shares?
```

Master:

```
What if the bubble tea cost $7? After her share, Holly has $6. Can she buy her own?
```


#### pathfinder L7 S6 — image (OLD-ONLY)

Old:

```
holly-immi-sidebyside.webp
```

Master:

```
(blank)
```


#### pathfinder L7 S6 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: C
```

Master:

```
CHOICE A: ❌ No, she's $1 short
CHOICE B: 🙋 Yes, if Senna lends her $1
CORRECT: A
```


#### pathfinder L7 S6 — error (OLD-ONLY)

Old:

```
That skill is Don't Spend Money You Don't Have.
```

Master:

```
(blank)
```


#### pathfinder L8 S1 — text (OLD-ONLY)

Old:

```
Holly has $15. She sees a phone case for $9. What do you want Holly to do?
```

Master:

```
Holly sees a bucket hat she loves for $12. What do you want Holly to do?
```


#### pathfinder L8 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🛍️ Buy it. She wants it and will have money left over → SET cash=6 → GO Screen 1-buy 
CHOICE B: ✋ Don’t buy it. She doesn’t need it → SET cash=15 → GO Screen 1-keep
```

Master:

```
CHOICE A: 👒 Buy it. She wants it and will still have money left → SET cash=8 → GO Screen 1-buy
CHOICE B: ✋ Don't buy it. She doesn't need it → SET cash=20 → GO Screen 1-keep
```


#### pathfinder L8 S1-buy — text (OLD-ONLY)

Old:

```
Holly buys the phone case for $9. She has {cash} left.
```

Master:

```
Holly buys the hat for $12. She has {cash} left.
```


#### pathfinder L8 S1-keep — text (OLD-ONLY)

Old:

```
Holly leaves the phone case. She still has {cash}.
```

Master:

```
Holly puts the hat back and keeps walking. She still has {cash}.
```


#### pathfinder L8 S2 — text (OLD-ONLY)

Old:

```
Holly has {cash} left. An arcade game card is $8. What do you want Holly to do?
```

Master:

```
Holly has {cash} left when she passes the arcade. A game card costs $10. What do you want Holly to do?
```


#### pathfinder L8 S2 — settings (OLD-ONLY)

Old:

```
IF cash >= 8 THEN
CHOICE A: 🕹️ Pay $8 → SET cash=cash-8 → GO Screen 2-played
CHOICE B: 💰 Skip the arcade and keep the money → GO Screen 2-kept
IF cash < 8 THEN
TEXT: Holly has {cash} left. The arcade card is $8, so she can’t pay. What do you want Holly to do?
CHOICE A: 💭 See what would have happened if she hadn’t bought the case → GO Screen 2-alt
CHOICE B: 🚶 Skip the arcade → GO Screen 2-short
```

Master:

```
IF cash >= 10 THEN
CHOICE A: 🕹️ Pay $10 and play → SET cash=cash-10 → GO Screen 2-played
CHOICE B: 💰 Skip the arcade and keep the money → GO Screen 2-kept
IF cash < 10 THEN
TEXT: Holly has {cash}. The arcade card is $10, so she can't pay. What do you want Holly to do?
CHOICE A: 💭 See what would have happened if she hadn't bought the hat → GO Screen 2-alt
CHOICE B: 🚶 Skip the arcade → GO Screen 2-short
```


#### pathfinder L8 S2-played — text (OLD-ONLY)

Old:

```
Holly pays $8 and plays the arcade. She has {cash} left.
```

Master:

```
Holly pays $10 and plays with her friends. She has {cash} left.
```


#### pathfinder L8 S2-kept — text (OLD-ONLY)

Old:

```
Holly skips the arcade and keeps her {cash}.
```

Master:

```
Holly skips the arcade, chats with her friends instead and keeps her {cash}.
```


#### pathfinder L8 S2-short — text (OLD-ONLY)

Old:

```
Holly can’t pay the $8. She skips the arcade and keeps her {cash}.
```

Master:

```
Holly can't pay the $10, so she skips it and keeps her {cash}.
```


#### pathfinder L8 S2-alt — text (OLD-ONLY)

Old:

```
If Holly hadn’t bought the case she would have $15 and could pay for the card.
```

Master:

```
If Holly hadn't bought the hat, she'd still have $20. She could pay for the card.
```


#### pathfinder L8 S3 — text (OLD-ONLY)

Old:

```
Immi has $20. Friends are asking her along to a roller-skate derby that costs $8. What do you want Immi to do?
```

Master:

```
Meanwhile, across town, Senna has $20. His friends invite him to a climbing gym session that costs $10. What do you want Senna to do?
```


#### pathfinder L8 S3 — image (OLD-ONLY)

Old:

```
immi-deciding-512.webp
```

Master:

```
senna-thinking-512.webp
```


#### pathfinder L8 S3 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🛼 Yes, join ($8) → SET cash=12 → GO Screen 4 CHOICE B: 💰 No, skip → SET cash=20 → GO Screen 4-alt
```

Master:

```
CHOICE A: 🧗 Yes, Senna joins in ($10) → GO Screen 4
CHOICE B: 💰 No, he doesn't want to spend the money → GO Screen 4-alt
```


#### pathfinder L8 S4 — text (OLD-ONLY)

Old:

```
Immi has {cash} left. After the derby, the friend group want to go for lunch. Immi is happy she said yes to the derby, because now she can join the lunch too.
```

Master:

```
Senna has $10 left after a fun afternoon at the climbing gym. When the group goes for a snack, he's glad he said yes.
```


#### pathfinder L8 S4 — image (OLD-ONLY)

Old:

```
immi-celebrating-512.webp
```

Master:

```
senna-celebrating-512.webp
```


#### pathfinder L8 S4-alt — text (OLD-ONLY)

Old:

```
The next day everyone is talking about how good the derby was, and they all went to lunch after. Immi still has her {cash}, but she missed all of it.
```

Master:

```
The next day, everyone is talking about the climbing gym, and the snack after. Senna still has his $20, but he missed all of it.
```


#### pathfinder L8 S4-alt — image (OLD-ONLY)

Old:

```
immi-sitting-512.webp
```

Master:

```
senna-walking-512.webp
```


#### pathfinder L8 S5 — text (OLD-ONLY)

Old:

```
Later, Holly has $14. She wants a new water bottle for $9. What do you want Holly to do?
```

Master:

```
Later that afternoon, Holly has {cash}. She sees a cool water bottle for $8. What do you want Holly to do?
```


#### pathfinder L8 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧴 Buy the water bottle ($9) → SET cash=5 → GO Screen 5-buy CHOICE B: 💰 Don’t buy the water bottle → SET cash=14 → GO Screen 5-save
```

Master:

```
IF cash >= 8 THEN
CHOICE A: 🧴 Buy the water bottle ($8) → SET cash=cash-8 → GO Screen 5-buy
CHOICE B: 💰 Don't buy the water bottle → GO Screen 5-save
```


#### pathfinder L8 S5-buy — text (OLD-ONLY)

Old:

```
Holly buys the water bottle for $9. She has {cash} left.
```

Master:

```
Holly buys the water bottle and fills it straight away. She has {cash} left.
```


#### pathfinder L8 S5-save — text (OLD-ONLY)

Old:

```
Holly skips the water bottle. She still has {cash}.
```

Master:

```
Holly skips the water bottle for now. She still has {cash}.
```


#### pathfinder L8 S6 — text (OLD-ONLY)

Old:

```
Holly has {cash} left. Immi asks if she wants to come to the cinema with a group of friends. What do you want Holly to do?
```

Master:

```
Then Senna messages: some friends are going bowling tonight. A game is $10. Holly has {cash}. What do you want Holly to do?
```


#### pathfinder L8 S6 — image (OLD-ONLY)

Old:

```
holly-immi-chatting.webp
```

Master:

```
(blank)
```


#### pathfinder L8 S6 — settings (OLD-ONLY)

Old:

```
IF cash = 5 THEN
CHOICE A: 🎟️ Ask if the group will switch to a cheaper session ($5) → SET cash=0 → GO Screen 7
CHOICE B: 🚶 Skip the cinema → SET cash=5 → GO Screen 7-skip
IF cash = 14 THEN
CHOICE A: 🎬 Go to the cinema ($8) → SET cash=6 → GO Screen 7-alt
CHOICE B: 🏠 Don’t go → SET cash=14 → GO Screen 7-home
```

Master:

```
IF cash >= 10 THEN
CHOICE A: 🎳 Go bowling ($10) → SET cash=cash-10 → GO Screen 7
CHOICE B: 🏠 Stay home and keep her money → GO Screen 7-home
IF cash < 10 THEN
CHOICE A: 🧩 Ask if everyone can play board games at Senna's place instead (free) → GO Screen 7-games
CHOICE B: 🚶 Skip bowling → GO Screen 7-skip
```


#### pathfinder L8 S7 — text (OLD-ONLY)

Old:

```
You picked “Ask if the group will switch to a cheaper session ($5)”. The group said yes. Holly got her water bottle and still went to the cinema with everyone. She has {cash} left.
```

Master:

```
Holly bowls with the whole group. She has {cash} left.
```


#### pathfinder L8 S7-skip — text (OLD-ONLY)

Old:

```
You picked “Skip the cinema”. Holly has the new water bottle and {cash} left, and she missed the cinema.
```

Master:

```
Holly has {cash}, but she misses the night with her friends.
```


#### pathfinder L8 S7-alt (text)

```
You picked “Go to the cinema ($8)”. Holly did not buy the bottle, but she joined the group. She has {cash} left.
```


#### pathfinder L8 S7-alt (image)

```
holly-immi-sidebyside.webp
```


#### pathfinder L8 S7-home — text (OLD-ONLY)

Old:

```
You picked “Don’t go”. Holly still has {cash}, and she missed the bottle and the cinema.
```

Master:

```
Holly keeps her {cash}, but she misses bowling with her friends.
```


#### pathfinder L8 S8 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
completion
```


#### pathfinder L8 S8 — text (OLD-ONLY)

Old:

```
Every choice you made shaped Immi's day. Spending on things that matter to you, like time with friends, can be worth it. Keeping some money back is smart too. It's about finding the right balance. That's real money thinking!
```

Master:

```
(blank)
```


#### pathfinder L8 S8 — image (OLD-ONLY)

Old:

```
immi-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### pathfinder L8 S8 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 9
```

Master:

```
MEDAL: none
```


- Master-only screen (not in this source): pathfinder L8 S7-games `binary-choice`

- Scenario beat count: source 0, master 26.


#### Screens1.csv — maverick

Rows in this source: 85. Master maverick rows: 110.

#### maverick L1 S1 — text (OLD-ONLY)

Old:

```
Aiden just got $40 cash from a quick delivery gig. He opens the marketplace app and sees the exact wireless earbuds he's been tracking. His brain tricks him into thinking the cash must be ______ right away!
```

Master:

```
Senna just got $40 for his birthday! He heads to the mall, and his brain tricks him into thinking cash must be ______ right away!
```


#### maverick L1 S1 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L1 S1 — settings (master wins)

Old:

```
(blank)
```

Master:

```
OPTIONS: spent | saved | hidden
CORRECT: spent
```


#### maverick L1 S1 — error (OLD-ONLY)

Old:

```
Not quite! Aiden spotted those earbuds - what's his brain pushing him to do with that $40?
```

Master:

```
(blank)
```


#### maverick L1 S2 — text (OLD-ONLY)

Old:

```
Aiden buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first, but a few hours later...
```

Master:

```
Senna buys a giant milkshake and a bucket hat. He's super happy, but ten minutes later...
```


#### maverick L1 S2 — image (OLD-ONLY)

Old:

```
aiden-sitting-512.webp
```

Master:

```
(blank)
```


#### maverick L1 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🍬 ...the thrill starts to wear off and his $40 is spent.
CHOICE B: 💵 ...the seller gives him his money back because he bought them so quickly.
CORRECT: A
```

Master:

```
CHOICE A: 🥤 ...the milkshake is gone and the hat feels unnecessary.
CHOICE B: 💵 ...his $40 magically comes back.
CORRECT: A
```


#### maverick L1 S2 — error (OLD-ONLY)

Old:

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```

Master:

```
(blank)
```


#### maverick L1 S3 — text (OLD-ONLY)

Old:

```
Aiden's $40 is gone after buying the earbuds and he only had a short burst of satisfaction. Tap these items to see the difference between things that give short fun and things that give more fun for longer!
```

Master:

```
Senna's money is gone, and the fun lasted only 10 minutes. Tap each item to see if it's short fun or fun that lasts!
```


#### maverick L1 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: ⚡ Energy drink + snack
SHORT: 🍿 Movie snack combo
LONG: 🔊 Wireless speaker
LONG: 🔧 Multi-tool / pocket knife
```

Master:

```
ITEMS:
SHORT: 🥤 Giant milkshake
SHORT: 🍩 Doughnut box
LONG: 🎸 Second-hand guitar
LONG: 🚲 Bike repair kit
```


#### maverick L1 S4 — text (OLD-ONLY)

Old:

```
Your turn! Drag each item into the correct bucket.
```

Master:

```
Your turn! Drag each item into the right bucket. How long will the fun really last?
```


#### maverick L1 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
SHORT: 🍔 Food delivery with priority fee
SHORT: 👕 Disposable concert merch
LONG: 🎸 Second-hand quality guitar
LONG: 🧥 High-quality piece of clothing
```

Master:

```
ITEMS:
SHORT: 🍔 Food delivery with a rush surcharge
SHORT: 🧢 Baseball cap
LONG: 🏀 Good basketball
LONG: 🧥 Well-made jacket
```


#### maverick L1 S5 — text (OLD-ONLY)

Old:

```
Later that day Aiden receives a text message: "Flash sale on premium bike lights - huge discount but ONLY 10 MINUTES LEFT!" Why is the offer rushing him?
```

Master:

```
The next day, Senna gets his $20 spending money. Then his phone flashes: 💥 PHONE REPAIR KIT 60% OFF! ONLY 15 MINUTES LEFT! 💥 Why is the store rushing him?
```


#### maverick L1 S5 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L1 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 To trick his brain into buying fast without thinking.
CHOICE B: ❤️ Because the company genuinely cares about Aiden's safety.
CORRECT: A
```

Master:

```
CHOICE A: 🧠 To trick his brain into buying fast.
CHOICE B: ❤️ Because the store owners love him.
CORRECT: A
```


#### maverick L1 S5 — error (master wins)

Old:

```
Don't fall for the flashing countdown!
```

Master:

```
Don't fall for the flashing countdown! Try again!
```


#### maverick L1 S6 — text (OLD-ONLY)

Old:

```
If Aiden had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Aiden can think if he really needs the item right now.
```

Master:

```
Help Senna by giving him a 'buy freeze', so his brain has time to think.
```


#### maverick L1 S6 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L1 S6 — settings (OLD-ONLY)

Old:

```
HOLD: ⏸️ HOLD TO PAUSE ⏸️
```

Master:

```
HOLD: ❄️ HOLD TO FREEZE ❄️
FROZEN: ❄️ FROZEN ❄️
SUCCESS: Frozen! Now Senna has time to think.
```


#### maverick L1 S7 — text (OLD-ONLY)

Old:

```
Aiden walked away from the impulsive offer and kept his money exactly where it belongs: in his pocket.
```

Master:

```
The freeze worked! The next morning, Senna realizes he doesn't even need the phone repair kit. What did the freeze help him do with his $20?
```


#### maverick L1 S7 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L1 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: Continue → GO Screen 8
```

Master:

```
CHOICE A: 💰 Keep his $20 safe
CHOICE B: 👟 Buy the sneakers even faster
CORRECT: A
```


#### maverick L1 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### maverick L2 S1 — text (OLD-ONLY)

Old:

```
Tomorrow is Dash's birthday. Aiden opens his savings jar to buy the phone case he promised his friend... but the jar is completely empty. True or False: Aiden can still buy the present.
```

Master:

```
Senna promised Max a $30 power bank for his birthday on Saturday. Senna only has the $20 he kept safe. True or false: he can buy it now.
```


#### maverick L2 S1 — image (OLD-ONLY)

Old:

```
aiden-dash-chatting.webp
```

Master:

```
(blank)
```


#### maverick L2 S1 — error (OLD-ONLY)

Old:

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```

Master:

```
(blank)
```


#### maverick L2 S2 — text (OLD-ONLY)

Old:

```
Aiden spent all his money on things he wanted, but didn't save anything for things he needs to buy. Help Aiden identify which items are 'Things he wants' or 'Things he needs'
```

Master:

```
Senna spent his birthday money on things he wanted, and saved nothing for things he needs. Help him sort each item.
```


#### maverick L2 S2 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: 📱 Phone case (birthday present)
NEED: 🔌 Phone cable
WANT: 🍫 Beast Munch
WANT: 🎮 New game skin
```

Master:

```
ITEMS:
NEED: 🔋 Power bank (birthday present)
NEED: 🚌 Bus pass for school
WANT: 🧢 Another cap
WANT: 🎮 New game skin
```


#### maverick L2 S3 — text (OLD-ONLY)

Old:

```
Which item is the one Aiden 'Needs' to buy before he spends money on what he 'Wants' to buy?
```

Master:

```
Needs come before wants. In each round, tap the one Senna should buy first.
```


#### maverick L2 S3 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L2 S3 — settings (OLD-ONLY)

Old:

```
ROUNDS:
A: 📱 A new phone case, even though his old one is still fine | B: 🎁 A new phone case he promised his friend | CORRECT: B
A: 💡 A light for his bike to be seen in the dark | B: 🖱️ A new gaming mouse with lights (his old one still works) | CORRECT: A
A: 🍱 Buy lunch for all his friends and have nothing left | B: 🚍 A bus pass to get him to school | CORRECT: B
```

Master:

```
ROUNDS:
A: 🔋 A power bank for himself (his works fine) | B: 🎁 The power bank he promised Max | CORRECT: B
A: 🚲 A new bike tire (his is flat) | B: ⌨️ A glowing game keyboard (his works fine) | CORRECT: A
A: 🍔 Pay for burgers for all his friends | B: 🥪 Buy lunch at school for himself | CORRECT: B
```


#### maverick L2 S4 — game type (OLD-ONLY)

Old:

```
budget-select
```

Master:

```
multiple-choice
```


#### maverick L2 S4 — text (OLD-ONLY)

Old:

```
You have $30 left. Check the boxes to buy what you actually need.
```

Master:

```
Senna writes a list of things he might buy next. Which ones does he really need? Select all that apply.
```


#### maverick L2 S4 — image (master wins)

Old:

```
not allowed
```

Master:

```
(blank)
```


#### maverick L2 S4 — settings (OLD-ONLY)

Old:

```
TOTAL: 30
ITEMS:
NEED: 🚍 Bus Pass ($15)
WANT: ⚡ Energy Drink ($10)
NEED: 🔌 Phone Cable ($15)
CORRECT: bus,cable
```

Master:

```
CHOICE A: 🧮 A calculator for math class
CHOICE B: 🥤 Giant milkshake
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```


#### maverick L2 S4 — error (OLD-ONLY)

Old:

```
Uncheck the item you don't really 'need'.
```

Master:

```
(blank)
```


#### maverick L2 S5 — text (OLD-ONLY)

Old:

```
Aiden has $25 💰
He needs $20 for Dash's phone case 🎁
Slide to save at least $20 👇
```

Master:

```
On Friday, Senna earns $20 helping Mom with chores. Now he has $40. The power bank costs $30.

Slide to keep at least $30 for the gift.
```


#### maverick L2 S5 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L2 S5 — settings (OLD-ONLY)

Old:

```
TOTAL: 25
KEEP: 20
ITEM: Phone case
```

Master:

```
TOTAL: 40
KEEP: 30
ITEM: 🎁 Power bank
```


#### maverick L2 S5 — error (OLD-ONLY)

Old:

```
Slide until $20 is locked for the gift.
```

Master:

```
(blank)
```


#### maverick L2 S6 — text (OLD-ONLY)

Old:

```
Aiden has only $5 left in his savings and sees a $5 bundle-deal for his favourite energy drink. Drag the choices in the correct order, starting with what would be best for Aiden to do.
```

Master:

```
Senna has $10 left after saving the gift money. At the food court, a sign says 2-FOR-1 BURGERS! Rank his choices from best to worst.
```


#### maverick L2 S6 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L2 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Don't buy anything - keep the $5 for 'needs'.
ITEMS: Choose something cheaper, so he has some money left.
ITEMS: Borrow money from Dash to buy the energy drink.
ORDER: keep,cheaper,borrow
```

Master:

```
ITEMS: 🫙 Keep his $10 for things he needs.
ITEMS: 🍔 Buy the deal while it lasts.
ITEMS: 🙅 Borrow money to get the deal.
ORDER: keep, buy, borrow
```


#### maverick L2 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Not quite! Keeping his $10 comes first. Try again!
```


#### maverick L2 S7 — text (OLD-ONLY)

Old:

```
Fast forward to the next week. Drag the gift to Dash to help Aiden deliver his promise.
```

Master:

```
It's Saturday, Max's birthday, and the party is about to start. Drag the gift to Max so Senna can keep his promise.
```


#### maverick L2 S7 — image (OLD-ONLY)

Old:

```
aiden-dash-sidebyside.webp
```

Master:

```
(blank)
```


#### maverick L2 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: concept-gift-box / TARGET: dash-celebrating
```

Master:

```
SOURCE: concept-gift-box
TARGET: max-celebrating
SUCCESS: Promise kept! Happy birthday, Max! 🎉
```


#### maverick L2 S7 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Target art needed: Max celebrating (no Max art yet).
```


#### maverick L2 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### maverick L3 S1 — text (OLD-ONLY)

Old:

```
Dash spent all his money. He accidentally steps on Aiden's headphones and breaks them. Aiden crashes out because:
```

Master:

```
He accidentally breaks Max's headphones. What's the problem Senna faces?
```


#### maverick L3 S1 — image (OLD-ONLY)

Old:

```
aiden-dash-chatting.webp
```

Master:

```
(blank)
```


#### maverick L3 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Dash has no money to buy a new pair
CHOICE B: Dash tries to fix them with sticky tape and now they're even worse
CHOICE C: the dog runs off with one of the pieces
CORRECT: A
```

Master:

```
CHOICE A: 💸 Senna has no money for a new pair.
CHOICE B: 🩹 Senna tapes them up and makes them worse.
CHOICE C: 🐶 A dog runs off with one of the pieces.
CORRECT: A
```


#### maverick L3 S1 — error (OLD-ONLY)

Old:

```
Haha, maybe. But let's try again.
```

Master:

```
(blank)
```


#### maverick L3 S2 — text (OLD-ONLY)

Old:

```
Where did the money go? Dash needs $40 for new headphones, but his wallet is empty. Drag the items Dash bought into the 'Spent' bucket.
```

Master:

```
Where did his money go? New headphones cost $60, but Senna's wallet is empty. Drag everything Senna bought into the Spent bucket.
```


#### maverick L3 S2 — settings (OLD-ONLY)

Old:

```
TOTAL: $40
ITEMS:
SPENT: 🚲 bike light - $7
SPENT: 🎣 fishing rod - $25
SPENT: 🍫 Snacks. - $8
```

Master:

```
TOTAL: $60
ITEMS:
SPENT: 🍔 Food court burgers - $25
SPENT: 🎮 Game credits - $20
SPENT: 🥤 Smoothies - $15
```


#### maverick L3 S3 — text (OLD-ONLY)

Old:

```
Aiden explains that keeping Cash for Emergencies gives you options. Match the event to what's possible if you have cash:
```

Master:

```
Max isn't upset for long, but Senna hates this feeling. Max says keeping Cash for Emergencies gives you choices. Match each event to what you could do.
```


#### maverick L3 S3 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L3 S3 — settings (OLD-ONLY)

Old:

```
PAIRS:
I broke my friend's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favourite game now
```

Master:

```
PAIRS:
I broke my friend's headphones = I can replace them
It's my friend's birthday = I can buy a gift
There's a sale at the game store = I can buy my favorite game now
```


#### maverick L3 S4 — text (OLD-ONLY)

Old:

```
Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.
```

Master:

```
Max helps Senna make a plan, so he's never caught out again. Put the plan in order, first to last.
```


#### maverick L3 S4 — settings (OLD-ONLY)

Old:

```
ITEMS: 💵 Earn money.
ITEMS: 🫙 Move a small amount to your Emergencies jar.
ITEMS: 🎮 Spend what is left on fun.
ORDER: earn-money-0,move-a-small-amount-to-your-emergencies-jar-1,spend-what-is-left-on-fun-2
```

Master:

```
ITEMS: 💵 First, Senna gets his spending money.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: spending, jar, fun
```


#### maverick L3 S5 — text (OLD-ONLY)

Old:

```
Aiden has $40 Cash to replace the headphones. He sees a $20 game he wants and thinks: "I'll spend this $20 now, and I'll just save more next week to buy the headphones." What should Aiden do?
```

Master:

```
A few weeks later, Senna has saved $60, just enough for Max's new headphones. Then he sees a $20 wireless charger. "I'll buy it now and save more next week," he thinks. What should he do?
```


#### maverick L3 S5 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L3 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: Buy the game and save $20 more next week.
CHOICE B: Buy the headphones to fix what he broke first.
CHOICE C: Buy the game and hope the headphones don't cost $40.
CORRECT: B
```

Master:

```
CHOICE A: 🔌 Buy the charger and save $20 more next week.
CHOICE B: 🎧 Buy Max's new headphones first.
CHOICE C: 🤞 Buy the charger and hope headphones cost less.
CORRECT: B
```


#### maverick L3 S5 — error (OLD-ONLY)

Old:

```
That's a trap! Stick to the plan to avoid stress later.
```

Master:

```
That's a trap! Stick to the plan, so there's no stress later. Try again!
```


#### maverick L3 S6 — text (OLD-ONLY)

Old:

```
Because I didn't ______ everything, I had ______ to ______ the headphones immediately.
```

Master:

```
Senna thinks: "Because I didn't ______ it all, I had cash to ______ Max's headphones right away."
```


#### maverick L3 S6 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L3 S6 — settings (OLD-ONLY)

Old:

```
OPTIONS: save | spend | cash for emergencies | borrowed money | replace | throw away
CORRECT: spend, cash for emergencies, replace
```

Master:

```
OPTIONS: 💸 spend | 🫙 save | 🔧 replace | 🗑️ throw away
CORRECT: 💸 spend, 🔧 replace
```


#### maverick L3 S6 — error (OLD-ONLY)

Old:

```
Not quite. Let's try again.
```

Master:

```
(blank)
```


#### maverick L3 S7 — text (OLD-ONLY)

Old:

```
Aiden could fix the problem because he had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:
```

Master:

```
Senna could replace the headphones because he kept some cash aside. Which are good things about keeping some money? Pick all that apply.
```


#### maverick L3 S7 — settings (OLD-ONLY)

Old:

```
CHOICE A: If I lose something, I can replace it myself.
CHOICE B: I won't have to ask my parents for money if I need something.
CHOICE C: I can save for a big goal instead of wasting it on small stuff that doesn't last.
CHOICE D: I worry less if I can afford things that I want, or have to buy.
CHOICE E: All of the above.
CORRECT: E
```

Master:

```
CHOICE A: 🔧 If something breaks, I can replace it.
CHOICE B: 🎯 I can save for something big.
CHOICE C: 😌 I worry less about paying for things.
CHOICE D: 🛍️ I can buy every deal I see.
CORRECT: A+B+C
```


#### maverick L3 S7 — error (OLD-ONLY)

Old:

```
Yes, but take a look at the other options and see if there's a better answer.
```

Master:

```
(blank)
```


#### maverick L3 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: bronze
```


#### maverick L4 S1 — text (OLD-ONLY)

Old:

```
Aiden's whole group is buying a game skin before it leaves the shop. Everyone’s saying it’ll be gone soon. Dash sees Aiden hold off anyway. What skill is Aiden practicing?
```

Master:

```
Senna's friends are all buying the game skin before the timer runs out. Max sees that Senna is holding off. What is Senna really doing by waiting?
```


#### maverick L4 S1 — image (OLD-ONLY)

Old:

```
aiden-dash-sidebyside.webp
```

Master:

```
(blank)
```


#### maverick L4 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: Aiden is just slow at clicking.
CHOICE B: Aiden has run out of money.
CHOICE C: Aiden stops to think.
CORRECT: C
```

Master:

```
CHOICE A: 🐢 Senna is just slow at clicking.
CHOICE B: 🫙 Senna has run out of money.
CHOICE C: 🧠 Senna stops to think.
CORRECT: C
```


#### maverick L4 S1 — error (OLD-ONLY)

Old:

```
Not quite! Take another look at what Aiden is choosing to do.
```

Master:

```
(blank)
```


#### maverick L4 S2 — text (OLD-ONLY)

Old:

```
Aiden explains why he waited: "Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed."

Drag the steps into order.
```

Master:

```
The next day, Max asks why Senna waited. "First I saw the countdown. Then I remembered my buy freeze," Senna says. Put Senna's story in order, first to last.
```


#### maverick L4 S2 — settings (OLD-ONLY)

Old:

```
ITEMS: 👀 Aiden sees the one-time offer.
ITEMS: 🧠 Aiden remembers the price could drop later.
ITEMS: ⏳ Aiden waits a day and checks again.
ITEMS: 😊 Aiden is happy he waited - he can buy the same item for even less.
ORDER: aiden-sees-the-one-time-offer-0,aiden-remembers-the-price-could-drop-later-1,aiden-waits-a-day-and-checks-again-2,aiden-is-happy-he-waited-he-can-buy-the-same-item-for-even-less-3
```

Master:

```
ITEMS: ⏰ Senna sees the countdown.
ITEMS: 🧠 He remembers his buy freeze.
ITEMS: 🏷️ Next day, the skin is half price.
ITEMS: 😊 Senna is glad he waited.
ORDER: countdown, freeze, half, glad
```


#### maverick L4 S3 — text (OLD-ONLY)

Old:

```
Which one helps Aiden stop and think?
```

Master:

```
Senna's head is buzzing about the skin. In each round, which thought helps him stop and think?
```


#### maverick L4 S3 — settings (master wins)

Old:

```
(blank)
```

Master:

```
ROUNDS:
A: ⏰ It ends soon. I have to buy it now! | B: 💰 I can wait and maybe get it cheaper. | CORRECT: B
A: 🔥 It looks so cool. I need it right now! | B: 😴 I'll sleep on it and decide tomorrow. | CORRECT: B
A: 👥 Everyone has it. I can't be left out! | B: 💬 I'll ask my friends if it's any good. | CORRECT: B
```


#### maverick L4 S3 — error (OLD-ONLY)

Old:

```
That thought is rushing you. Pick the one that helps you stop.
```

Master:

```
(blank)
```


#### maverick L4 S4 — text (OLD-ONLY)

Old:

```
Select which parts of the sign are making Aiden rush.
```

Master:

```
A bright sign outside a store grabs Senna's eye. Which parts of the sign are trying to make him rush? Pick all that apply.
```


#### maverick L4 S4 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CHOICE A: DON'T MISS OUT!
CHOICE B: ONLY 2 LEFT!
CHOICE C: ENDS TOMORROW!
CHOICE D: Adjustable height
CHOICE E: Quality checked
CORRECT: A+B+C
```


#### maverick L4 S4 — error (master wins)

Old:

```
That's just sign info, not a rush trick.
```

Master:

```
Hold up! That's just sign info, not a rush trick. Try again!
```


#### maverick L4 S4 — notes (master wins)

Old:

```
(blank)
```

Master:

```
New sign art needed (gaming chair store sign) with exactly these five lines. Or reuse fishing-rod-sign.webp and swap D back to 'Made in France'.
```


#### maverick L4 S5 — text (OLD-ONLY)

Old:

```
Aiden gets a limited-time offer for extra lives in his game. He remembers Dash's advice and stops. What should he ask himself?
```

Master:

```
Senna gets a limited-time offer for extra lives in his game. He remembers the skin that dropped to half price, so he pauses. What should he ask himself? Pick all that apply.
```


#### maverick L4 S5 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L4 S5 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CHOICE A: Do I really need this?
CHOICE B: Do I want it now, or is something rushing me?
CHOICE C: Will I have enough left for my goals?
CHOICE D: CLICK HERE TO BUY NOW!
CORRECT: A+B+C
```


#### maverick L4 S5 — error (OLD-ONLY)

Old:

```
Not quite! That button is trying to do the thinking for you. Don't let it!
```

Master:

```
(blank)
```


#### maverick L4 S6 — text (OLD-ONLY)

Old:

```
Aiden chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.
```

Master:

```
Senna keeps his money instead of buying extra lives. Drag his money from Spend Now to Save for Later.
```


#### maverick L4 S6 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L4 S6 — settings (master wins)

Old:

```
(blank)
```

Master:

```
SOURCE: 🛒 Spend Now
TARGET: 🐷 Save for Later
ITEM: money-coin.webp
IMAGE: piggy-bank.webp
SUCCESS: Money saved!
```


#### maverick L4 S7 — text (OLD-ONLY)

Old:

```
Aiden wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.
```

Master:

```
Senna's startup money started at $0. He put the money from three things he skipped into his envelope. Drag each one into the box to watch his startup money climb.
```


#### maverick L4 S7 — settings (OLD-ONLY)

Old:

```
TARGET: 20
LABEL: Savings
DROP: Things Aiden didn't buy
ITEMS: 🍫 Snacks at work ($5) 🎮 Extra lives bundle ($5) 🔦 Flashlight ($10)
```

Master:

```
TARGET: 40
LABEL: Startup money
DROP: Things Senna didn't buy
ITEMS: 🍕 Pizza after the game ($10) 🎮 Extra lives bundle ($10) 🧢 Another cap ($20)
```


#### maverick L4 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### maverick L5 S1 — text (OLD-ONLY)

Old:

```
It is Immi's birthday. The local gelato store offers a birthday discount. She wants Aiden to come with her and get one too. Going along so he is not left out is a ______ for Aiden.
```

Master:

```
It's Saskia's birthday, and the gelato shop has a birthday deal. Saskia wants Senna to get one too. For Senna, his own gelato is a ______.
```


#### maverick L5 S1 — image (OLD-ONLY)

Old:

```
aiden-waving-512.webp
```

Master:

```
(blank)
```


#### maverick L5 S1 — settings (master wins)

Old:

```
(blank)
```

Master:

```
OPTIONS: 🍦 want | ✅ need | 🧾 bill
CORRECT: 🍦 want
```


#### maverick L5 S1 — error (OLD-ONLY)

Old:

```
A limited time offer does not make it a 'need'.
```

Master:

```
(blank)
```


#### maverick L5 S2 — text (OLD-ONLY)

Old:

```
The birthday discount is only on today. Aiden is saving for a gap year and doesn't really want to spend the money on gelato. What should he do?
```

Master:

```
The gelato costs $8. The only money Senna has is his $40 startup money. What should he do?
```


#### maverick L5 S2 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L5 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: Skip buying his own gelato and ask Immi to share hers.
CHOICE B: Buy his own because the deal is only on today
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Skip his own gelato and ask if Saskia wants to share.
CHOICE B: 🍦 Buy his own, because the deal ends today.
CORRECT: A
```


#### maverick L5 S2 — error (OLD-ONLY)

Old:

```
The money for the gap year is the 'need'. The gelato is the 'want'.
```

Master:

```
(blank)
```


#### maverick L5 S3 — text (OLD-ONLY)

Old:

```
The gelato is a 'need' because the deal is only available today.
```

Master:

```
True or false: the gelato is a 'Need' because the deal is only on today.
```


#### maverick L5 S3 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L5 S3 — settings (master wins)

Old:

```
(blank)
```

Master:

```
CORRECT: False
```


#### maverick L5 S3 — error (OLD-ONLY)

Old:

```
A limited time offer does not turn a 'want' into a 'need'.
```

Master:

```
Nope! A deal that ends today doesn't turn a want into a need. Try again!
```


#### maverick L5 S4 — text (OLD-ONLY)

Old:

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Aiden right now?
```

Master:

```
Sort each item into the right bucket. Is it a want or a need for Senna right now?
```


#### maverick L5 S4 — settings (OLD-ONLY)

Old:

```
ITEMS:
NEED: 🎫 Airline ticket
WANT: 🍦 His own gelato
WANT: 🍨 Extra gelato toppings
NEED: 🪪 A new passport
```

Master:

```
ITEMS:
NEED:  🎙️ mic for his videos
NEED: 📄 Flyers for local clubs
WANT: 🍦 His own gelato
WANT: 🍨 Extra gelato toppings
```


#### maverick L5 S5 — text (OLD-ONLY)

Old:

```
Aiden does not want to feel left out, but the birthday deal expires today. What now?
```

Master:

```
The birthday deal is only on today. Senna feels left out without his own cup. What should he do now?
```


#### maverick L5 S5 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L5 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🤝 Share a gelato and keep at least half of what he would otherwise have spent.
CHOICE B: 🍦 Buy one so he isn't the odd one out
CORRECT: A
```

Master:

```
CHOICE A: 🤝 Stick with sharing Saskia's gelato.
CHOICE B: 🍦 Buy his own before the deal ends.
CORRECT: A
```


#### maverick L5 S5 — error (master wins)

Old:

```
Try again!
```

Master:

```
(blank)
```


#### maverick L5 S6 — text (OLD-ONLY)

Old:

```
Put these in the order Aiden should try. Best first.
```

Master:

```
Look back at Senna's trip to the gelato shop. Put what he did in order, first to last.
```


#### maverick L5 S6 — image (master wins)

Old:

```
not allowed
```

Master:

```
(blank)
```


#### maverick L5 S6 — settings (OLD-ONLY)

Old:

```
ITEMS: Ask if this is a 'want' or a 'need'
ITEMS: Share a gelato with Immi
ITEMS: Buy his own because it is only today
ORDER: ask,share,buy
```

Master:

```
ITEMS: 🤔 First, Senna asks if it's a want or a need.
ITEMS: 🤝 Then he asks Saskia if they can share hers.
ITEMS: 🍦 Saskia says yes, and they both dig in.
ORDER: want, share, yes
```


#### maverick L5 S7 — text (OLD-ONLY)

Old:

```
Immi was happy to share the gelato without Aiden having to pay for it. Aiden stays on track with saving for his big trip.
```

Master:

```
Saskia is happy to share her gelato, and Senna doesn't have to pay. What happens to his $40 startup money?
```


#### maverick L5 S7 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L5 S7 — settings (master wins)

Old:

```
CONTINUE → GO Screen 8
```

Master:

```
CHOICE A: 🫙 It stays safe at $40
CHOICE B: 🍦 It drops to $32
CORRECT: A
```


#### maverick L5 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### maverick L6 S1 — text (OLD-ONLY)

Old:

```
Aiden's friend Max asks him to the cinema this weekend. Ticket and popcorn are $18.
```

Master:

```
Saskia asks Senna to the movies. The ticket and popcorn cost $30, and Mom will pay half. Senna has saved $18 of spending money. Can he pay his half?
```


#### maverick L6 S1 — image (OLD-ONLY)

Old:

```
aiden-max-chatting.webp
```

Master:

```
(blank)
```


#### maverick L6 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: True
CHOICE B: False
CORRECT: A
```

Master:

```
CHOICE A: ✅ Yes, he has enough
CHOICE B: ❌ No, he's short
CORRECT: A
```


#### maverick L6 S1 — error (OLD-ONLY)

Old:

```
Keeping some money earlier is what makes paying his half possible.
```

Master:

```
(blank)
```


#### maverick L6 S1 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Mirrors Explorer: Mom pays half. OPEN QUESTION: Cath to confirm this suits a 17-year-old.
```


#### maverick L6 S2 — text (OLD-ONLY)

Old:

```
Last week Aiden almost spent money on game tokens. He had $30 cash available. What would have happened if he had bought the tokens?
```

Master:

```
Earlier this week, Senna nearly bought a $5 earbud case, but he decided he didn't need it. What would have happened if he had bought it?
```


#### maverick L6 S2 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L6 S2 — settings (OLD-ONLY)

Old:

```
CHOICE A: 😬 He might not have had enough left to pay for the cinema.
CHOICE B: 🎟️ The cinema ticket would have been free.
CHOICE C: 🎁 Max would've paid for everything.
CORRECT: A
```

Master:

```
CHOICE A: 😬 He'd have $13, not enough for his $15 half.
CHOICE B: 🎟️ The movie ticket would have been free.
CHOICE C: 🎁 Saskia would have paid for everything.
CORRECT: A
```


#### maverick L6 S2 — error (OLD-ONLY)

Old:

```
Buying the game tokens would have left him with less than $30.
```

Master:

```
(blank)
```


#### maverick L6 S3 — text (OLD-ONLY)

Old:

```
Sort what Aiden can do with the money he kept.
```

Master:

```
Because he didn't buy the earbud case, Senna has $18. His half of the movie costs $15. Which are good ideas for Senna? Sort each idea into Yes or No.
```


#### maverick L6 S3 — settings (OLD-ONLY)

Old:

```
ITEMS:
YES: 🎟️ Pay for the cinema
YES: 💰 Use the money for something else this weekend
NO: 🎮 Buy the game tokens and go to the cinema
NO: 🚫 Never spend any money
```

Master:

```
ITEMS:
YES: 🎟️ Pay his $15 half
YES: 💰 Save the remaining $3 for later
NO: 🎧 Buy the earbud case and movie ticket
NO: 🙋 Borrow $15 from Aiden
```


#### maverick L6 S4 — text (master wins)

Old:

```
True or False?
```

Master:

```
True or false? Check each statement against Senna's story.
```


#### maverick L6 S4 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L6 S4 — settings (OLD-ONLY)

Old:

```
ROUNDS:
Round 1 | Aiden saved his money last week so now he can pay for the cinema outing. | True | False | CORRECT: A
Round 2 | Max will pay for everything because Aiden spent all his money. | True | False | CORRECT: B
Round 3 | Aiden bought the game tokens and now he has less than $30 left. | True | False | CORRECT: B
```

Master:

```
ROUNDS:
Round 1 | Senna kept his money earlier this week. Now he can pay his half. | True | False | CORRECT: A
Round 2 | Saskia will pay for everything because Senna spent all his money. | True | False | CORRECT: B
Round 3 | Senna has to borrow from his brother Aiden to go. | True | False | CORRECT: B
```


#### maverick L6 S5 — text (OLD-ONLY)

Old:

```
Aiden has enough to pay for the $18 outing.
```

Master:

```
Senna's mom will pay half of the $30. Senna pays the other half from the $18 he has. How much will Senna have left?
```


#### maverick L6 S5 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L6 S5 — settings (OLD-ONLY)

Old:

```
How much does Aiden have left after he pays for the cinema?
CHOICE A: 💵 $12
CHOICE B: 🎟️ $18
CHOICE C: 🫙 $0
CORRECT: A
```

Master:

```
CHOICE A: 💵 $3
CHOICE B: 🎟️ $15
CHOICE C: 🫙 $0
CORRECT: A
```


#### maverick L6 S5 — error (OLD-ONLY)

Old:

```
$30 minus $18 leaves $12.
```

Master:

```
Not quite! $18 minus $15 leaves $3. Try again!
```


#### maverick L6 S6 — text (OLD-ONLY)

Old:

```
Drag the items in order, to show what just happened.
```

Master:

```
Look back at Senna's week. Put what happened in order, first to last.
```


#### maverick L6 S6 — settings (OLD-ONLY)

Old:

```
ITEMS:
Aiden didn't buy the game tokens last week. 
Aiden has enough money and spends $18 on the cinema outing.
Aiden still has $12 left.
ORDER: didn't buy, spends, left
```

Master:

```
ITEMS: 🎧 Earlier this week, Senna skips a $5 earbud case.
ITEMS: 📱 Today, Saskia asks him to the movies.
ITEMS: ✅ Senna says yes. He can pay his half!
ORDER: case, asks, yes
```


#### maverick L6 S7 — game type (master wins)

Old:

```
allocation-slider
```

Master:

```
drag-to-target
```


#### maverick L6 S7 — text (OLD-ONLY)

Old:

```
Aiden grins and tells Max “I’m in!”.
```

Master:

```
At the ticket counter, Mom pays her half. Drag Senna's $15 to the counter.
```


#### maverick L6 S7 — image (OLD-ONLY)

Old:

```
aiden-max-sidebyside.webp
```

Master:

```
(blank)
```


#### maverick L6 S7 — settings (OLD-ONLY)

Old:

```
TOTAL: 30
KEEP: 18
ITEM: Cinema
Slide to move $18 of Aiden's money to pay for the cinema. ($12 remains.)
```

Master:

```
SOURCE: 💵 $15
TARGET: 🎟️ Ticket counter
SUCCESS: Paid his half, and $3 is still safe!
```


#### maverick L6 S7 — error (OLD-ONLY)

Old:

```
Slide until $18 is set aside for the cinema. $12 stays in the jar.
```

Master:

```
(blank)
```


#### maverick L6 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: silver
```


#### maverick L7 S1 — text (OLD-ONLY)

Old:

```
Aiden and Max see a new energy drink. Aiden ______.
```

Master:

```
Senna and Saskia walk past a juice bar with a smoothie deal, on today only. Before reaching for his wallet, Senna ______.
```


#### maverick L7 S1 — image (OLD-ONLY)

Old:

```
aiden-max-sidebyside.webp
```

Master:

```
(blank)
```


#### maverick L7 S1 — settings (OLD-ONLY)

Old:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Max to pay for it CORRECT: 🧠 stops and thinks
```

Master:

```
OPTIONS: 🧠 stops and thinks | 🛍️ buys it straight away | 🙋 asks Saskia to pay
CORRECT: 🧠 stops and thinks
```


#### maverick L7 S1 — error (OLD-ONLY)

Old:

```
Not quite. He needs to stop and think first.
```

Master:

```
(blank)
```


#### maverick L7 S2 — text (OLD-ONLY)

Old:

```
Aiden remembers he still needs to pay for Dash's headphones that he broke. Replacing Dash's headphones is a...
```

Master:

```
Saskia is designing Senna's logo. Today they order logo stickers together. Senna's share is $15. Is paying his share a want or a need?
```


#### maverick L7 S2 — image (OLD-ONLY)

Old:

```
aiden-dash-chatting.webp
```

Master:

```
(blank)
```


#### maverick L7 S2 — settings (master wins)

Old:

```
CHOICE A: ✨ Want CHOICE B: ✅ Need CORRECT: B
```

Master:

```
CHOICE A: ✨ Want
CHOICE B: ✅ Need
CORRECT: B
```


#### maverick L7 S2 — error (OLD-ONLY)

Old:

```
Replacing the headphones is a need.
```

Master:

```
(blank)
```


#### maverick L7 S4 — game type (master wins)

Old:

```
savings-goal
```

Master:

```
binary-choice
```


#### maverick L7 S4 — text (OLD-ONLY)

Old:

```
Aiden has $45. Drag the items to see what is left.
```

Master:

```
Senna has $23: his $3 spare plus this week's $20 spending money. He pays his $15 share first. A smoothie is $8. What should Senna do?
```


#### maverick L7 S4 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L7 S4 — settings (OLD-ONLY)

Old:

```
AVAILABLE: $45 
ITEMS: 🎧 Headphones ($40) ⚡ Energy drink ($5)
```

Master:

```
CHOICE A: 🥤 Buy his own smoothie with his last $8
CHOICE B: 🤝 Share one smoothie with Saskia
CORRECT: B
```


#### maverick L7 S4 — error (OLD-ONLY)

Old:

```
Check the total against the $45.
```

Master:

```
Hold up! His own smoothie would use his last $8. Try again!
```


#### maverick L7 S5 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
savings-goal
```


#### maverick L7 S5 — text (OLD-ONLY)

Old:

```
Aiden has $45. Headphones are $40. One energy drink is $5. He can pay for the headphones and buy his own drink - but would have $0 left. What should he do?
```

Master:

```
Let's check the other choice. Drag his $15 share and an $8 smoothie into the box to see what Senna would have left.
```


#### maverick L7 S5 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L7 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: ⚡ Buy his own energy drink ($5) CHOICE B: 🤝 Find another way so he has some money left
CORRECT: B
```

Master:

```
AVAILABLE: $23
ITEMS: 🎨 Logo stickers ($15) 🥤 Smoothie ($8)
```


#### maverick L7 S5 — error (OLD-ONLY)

Old:

```
Buying his own energy drink uses the last $5. There will be nothing left.
```

Master:

```
(blank)
```


#### maverick L7 S7 — text (OLD-ONLY)

Old:

```
Aiden and Max see the same energy drink at the supermarket in a 'two for one' deal. They buy them there instead and Aiden has some money left over.
```

Master:

```
Senna and Saskia each pay $4 and share one smoothie. Drag the smoothie to Saskia to share it.
```


#### maverick L7 S7 — image (OLD-ONLY)

Old:

```
aiden-max-chatting.webp
```

Master:

```
(blank)
```


#### maverick L7 S7 — settings (OLD-ONLY)

Old:

```
SOURCE: ⚡ Energy drinks TARGET: 🤝 Split
```

Master:

```
SOURCE: 🥤 Smoothie
TARGET: 🤝 Share with Saskia
SUCCESS: Shared! And Senna still has $4.
```


#### maverick L7 S7 — error (OLD-ONLY)

Old:

```
Drag the energy drinks onto Split.
```

Master:

```
(blank)
```


#### maverick L7 S8 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L7 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: none
```


#### maverick L7 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image left blank, as Explorer.
```


#### maverick L9 S1 — text (OLD-ONLY)

Old:

```
Tap a skill. Finish all three, then tap Finish.
```

Master:

```
Tap a skill to test yourself. When all three are done, tap Finish.
```


#### maverick L9 S1 — image (OLD-ONLY)

Old:

```
aiden-waving-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S2 — text (OLD-ONLY)

Old:

```
Catch Impulse Spending means pausing before you spend so you don't buy on impulse.
```

Master:

```
Catch Impulse Spending means pausing before you spend. Which one is a pause?
```


#### maverick L9 S2 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S2 — settings (master wins)

Old:

```
CONTINUE → GO Screen 3
```

Master:

```
CHOICE A: 😴 Sleep on it first → GO Screen 3
CHOICE B: ⏰ Buy before the timer ends → GO Screen 3
CORRECT: A
```


#### maverick L9 S3 — text (master wins)

Old:

```
A flashing “only 1 minute left” deal is a good reason to buy straight away.
```

Master:

```
True or false: a flashing "only 15 minutes left" deal is a good reason to buy straight away.
```


#### maverick L9 S3 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S3 — error (OLD-ONLY)

Old:

```
A countdown is trying to rush you.
```

Master:

```
(blank)
```


#### maverick L9 S4 — text (OLD-ONLY)

Old:

```
Choose Needs Over Wants means covering what you actually need before spending on wants.
```

Master:

```
Choose Needs Over Wants means covering what you need before you spend on wants. Which one does Senna's video business need?
```


#### maverick L9 S4 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S4 — settings (master wins)

Old:

```
CONTINUE → GO Screen 5
```

Master:

```
CHOICE A: 🎙️ A new mic → GO Screen 5
CHOICE B: 🥤 A giant milkshake → GO Screen 5
CORRECT: A
```


#### maverick L9 S5 — text (OLD-ONLY)

Old:

```
Aiden needs to replace broken headphones. He also wants a new game skin. What should he buy first?
```

Master:

```
Senna's bike tire is flat, but he needs it to ride to school and he also wants a new game skin. Which should he buy first?
```


#### maverick L9 S5 — image (OLD-ONLY)

Old:

```
aiden-walking-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🎧 Headphones → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```

Master:

```
CHOICE A: 🚲 New bike tire → GO Screen 1
CHOICE B: 🎮 Game skin → GO Screen 1
CORRECT: A
```


#### maverick L9 S5 — error (OLD-ONLY)

Old:

```
Not quite! Which one can't wait? Try again!
```

Master:

```
(blank)
```


#### maverick L9 S6 — text (OLD-ONLY)

Old:

```
Don't Spend Money You Don't Have means not spending everything so you still have money for later.
```

Master:

```
Don't Spend Money You Don't Have means never going below zero. Senna has $12. A video game costs $20. Can he buy it?
```


#### maverick L9 S6 — image (OLD-ONLY)

Old:

```
aiden-sitting-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S6 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 7
```

Master:

```
CHOICE A: ❌ No, he's $8 short → GO Screen 7
CHOICE B: 🙋 Yes, if he borrows $8 → GO Screen 7
CORRECT: A
```


#### maverick L9 S6 — error (master wins)

Old:

```
(blank)
```

Master:

```
Hold up! Borrowing means spending money he doesn't have. Try again!
```


#### maverick L9 S7 — text (OLD-ONLY)

Old:

```
If you spend all your money now, you might not ______ something important later.
```

Master:

```
Senna kept his $40 startup money safe, then earned $20 doing chores. Now he has $60, so he can ______ his whole video kit!
```


#### maverick L9 S7 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S7 — settings (OLD-ONLY)

Old:

```
OPTIONS: 💸 afford | ✨ want | 👀 see CORRECT: 💸 afford
CONTINUE → GO Screen 1
```

Master:

```
OPTIONS: 💸 afford | 🙈 forget | 🗑️ lose
CORRECT: 💸 afford
CONTINUE → GO Screen 1
```


#### maverick L9 S8 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L9 S8 — settings (master wins)

Old:

```
(blank)
```

Master:

```
MEDAL: gold
```


#### maverick L9 S8 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Image blank as Explorer. Gold medals medal-skill1/2/3-gold.webp exist if Melvin wants them here.
```


#### maverick L7 S3 — text (OLD-ONLY)

Old:

```
Replacing Dash's headphones comes before the energy drink. Which skill is that?
```

Master:

```
Paying his share comes before the smoothie. Which skill is he using?
```


#### maverick L7 S3 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L7 S3 — settings (master wins)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: B
```

Master:

```
CHOICE A: 🧠 Catch Impulse Spending
CHOICE B: ✅ Choose Needs Over Wants
CHOICE C: 💰 Don't Spend Money You Don't Have
CORRECT: B
```


#### maverick L7 S3 — error (OLD-ONLY)

Old:

```
That skill is Choose Needs Over Wants.
```

Master:

```
(blank)
```


#### maverick L7 S6 — game type (master wins)

Old:

```
multiple-choice
```

Master:

```
binary-choice
```


#### maverick L7 S6 — text (OLD-ONLY)

Old:

```
Splitting the 2-for-1 energy drink leaves Aiden some money. Buying one at full price leaves $0. Which skill is he using?
```

Master:

```
What if the smoothie cost $9? After his share, Senna has $8. Can he buy his own?
```


#### maverick L7 S6 — image (OLD-ONLY)

Old:

```
aiden-max-sidebyside.webp
```

Master:

```
(blank)
```


#### maverick L7 S6 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧠 Catch Impulse Spending CHOICE B: ✅ Choose Needs Over Wants CHOICE C: 💰 Don't Spend Money You Don't Have CORRECT: C
```

Master:

```
CHOICE A: ❌ No, he's $1 short
CHOICE B: 🙋 Yes, if Saskia lends him $1
CORRECT: A
```


#### maverick L7 S6 — error (OLD-ONLY)

Old:

```
That skill is Don't Spend Money You Don't Have.
```

Master:

```
(blank)
```


#### maverick L8 S1 — text (OLD-ONLY)

Old:

```
Aiden has $15. He sees a phone case for $9. What do you want Aiden to do?
```

Master:

```
Senna sees a pair of sunglasses he loves for $24. What do you want Senna to do?
```


#### maverick L8 S1 — image (OLD-ONLY)

Old:

```
aiden-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S1 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🛍️ Buy it. He wants it and will have money left over → SET cash=6 → GO Screen 1-buy CHOICE B: ✋ Don’t buy it. He doesn’t need it → SET cash=15 → GO Screen 1-keep
```

Master:

```
CHOICE A: 🕶️ Buy them. He wants them and will still have money left → SET cash=16 → GO Screen 1-buy
CHOICE B: ✋ Don't buy them. He doesn't need them → SET cash=40 → GO Screen 1-keep
```


#### maverick L8 S1-buy — text (OLD-ONLY)

Old:

```
Aiden buys the phone case for $9. He has {cash} left.
```

Master:

```
Senna buys the sunglasses for $24. He has {cash} left.
```


#### maverick L8 S1-buy — image (OLD-ONLY)

Old:

```
aiden-walking-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S1-keep — text (OLD-ONLY)

Old:

```
Aiden leaves the phone case. He still has {cash}.
```

Master:

```
Senna puts the sunglasses back and keeps walking. He still has {cash}.
```


#### maverick L8 S1-keep — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S2 — text (OLD-ONLY)

Old:

```
Aiden has {cash} left. An arcade game card is $8. What do you want Aiden to do?
```

Master:

```
Senna has {cash} left when he passes the go-kart track. A race costs $20. What do you want Senna to do?
```


#### maverick L8 S2 — image (OLD-ONLY)

Old:

```
aiden-thinking-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S2 — settings (OLD-ONLY)

Old:

```
IF cash >= 8 THEN
CHOICE A: 🕹️ Pay $8 → SET cash=cash-8 → GO Screen 2-played
CHOICE B: 💰 Skip the arcade and keep the money → GO Screen 2-kept
IF cash < 8 THEN
TEXT: Aiden has {cash} left. The arcade card is $8, so he can’t pay. What do you want Aiden to do?
CHOICE A: 💭 See what would have happened if he hadn’t bought the case → GO Screen 2-alt
CHOICE B: 🚶 Skip the arcade → GO Screen 2-short
```

Master:

```
IF cash >= 20 THEN
CHOICE A: 🏎️ Pay $20 and race → SET cash=cash-20 → GO Screen 2-played
CHOICE B: 💰 Skip the go-karts and keep the money → GO Screen 2-kept
IF cash < 20 THEN
TEXT: Senna has {cash}. A race is $20, so he can't pay. What do you want Senna to do?
CHOICE A: 💭 See what would have happened if he hadn't bought the sunglasses → GO Screen 2-alt
CHOICE B: 🚶 Skip the go-karts → GO Screen 2-short
```


#### maverick L8 S2-played — text (OLD-ONLY)

Old:

```
Aiden pays $8 and plays the arcade. He has {cash} left.
```

Master:

```
Senna pays $20 and races with his friends. He has {cash} left.
```


#### maverick L8 S2-played — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S2-kept — text (OLD-ONLY)

Old:

```
Aiden skips the arcade and keeps his {cash}.
```

Master:

```
Senna skips the go-karts, chats with his friends instead and keeps his {cash}.
```


#### maverick L8 S2-kept — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S2-short — text (OLD-ONLY)

Old:

```
Aiden can’t pay the $8. He skips the arcade and keeps his {cash}.
```

Master:

```
Senna can't pay the $20, so he skips it and keeps his {cash}.
```


#### maverick L8 S2-short — image (OLD-ONLY)

Old:

```
aiden-sitting-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S2-alt — text (OLD-ONLY)

Old:

```
If Aiden hadn’t bought the case he would have $15 and could pay for the game card.
```

Master:

```
If Senna hadn't bought the sunglasses, he'd still have $40. He could pay for the race.
```


#### maverick L8 S2-alt — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S3 — text (OLD-ONLY)

Old:

```
Dash has $20. Friends are asking him along to a gym session that costs $8. What do you want Dash to do?
```

Master:

```
Meanwhile, across town, Saskia has $40. Her friends ask her along to an escape room that costs $20. What do you want Saskia to do?
```


#### maverick L8 S3 — image (OLD-ONLY)

Old:

```
dash-deciding-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S3 — settings (OLD-ONLY)

Old:

```
CHOICE A: 💪 Yes, join ($8) → SET cash=12 → GO Screen 4 CHOICE B: 💰 No, skip → SET cash=20 → GO Screen 4-alt
```

Master:

```
CHOICE A: 🔐 Yes, Saskia joins in ($20) → GO Screen 4
CHOICE B: 💰 No, she doesn't want to spend the money → GO Screen 4-alt
```


#### maverick L8 S3 — notes (master wins)

Old:

```
(blank)
```

Master:

```
Saskia has no art yet.
```


#### maverick L8 S4 — text (OLD-ONLY)

Old:

```
Dash has {cash} left. After the gym session, the friend group want to go for lunch. Dash is happy he said yes to the gym, because now he can join the lunch too.
```

Master:

```
Saskia has $20 left after a fun afternoon at the escape room. When the group goes for a snack, she's glad she said yes.
```


#### maverick L8 S4 — image (OLD-ONLY)

Old:

```
dash-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S4-alt — text (OLD-ONLY)

Old:

```
The next day everyone is talking about how good the gym session was, and they all went to lunch after. Dash still has his {cash}, but he missed all of it.
```

Master:

```
The next day, everyone is talking about the escape room, and the snack after. Saskia still has her $40, but she missed all of it.
```


#### maverick L8 S4-alt — image (OLD-ONLY)

Old:

```
dash-sitting-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S5 — text (OLD-ONLY)

Old:

```
Later, Aiden has $14. He wants a new water bottle for $9. What do you want Aiden to do?
```

Master:

```
Later that afternoon, Senna has {cash}. He sees a cool water bottle for $16. What do you want Senna to do?
```


#### maverick L8 S5 — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S5 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🧴 Buy the water bottle ($9) → SET cash=5 → GO Screen 5-buy CHOICE B: 💰 Don’t buy the water bottle → SET cash=14 → GO Screen 5-save
```

Master:

```
IF cash >= 16 THEN
CHOICE A: 🧴 Buy the water bottle ($16) → SET cash=cash-16 → GO Screen 5-buy
CHOICE B: 💰 Don't buy the water bottle → GO Screen 5-save
```


#### maverick L8 S5-buy — text (OLD-ONLY)

Old:

```
Aiden buys the water bottle for $9. He has {cash} left.
```

Master:

```
Senna buys the water bottle and fills it straight away. He has {cash} left.
```


#### maverick L8 S5-buy — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S5-save — text (OLD-ONLY)

Old:

```
Aiden skips the water bottle. He still has {cash}.
```

Master:

```
Senna skips the water bottle for now. He still has {cash}.
```


#### maverick L8 S5-save — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S6 — text (OLD-ONLY)

Old:

```
Aiden has {cash} left. Dash asks if he wants to come to the cinema with a group of friends. What do you want Aiden to do?
```

Master:

```
Then Max messages: some friends are going bowling tonight. A game is $20. Senna has {cash}. What do you want Senna to do?
```


#### maverick L8 S6 — image (OLD-ONLY)

Old:

```
aiden-dash-chatting.webp
```

Master:

```
(blank)
```


#### maverick L8 S6 — settings (OLD-ONLY)

Old:

```
IF cash = 5 THEN
CHOICE A: 🎟️ Ask if the group will switch to a cheaper session ($5) → SET cash=0 → GO Screen 7
CHOICE B: 🚶 Skip the cinema → SET cash=5 → GO Screen 7-skip
IF cash = 14 THEN
CHOICE A: 🎬 Go to the cinema ($8) → SET cash=6 → GO Screen 7-alt
CHOICE B: 🏠 Don’t go → SET cash=14 → GO Screen 7-home
```

Master:

```
IF cash >= 20 THEN
CHOICE A: 🎳 Go bowling ($20) → SET cash=cash-20 → GO Screen 7
CHOICE B: 🏠 Stay home and keep his money → GO Screen 7-home
IF cash < 20 THEN
CHOICE A: 🧩 Ask if everyone can play board games at Max's place instead (free) → GO Screen 7-games
CHOICE B: 🚶 Skip bowling → GO Screen 7-skip
```


#### maverick L8 S7 — text (OLD-ONLY)

Old:

```
You picked “Ask if the group will switch to a cheaper session ($5)”. The group said yes. Aiden got his water bottle and still went to the cinema with everyone. He has {cash} left.
```

Master:

```
Senna bowls with the whole group. He has {cash} left.
```


#### maverick L8 S7 — image (OLD-ONLY)

Old:

```
aiden-celebrating-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S7-skip — text (OLD-ONLY)

Old:

```
You picked “Skip the cinema”. Aiden has the new water bottle and {cash} left, and he missed the cinema.
```

Master:

```
Senna has {cash}, but he misses the night with his friends.
```


#### maverick L8 S7-skip — image (OLD-ONLY)

Old:

```
aiden-sitting-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S7-alt (text)

```
You picked “Go to the cinema ($8)”. Aiden did not buy the bottle, but he joined the group. He has {cash} left.
```


#### maverick L8 S7-alt (image)

```
aiden-dash-sidebyside.webp
```


#### maverick L8 S7-home — text (OLD-ONLY)

Old:

```
You picked “Don’t go”. Aiden still has {cash}, and he missed the bottle and the cinema.
```

Master:

```
Senna keeps his {cash}, but he misses bowling with his friends.
```


#### maverick L8 S7-home — image (OLD-ONLY)

Old:

```
aiden-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S8 — game type (master wins)

Old:

```
binary-choice
```

Master:

```
completion
```


#### maverick L8 S8 — text (OLD-ONLY)

Old:

```
Every choice you made shaped Dash's day. Spending on things that matter to you, like time with friends, can be worth it. Keeping some money back is smart too. It's about finding the right balance. That's real money thinking!
```

Master:

```
(blank)
```


#### maverick L8 S8 — image (OLD-ONLY)

Old:

```
dash-hands-on-hips-512.webp
```

Master:

```
(blank)
```


#### maverick L8 S8 — settings (OLD-ONLY)

Old:

```
CONTINUE → GO Screen 9
```

Master:

```
MEDAL: none
```


#### maverick L8 S9 (image)

```
aiden-celebrating-512.webp
```


- Master-only screen (not in this source): maverick L8 S7-games `binary-choice`

- Scenario beat count: source 0, master 26.


### explorer workbook sheet Explorer M1 Screens versus Explorer M1

Rows in this source: 110. Master explorer rows: 110.

#### explorer scenario beat 1 (source row 2) — image (master wins)

Old:

```
(blank)
```

Master:

```
lemonade-family-scene-r10.webp
```


#### explorer scenario beat 1 (source row 2) — image brief (OLD-ONLY)

Old:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna in the background, coins and a bill slipping through his fingers.
```

Master:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna (Senna younger) in the background, coins and a bill slipping through his fingers.
```


#### explorer scenario beat 1 (source row 2) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-intro-beat1-3cb1a9a8.mp3
```


#### explorer scenario beat 2 (source row 7) — image brief (OLD-ONLY)

Old:

```
Lars sitting on the edge of a bed, watching his big brother Senna count dog-walking money into a jar at home.
```

Master:

```
Lars sitting on the edge of a bed, watching his big brother Senna (Senna younger) count dog-walking money into a jar at home.
```


#### explorer scenario beat 2 (source row 7) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l1-beat1-6e798820.mp3
```


#### explorer L1 S5 — text (OLD-ONLY)

Old:

```
The next day, Lars gets his $5 pocket money. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```

Master:

```
The next day, Lars gets his $5 allowance. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### explorer scenario beat 3 (source row 11) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l1-beat2-82ce7599.mp3
```


#### explorer scenario beat 4 (source row 13) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l1-beat3-59e3b2a5.mp3
```


#### explorer L2 S4 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🎒 A new schoolbag
CHOICE B: 🥤 Fancy smoothie
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```

Master:

```
CHOICE A: 🎒 A new backpack
CHOICE B: 🥤 Fancy smoothie
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```


#### explorer scenario beat 5 (source row 18) — image brief (OLD-ONLY)

Old:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking keen.
```

Master:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking eager.
```


#### explorer scenario beat 5 (source row 18) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l2-beat3-69506625.mp3
```


#### explorer scenario beat 6 (source row 22) — text (OLD-ONLY)

Old:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike.

His parents say they'll help, but Lars has to pay for part of it himself. Pocket money won't get him there, so Lars makes a plan.
```

Master:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike.

His parents say they'll help, but Lars has to pay for part of it himself. His allowance won't get him there, so Lars makes a plan.
```


#### explorer scenario beat 6 (source row 22) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l2-beat1-cff52583.mp3
```


#### explorer scenario beat 7 (source row 23) — text (OLD-ONLY)

Old:

```
Lars wants to run a lemonade stand. First he needs a jug, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it.

Mom agrees, as long as the stand goes by their front gate, where she can see him.
```

Master:

```
Lars wants to run a lemonade stand. First he needs a pitcher, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it.

Mom agrees, as long as the stand goes by their front gate, where she can see him.
```


#### explorer scenario beat 7 (source row 23) — image brief (OLD-ONLY)

Old:

```
Lars writing his startup list (jug, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```

Master:

```
Lars writing his startup list (pitcher, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```


#### explorer scenario beat 7 (source row 23) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l2-beat2-923533ed.mp3
```


#### explorer scenario beat 8 (source row 25) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l2-beat4-dbec93d3.mp3
```


#### explorer L3 S4 — settings (OLD-ONLY)

Old:

```
ITEMS: 💵 First, Lars gets his pocket money.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: pocket, jar, fun
```

Master:

```
ITEMS: 💵 First, Lars gets his allowance.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: allowance, jar, fun
```


#### explorer scenario beat 9 (source row 30) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l3-beat1-3c920bf9.mp3
```


#### explorer scenario beat 10 (source row 34) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l3-beat2-f0fd7aac.mp3
```


#### explorer scenario beat 11 (source row 36) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l3-beat3-0e9295ad.mp3
```


#### explorer scenario beat 12 (source row 40) — text (OLD-ONLY)

Old:

```
After school, Lars walks home past the shops. Every window seems to be shouting at him.
```

Master:

```
After school, Lars walks home past the stores. Every window seems to be shouting at him.
```


#### explorer scenario beat 12 (source row 40) — image brief (OLD-ONLY)

Old:

```
Lars walking past a row of shop windows full of bright sale signs.
```

Master:

```
Lars walking past a row of store windows full of bright sale signs.
```


#### explorer scenario beat 12 (source row 40) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l4-beat3-32c15d3e.mp3
```


#### explorer scenario beat 13 (source row 45) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l4-beat1-d7e222fc.mp3
```


#### explorer scenario beat 14 (source row 46) — text (OLD-ONLY)

Old:

```
He tucks the envelope away. $10 saved, $5 to go.

He pictures his stand by the front gate, with a bright sign and a jug of lemonade.
```

Master:

```
He tucks the envelope away. $10 saved, $5 to go.

He pictures his stand by the front gate, with a bright sign and a pitcher of lemonade.
```


#### explorer scenario beat 14 (source row 46) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l4-beat2-e3a30f92.mp3
```


#### explorer scenario beat 15 (source row 48) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l4-beat4-12587413.mp3
```


#### explorer scenario beat 16 (source row 53) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l5-beat2-4b3b6461.mp3
```


#### explorer scenario beat 17 (source row 57) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l5-beat1-da75597d.mp3
```


#### explorer scenario beat 18 (source row 59) — text (OLD-ONLY)

Old:

```
A week later, the movie everyone's talking about hits the cinema.

Mia has an idea.
```

Master:

```
A week later, the movie everyone's talking about hits theaters.

Mia has an idea.
```


#### explorer scenario beat 18 (source row 59) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l5-beat3-dfde6164.mp3
```


#### explorer L6 S1 — text (OLD-ONLY)

Old:

```
Mia asks Lars to the movies. The ticket and popcorn cost $10, and Mom will pay half. Lars has saved $8 of pocket money. Can he pay his half?
```

Master:

```
Mia asks Lars to the movies. The ticket and popcorn cost $10, and Mom will pay half. Lars has saved $8 from his allowance. Can he pay his half?
```


#### explorer scenario beat 19 (source row 66) — text (OLD-ONLY)

Old:

```
Friday night, Mom and Lars meet Mia at the cinema. The smell of popcorn hits them at the door.
```

Master:

```
Friday night, Mom and Lars meet Mia at the movie theater. The smell of popcorn hits them at the door.
```


#### explorer scenario beat 19 (source row 66) — image brief (OLD-ONLY)

Old:

```
Lars, Mom and Mia arriving at a cinema entrance at night, a popcorn stand inside.
```

Master:

```
Lars, Mom and Mia arriving at a movie theater entrance at night, a popcorn stand inside.
```


#### explorer scenario beat 19 (source row 66) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l6-beat4-52418502.mp3
```


#### explorer scenario beat 20 (source row 68) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l6-beat1-0fa9f741.mp3
```


#### explorer scenario beat 21 (source row 69) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l6-beat2-489c0149.mp3
```


#### explorer scenario beat 22 (source row 71) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l6-beat3-64c955d0.mp3
```


#### explorer L7 S4 — text (OLD-ONLY)

Old:

```
Lars has $8: his $3 spare plus this week's $5 pocket money. He pays his $6 share first. A slushie is $2. What should Lars do?
```

Master:

```
Lars has $8: his $3 spare plus this week's $5 allowance. He pays his $6 share first. A slushie is $2. What should Lars do?
```


#### explorer scenario beat 23 (source row 80) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l7-beat1-dbb24a2f.mp3
```


#### explorer scenario beat 23 (source row 80) — notes (master wins)

Old:

```
After L7 S8
```

Master:

```
After L7 S7
```


#### explorer scenario beat 24 (source row 81) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l7-beat2-345adb43.mp3
```


#### explorer scenario beat 25 (source row 82) — text (OLD-ONLY)

Old:

```
Lars has two weeks of pocket money, $10, at the mall. And what he does with the money he brought, is up to you!
Let's see the choices Lars has to make today.
```

Master:

```
Lars has two weeks of allowance, $10, at the mall. And what he does with the money he brought, is up to you!
Let's see the choices Lars has to make today.
```


#### explorer scenario beat 25 (source row 82) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l7-beat3-9806274c.mp3
```


#### explorer scenario beat 26 (source row 111) — text (OLD-ONLY)

Old:

```
With $15 in his envelope, Lars buys a jug, cups, lemons and sugar. Mia's sign goes on the front.
On Saturday, his stand opens by the front gate.
He's one step closer to his mountain bike!
```

Master:

```
With $15 in his envelope, Lars buys a pitcher, cups, lemons and sugar. Mia's sign goes on the front.
On Saturday, his stand opens by the front gate.
He's one step closer to his mountain bike!
```


#### explorer scenario beat 26 (source row 111) — audio (master wins)

Old:

```
(blank)
```

Master:

```
explorer-m1-l9-beat1-96835870.mp3
```


#### explorer scenario beat 26 (source row 111) — notes (OLD-ONLY)

Old:

```
After L9 S8 (beat image 1 of 2)
```

Master:

```
After L9 S7 (beat image 1 of 2)
```



### Old-only: Explorer Module 2 sheet inside workbook.xlsx

Sheet `Explorer M2 Screens` is in the checked-in Explorer workbook. The master workbook is Module 1 only. The current converter reads the first sheet and rejects any row whose module is not 1, so this sheet is not played and is not imported into `lessons.json`. The whole sheet stays in the repo because the workbook stays until stage 3. Every screen is listed here so a later reader does not drop it by accident.

Module 2 rows: 99.

#### M2 L1 S1 word-drop (sheet row 2)

text:

```
It's Saturday, and Lars's stand is open by the front gate. The sun is hot. A neighbor stops and says a cold drink is just what she ______!
```


image:

```
lars-waving-512.webp
```


settings:

```
OPTIONS: 😋 wanted | 😖 dreaded | 🙈 forgot
CORRECT: 😋 wanted
```


notes:

```
Lesson title (proposed): The First Saturday. Skill 4, Create Value People Will Pay For (intro).
```


#### M2 L1 S2 true-false (sheet row 3)

text:

```
Lars wonders why anyone would pay. "It's only lemonade," he thinks. True or false: people pay for things that make their day better.
```


image:

```
lars-thinking-512.webp
```


settings:

```
CORRECT: True
```


#### M2 L1 S3 tap-reveal (sheet row 4)

text:

```
Why would a neighbor stop at Lars's stand? Tap each one to see if it's a reason to buy.
```


image:

```
not allowed
```


settings:

```
ITEMS:
YES: 🧊 Ice-cold on a hot day
YES: 🏡 Right on their own street
NO: 🫗 Cups only half full
NO: 😴 Lars asleep behind the stand
```


#### M2 L1 S4 multiple-choice (sheet row 5)

text:

```
A neighbor asks, "How much for a cup?" Lars hasn't picked a price yet. What should he say?
```


image:

```
lars-deciding-512.webp
```


settings:

```
CHOICE A: 🆓 It's free. It's just lemonade.
CHOICE B: 💵 It's $2 a cup.
CHOICE C: 💰 It's $20 a cup.
CORRECT: B
```


error:

```
Hold up! Free gives his work away, and $20 is way too much. Try again!
```


#### M2 L1 S5 hold-to-fill (sheet row 6)

text:

```
Lars's cheeks go red. He nearly blurts, "Oh, just have it for free!" Hold the button so Lars takes a breath and says his price.
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
HOLD: 🌬️ HOLD TO BREATHE 🌬️
FROZEN: 😌 READY 😌
```


#### M2 L1 S6 savings-goal (sheet row 7)

text:

```
"It's $2 a cup," Lars says, and she buys one! By lunch, the jug is empty. Drag each sale into the box to see what Lars earned.
```


image:

```
not allowed
```


settings:

```
TARGET: 20
LABEL: Money Lars earned
DROP: Cups sold
ITEMS: 🏡 Family next door ($8) 🚲 Kids on bikes ($6) 👵 Neighbor across the street ($4) 🐕 Dog walker ($2)
```


#### M2 L1 S7 binary-choice (sheet row 8)

text:

```
Lars holds $20. Nobody gave it to him as a present. Where did it come from?
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CHOICE A: 🍋 He made something people wanted to pay for
CHOICE B: 🎁 Someone left it as a surprise
CORRECT: A
```


#### M2 L1 S8 completion (sheet row 9)

image:

```
medal-skill4-bronze.webp
```


settings:

```
MEDAL: bronze
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 10)

text:

```
That night, Lars spreads $20 across his bed.

His birthday money was a present, but this money came from his own idea.
```


notes:

```
After L1 S8 (beat image 1 of 2)
```


image brief:

```
Lars sitting on his bed at night, grinning at $20 in bills and coins spread across the covers.
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 11)

text:

```
"Ten cups, and nobody said no to $2," he tells Senna.

Senna grins. "Told you. People pay for good stuff."
```


notes:

```
After L1 S8 (beat image 2 of 2)
```


image brief:

```
Lars and Senna chatting in Lars's bedroom doorway, Lars holding up the $20.
```


#### M2 L2 S1 binary-choice (sheet row 12)

text:

```
Next Saturday is cooler. Lars sits quietly behind his stand, and people walk right past. Why aren't they stopping?
```


image:

```
lars-sitting-512.webp
```


settings:

```
CHOICE A: 👀 They haven't noticed the stand
CHOICE B: 🍋 Nobody likes lemonade anymore
CORRECT: A
```


notes:

```
Lesson title (proposed): Who's Thirsty? Skill 5, Find & Close Simple Opportunities (intro).
```


#### M2 L2 S2 bucket-sort (sheet row 13)

text:

```
Who might want a cold lemonade this morning? Sort each one into Yes or No.
```


image:

```
not allowed
```


settings:

```
ITEMS:
YES: ⚽ Kids walking home from soccer
YES: 🧺 Shoppers at a street garage sale
NO: 🚌 Someone running for the bus
NO: 🛌 Neighbors still fast asleep
```


#### M2 L2 S3 spotlight-rounds (sheet row 14)

text:

```
Lars wants people to notice his stand. In each round, tap what he could say or do.
```


image:

```
not allowed
```


settings:

```
ROUNDS:
A: 🙂 Call out "Cold lemonade for $2!" | B: 😶 Sit quietly and hope | CORRECT: A
A: 🤷 Mumble "Um... want some?" | B: 🧊 Say "Ice-cold and made this morning!" | CORRECT: B
A: 👋 Smile and say hello | B: 📱 Stare at his tablet | CORRECT: A
```


notes:

```
No commas inside round text (separators).
```


#### M2 L2 S4 multiple-choice (sheet row 15)

text:

```
Mason walks by with his soccer team. They're hot and thirsty. One kid says, "Maybe later." What should Lars say?
```


image:

```
lars-mason-chatting.webp
```


settings:

```
CHOICE A: 🙂 No problem! I'm here until noon.
CHOICE B: 😠 Buy it now or never!
CHOICE C: 🆓 Fine. You can have it free.
CORRECT: A
```


error:

```
Hold up! Pushy or free won't help. A friendly reminder keeps the door open. Try again!
```


#### M2 L2 S5 word-drop (sheet row 16)

text:

```
The kid comes back! Lars says, "Cold lemonade is ______ a cup. Would you like ______?"
```


image:

```
lars-thinking-512.webp
```


settings:

```
OPTIONS: $2 | free | one | ten
CORRECT: $2, one
```


#### M2 L2 S6 rank-order (sheet row 17)

text:

```
Help Lars make his next sale. Put the steps in order, from first to last.
```


image:

```
not allowed
```


settings:

```
ITEMS: 👋 Smile and say hello.
ITEMS: 🍋 Tell them what it is and the price.
ITEMS: 🙋 Ask if they would like a cup.
ITEMS: 🥤 Pour the lemonade and hand it over.
ORDER: hello, price, ask, pour
```


#### M2 L2 S7 drag-to-target (sheet row 18)

text:

```
Five teammates buy a cup, and so does Mason. That's 6 cups at $2 each. Drag the $12 into Lars's pocket.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
SOURCE: 💵 $12
TARGET: 👖 Lars's pocket
SUCCESS: $12 on a quiet morning! 🎉
```


#### M2 L2 S8 completion (sheet row 19)

image:

```
medal-skill5-bronze.webp
```


settings:

```
MEDAL: bronze
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 20)

text:

```
Mason sips his lemonade. "So what's the catch?" he asks.

Lars laughs. "No catch. I just had to ask."
```


notes:

```
After L2 S8 (beat image 1 of 2)
```


image brief:

```
Lars and Mason beside the lemonade stand, Mason holding a cup and looking suspicious, Lars laughing.
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 21)

text:

```
Lars's pocket now holds $32.

That's $20 from last week, and $12 from today.
```


notes:

```
After L2 S8 (beat image 2 of 2)
```


image brief:

```
Lars behind his stand, counting bills into one pocket of his shorts.
```


#### M2 L3 S1 multiple-choice (sheet row 22)

text:

```
Lars has $32 he earned himself. Before spending any, he pauses. What does he really care about? Pick all that apply.
```


image:

```
not allowed
```


settings:

```
CHOICE A: 📚 The comic he's wanted for weeks
CHOICE B: 🍿 A snack with Mia
CHOICE C: 🚲 Money for his mountain bike
CHOICE D: 🧸 A toy he saw a minute ago
CORRECT: A+B+C
```


notes:

```
Lesson title (proposed): Where Did It Go? Skill 6, Track What You Earn and Spend (intro).
```


#### M2 L3 S2 allocation-slider (sheet row 23)

text:

```
Lars buys the $6 comic and shares a $2 snack with Mia. He has $24 left. He wants $10 of it for his bike. Slide to keep at least $10 for his bike.
```


image:

```
not allowed
```


settings:

```
TOTAL: 24
KEEP: 10
ITEM: 🚲 Bike money
```


notes:

```
Scored allocation-slider with no error line (open, Cosmo C5).
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 24)

text:

```
The comic is even better than Lars hoped, and he reads it twice.

He stuffs stand money, fun money and bike money into one pocket, all together. Only his Emergencies jar stays on the shelf.
```


notes:

```
After L3 S2
```


image brief:

```
Lars on his bed reading a new comic, his shorts pocket bulging with bills beside him, his Emergencies jar on the shelf.
```


#### M2 L3 S3 multiple-choice (sheet row 25)

text:

```
This week, Lars buys stand supplies and goes swimming with Mason. Now his $10 bike money isn't all there. Why?
```


image:

```
lars-deciding-512.webp
```


settings:

```
CHOICE A: 🍋 Stand costs came out of the same pocket
CHOICE B: 👻 A ghost borrowed it
CHOICE C: 🫧 Money shrinks in the wash
CORRECT: A
```


error:

```
Not quite! The lemons, cups and ice came out of his bike money too. Try again!
```


#### M2 L3 S4 word-drop (sheet row 26)

text:

```
Lars only has $6, and he was so sure about his bike money! He can't tell where it went, because he never ______ anything down.
```


image:

```
lars-thinking-512.webp
```


settings:

```
OPTIONS: 📝 wrote | 🎁 gave | 🗑️ threw
CORRECT: 📝 wrote
```


#### M2 L3 S5 tap-reveal (sheet row 27)

text:

```
Lars thinks back over the last three weeks. Tap each one. Did money come in?
```


image:

```
not allowed
```


settings:

```
ITEMS:
YES: 💵 First Saturday's lemonade
YES: ⚽ Cups for Mason's team
NO: 🍋 Lemons, cups and ice
NO: 🏊 Swimming with Mason
```


#### M2 L3 S6 rank-order (sheet row 28)

text:

```
Lars starts writing it all down. Put his notes in the order they happened, from first to last.
```


image:

```
not allowed
```


settings:

```
ITEMS: 📚 Comic and snack ($8 out)
ITEMS: 🍋 Stand supplies ($12 out)
ITEMS: 🏊 Swimming with Mason ($6 out)
ORDER: comic, supplies, swimming
```


#### M2 L3 S7 true-false (sheet row 29)

text:

```
Lars writes it on a scrap of paper. $24, then $12 and $6 out, leaves $6. True or false: his note shows where his bike money went.
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CORRECT: True
```


#### M2 L3 S8 completion (sheet row 30)

image:

```
medal-skill6-bronze.webp
```


settings:

```
MEDAL: bronze
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 31)

text:

```
Lars sticks the scrap to his wall. Bike money is $6, not $10.

It stings a little. But at least now he knows.
```


notes:

```
After L3 S8
```


image brief:

```
Lars pinning a small scrap of paper to his bedroom wall, looking a little disappointed but determined.
```


#### M2 L4 S1 binary-choice (sheet row 32)

text:

```
On Saturday, Mia tells Lars about a new stand two streets over. Its sign says "Juice $1". Lars charges $2. What's he worried about?
```


image:

```
lars-mia-chatting.webp
```


settings:

```
CHOICE A: 😟 Neighbors will buy the cheaper juice
CHOICE B: 🌧️ The juice stand will make it rain
CORRECT: A
```


notes:

```
Lesson title (proposed): Worth Two Dollars. Skill 4 (deepen).
```


#### M2 L4 S2 true-false (sheet row 33)

text:

```
Lars thinks, "I'll drop to $1 and get everyone." True or false: at $1, he'd need to sell twice as many cups for the same money.
```


image:

```
lars-thinking-512.webp
```


settings:

```
CORRECT: True
```


error:

```
Look again! Half the price means double the cups for the same bike money. Try again!
```


#### M2 L4 S3 link-match (sheet row 34)

text:

```
Mia admits she'd pick the $1 juice. Lars isn't so sure. Match each event to what his lemonade offers.
```


image:

```
not allowed
```


settings:

```
PAIRS:
It's a hot Saturday = Lots of ice keeps every cup cold
Neighbors want something fresh = Lemons squeezed that morning taste better
People plan their week = Open every Saturday so they know when to come
```


#### M2 L4 S4 spotlight-rounds (sheet row 35)

text:

```
A neighbor asks, "The other stand is $1. Can you do $1?" In each round, tap Lars's better reply.
```


image:

```
not allowed
```


settings:

```
ROUNDS:
A: 😬 "Okay... $1 then." | B: 🍋 "It's $2. Fresh lemons and lots of ice!" | CORRECT: B
A: 🙂 "I'm here every Saturday morning." | B: 🆓 "Fine. The first cup's free." | CORRECT: A
A: 🤝 "Happy to pour you one at $2." | B: 📉 "I'll match any price!" | CORRECT: A
```


notes:

```
No commas inside round text (separators).
```


#### M2 L4 S5 rank-order (sheet row 36)

text:

```
Put Lars's choices about the $1 juice in order, from best move to worst.
```


image:

```
not allowed
```


settings:

```
ITEMS: 🍋 Show what makes his lemonade worth $2.
ITEMS: 🤐 Keep his price and say nothing.
ITEMS: 📉 Drop to $1 to win everyone.
ORDER: show, nothing, drop
```


#### M2 L4 S6 word-drop (sheet row 37)

text:

```
The neighbor tries a cup. "Wow, so cold and fresh!" Lars sees that people pay a fair price for something ______.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
OPTIONS: ⭐ they really like | 📉 always cheaper | 🤷 by accident
CORRECT: ⭐ they really like
```


#### M2 L4 S7 savings-goal (sheet row 38)

text:

```
By noon, Lars has sold 8 cups at $2. Drag each sale into the box to see what he earned.
```


image:

```
not allowed
```


settings:

```
TARGET: 16
LABEL: Money in
DROP: Cups sold at $2
ITEMS: 🏡 Family next door ($6) 👵 Neighbor across the street ($4) ⚽ Soccer kids ($4) 🚚 Mail carrier ($2)
```


#### M2 L4 S8 completion (sheet row 39)

image:

```
medal-skill4-silver.webp
```


settings:

```
MEDAL: silver
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 40)

text:

```
On the way home, Mia tries a cup.

"Okay," she admits. "That's way better than the $1 juice."
```


notes:

```
After L4 S8
```


image brief:

```
Mia sipping lemonade beside the stand, eyebrows raised in surprise, Lars grinning.
```


#### M2 L5 S1 true-false (sheet row 41)

text:

```
Mia designed the sign for Lars's stand. Now neighbors keep asking who made it. True or false: making signs is a skill people might pay for.
```


image:

```
mia-working.webp
```


settings:

```
CORRECT: True
```


notes:

```
Lesson title (proposed): Mia Names Her Price. Skill 5 (deepen). Explorer Character on completion: Mia. Melvin: Mia's art files in the repo are capitalized (Mia-*.webp); rename them or confirm the lowercase names.
```


#### M2 L5 S2 spotlight-rounds (sheet row 42)

text:

```
Some offers are real paid work. Some just sound nice. In each round, tap the real offer for Mia.
```


image:

```
not allowed
```


settings:

```
ROUNDS:
A: 🖍️ "Make our garage sale sign for $5." | B: 🙏 "Make it free. It's good practice." | CORRECT: A
A: 🤷 "Maybe we'll pay you one day." | B: 📅 "A $5 sign by Friday please." | CORRECT: B
A: 🆓 "Do three signs free first." | B: 💬 "We'll pay $5 for one sign." | CORRECT: B
```


notes:

```
No commas inside round text (separators).
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 43)

text:

```
Last month, Mia made a birthday banner for a neighbor, for free.

She hoped they'd pay her next time. They didn't.
```


notes:

```
After L5 S2 (beat image 1 of 2)
```


image brief:

```
Mia at her desk with markers, finishing a colorful birthday banner.
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 44)

text:

```
Mia wants a gaming console, and the money is up to her.

"Free banners won't get me there," she sighs.
```


notes:

```
After L5 S2 (beat image 2 of 2)
```


image brief:

```
Mia sitting on her bed, looking into a jar with a game controller drawn on its label.
```


#### M2 L5 S3 word-drop (sheet row 45)

text:

```
A neighbor asks Mia to make a sign for his garage sale. With her mom beside her, Mia says, "One sign is ______, ready by ______."
```


image:

```
mia-thinking.webp
```


settings:

```
OPTIONS: $5 | free | Friday | someday
CORRECT: $5, Friday
```


#### M2 L5 S4 binary-choice (sheet row 46)

text:

```
The neighbor says, "Do this one free, and I'll tell my friends." Mia really wants the work. What should she do?
```


image:

```
lars-mia-sidebyside.webp
```


settings:

```
CHOICE A: 💬 Politely keep her $5 price
CHOICE B: 🆓 Do it free and hope
CORRECT: A
```


error:

```
Hold up! Remember the free banner. Free didn't lead to paid. Try again!
```


#### M2 L5 S5 hold-to-fill (sheet row 47)

text:

```
The neighbor goes quiet. Mia wants to blurt, "Free is fine!" Hold the button so she waits for his answer.
```


image:

```
mia-happy.webp
```


settings:

```
HOLD: 🤐 HOLD TO STAY QUIET 🤐
FROZEN: ⏳ WAITING ⏳
```


#### M2 L5 S6 multiple-choice (sheet row 48)

text:

```
"Okay, $5 it is," says the neighbor. Lars cheers for Mia. What made her offer work? Pick all that apply.
```


image:

```
not allowed
```


settings:

```
CHOICE A: 💵 A clear price
CHOICE B: 📅 A clear day
CHOICE C: 🙂 A friendly and polite answer
CHOICE D: 🆓 Doing it free first
CORRECT: A+B+C
```


#### M2 L5 S7 drag-to-target (sheet row 49)

text:

```
On Friday, Mia hands over the sign and gets $5. Drag the $5 into her console jar.
```


image:

```
mia-celebrating.webp
```


settings:

```
SOURCE: 💵 $5
TARGET: 🎮 Console jar
SUCCESS: Her first paid sign! 🎉
```


#### M2 L5 S8 completion (sheet row 50)

image:

```
medal-skill5-silver.webp
```


settings:

```
MEDAL: silver
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 51)

text:

```
Mia drops the $5 into her console jar.

"One paid sign," she says. "Way better than a free one."
```


notes:

```
After L5 S8
```


image brief:

```
Mia at her desk dropping a $5 bill into her console jar, smiling.
```


#### M2 L6 S1 binary-choice (sheet row 52)

text:

```
Saturday is hot again. Lars sells 12 cups of lemonade at $2 each. How much money comes in?
```


image:

```
lars-walking-512.webp
```


settings:

```
CHOICE A: 💵 $24
CHOICE B: 🪙 $14
CORRECT: A
```


notes:

```
Lesson title (proposed): What He Really Kept. Skill 6 (deepen).
```


#### M2 L6 S2 tap-reveal (sheet row 53)

text:

```
"I made $24!" Lars cheers. Senna says some of it is already spent. Tap each one. Did it cost Lars money?
```


image:

```
not allowed
```


settings:

```
ITEMS:
YES: 🍋 Lemons for today's jug
YES: 🥤 A new pack of cups
NO: 💬 A neighbor's thank-you
NO: 🌞 The sunny weather
```


#### M2 L6 S3 bucket-sort (sheet row 54)

text:

```
Lars adds up what came out of his pocket this week. Drag each one into the Spent bucket.
```


image:

```
not allowed
```


settings:

```
TOTAL: $12
SPENT: 🍋 Lemons - $5
SPENT: 🥤 Cups - $3
SPENT: 🧊 Ice - $2
SPENT: 🍦 Frozen yogurt with Mia - $2
```


#### M2 L6 S4 multiple-choice (sheet row 55)

text:

```
Lars took in $24. Then $12 went out. What did he really keep this week?
```


image:

```
lars-thinking-512.webp
```


settings:

```
CHOICE A: 💵 $12
CHOICE B: 💰 $24
CHOICE C: 🪙 $36
CORRECT: A
```


error:

```
Hold up! What came in isn't what he kept. Take away what went out. Try again!
```


#### M2 L6 S5 multiple-choice (sheet row 56)

text:

```
Lars sorts this week's spending into stand, fun and bike. Which costs are stand money? Pick all that apply.
```


image:

```
not allowed
```


settings:

```
CHOICE A: 🍋 Lemons $5
CHOICE B: 🥤 Cups $3
CHOICE C: 🧊 Ice $2
CHOICE D: 🍦 Frozen yogurt $2
CORRECT: A+B+C
```


#### M2 L6 S6 allocation-slider (sheet row 57)

text:

```
Lars kept $12 this week. He wants $8 of it to go to his bike. Slide to keep at least $8 for his bike.
```


image:

```
not allowed
```


settings:

```
TOTAL: 12
KEEP: 8
ITEM: 🚲 Bike money
```


#### M2 L6 S7 binary-choice (sheet row 58)

text:

```
Lars writes the week on a new scrap: $24 in, $12 out, $8 for the bike. What does this note tell him?
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CHOICE A: 📝 What he really kept this week
CHOICE B: 🤷 Nothing useful at all
CORRECT: A
```


#### M2 L6 S8 completion (sheet row 59)

image:

```
medal-skill6-silver.webp
```


settings:

```
MEDAL: silver
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 60)

text:

```
Lars adds the new note to the others.

One is under his bed, one is in his comic, and two are on his desk.
```


notes:

```
After L6 S8
```


image brief:

```
Lars's bedroom with paper scraps everywhere: one under the bed, one sticking out of a comic, two on the desk.
```


#### M2 L7 S1 true-false (sheet row 61)

text:

```
On the first Saturday, Lars almost gave his lemonade away. Now four scraps of notes sit around his room. True or false: now he says his price, asks clearly and writes things down.
```


image:

```
lars-waving-512.webp
```


settings:

```
CORRECT: True
```


notes:

```
Lesson title (proposed): Look How Far. All three skills (integration). No story beats inside L7.
```


#### M2 L7 S2 link-match (sheet row 62)

text:

```
Lars has come a long way since his first Saturday. Match each event to what he does now.
```


image:

```
not allowed
```


settings:

```
PAIRS:
A neighbor asks the price = He says "$2 a cup" with a smile
Someone walks past = He asks if they'd like one
Money comes in or goes out = He writes it down
```


#### M2 L7 S3 multiple-choice (sheet row 63)

text:

```
What can Lars do now that he couldn't before? Pick all that apply.
```


image:

```
not allowed
```


settings:

```
CHOICE A: 💵 Name a fair price
CHOICE B: 🙋 Turn a "maybe later" into a yes
CHOICE C: 📝 Know what he really kept
CHOICE D: 🆓 Give cups away to win friends
CORRECT: A+B+C
```


#### M2 L7 S4 binary-choice (sheet row 64)

text:

```
Senna won't spend $20 on a rain jacket, so he skips rainy dog walks. What happens to his money?
```


image:

```
senna-walking-512.webp
```


settings:

```
CHOICE A: 🌧️ He misses out on walk money
CHOICE B: 💰 He saves more by skipping
CORRECT: A
```


error:

```
Not quite! No walks means no walk money. Try again!
```


#### M2 L7 S5 spotlight-rounds (sheet row 65)

text:

```
Lars helps Senna think it through. In each round, tap the smarter choice.
```


image:

```
not allowed
```


settings:

```
ROUNDS:
A: 🧥 Buy the jacket and take rainy walks | B: 🏠 Skip every rainy walk | CORRECT: A
A: 📝 Write the jacket down as money out | B: 🙈 Leave it out of his notes | CORRECT: A
A: 🔒 Keep every dollar no matter what | B: 🎯 Spend on what helps him earn | CORRECT: B
```


#### M2 L7 S6 word-drop (sheet row 66)

text:

```
Lars tells Senna, "Spending on what helps you ______ can be worth it."
```


image:

```
lars-senna-chatting.webp
```


settings:

```
OPTIONS: 💵 earn | 😎 show off | 🙈 hide
CORRECT: 💵 earn
```


#### M2 L7 S7 drag-to-target (sheet row 67)

text:

```
Senna finally agrees. Drag his $20 to the rain jacket.
```


image:

```
senna-celebrating-512.webp
```


settings:

```
SOURCE: 💵 $20
TARGET: 🧥 Rain jacket
SUCCESS: No more skipped walks!
```


#### M2 L7 S8 completion (sheet row 68)

settings:

```
MEDAL: none
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 69)

text:

```
The next rainy afternoon, Senna heads out in his new jacket.

"Two walks already," he calls. "It's paying for itself!"
```


notes:

```
After L7 S8
```


image brief:

```
Senna in a bright rain jacket, waving from the front path in the rain, Lars at the window.
```


#### M2 L8 S1 spotlight-rounds (sheet row 70)

text:

```
It's a hot Saturday! Mason asks Lars to come to the park this morning. What do you want Lars to do?
```


image:

```
lars-deciding-512.webp
```


settings:

```
CHOICE A: 🍋 Open the stand all morning → SET cash=20 → GO Screen 1-stand
CHOICE B: 🌳 Go to the park first and open after lunch → SET cash=10 → GO Screen 1-park
```


notes:

```
Lesson title (proposed): Busy Saturday. All three skills (choose your own). {cash} is today's money only: L8 does not change the module's running total (as M1 L8).
```


#### M2 L8 S1-stand binary-choice (sheet row 71)

text:

```
Lars sells all morning. Ten cups at $2 each gives him {cash}.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CONTINUE → GO Screen 2
```


#### M2 L8 S1-park binary-choice (sheet row 72)

text:

```
Lars has fun at the park with Mason. After lunch, he sells five cups and has {cash}.
```


image:

```
lars-mason-sidebyside.webp
```


settings:

```
CONTINUE → GO Screen 2
```


#### M2 L8 S2 spotlight-rounds (sheet row 73)

text:

```
Lars has {cash}. Then the ice runs out, and the lemonade gets warm. A bag of ice costs $2. What do you want Lars to do?
```


image:

```
lars-thinking-512.webp
```


settings:

```
CHOICE A: 🧊 Buy ice for $2 → SET cash=cash+6 → GO Screen 2-ice
CHOICE B: 🫗 Keep selling warm lemonade → SET cash=cash+2 → GO Screen 2-warm
```


#### M2 L8 S2-ice binary-choice (sheet row 74)

text:

```
Mom walks with Lars to buy the ice. Cold cups sell fast! After paying for the ice, he has {cash}.
```


image:

```
lars-walking-512.webp
```


settings:

```
CONTINUE → GO Screen 3
```


#### M2 L8 S2-warm binary-choice (sheet row 75)

text:

```
Warm lemonade is a tough sell. Only one more neighbor buys a cup. Lars has {cash}.
```


image:

```
lars-sitting-512.webp
```


settings:

```
CONTINUE → GO Screen 3
```


#### M2 L8 S3 spotlight-rounds (sheet row 76)

text:

```
Mason's soccer team is finishing practice down the street. Lars has {cash}. What do you want Lars to do?
```


image:

```
lars-mason-chatting.webp
```


settings:

```
CHOICE A: 📣 Ask Mason to tell the team → SET cash=cash+8 → GO Screen 3-team
CHOICE B: 🤐 Wait and see if they come → GO Screen 3-quiet
```


#### M2 L8 S3-team binary-choice (sheet row 77)

text:

```
Four teammates come over and buy a cup each. Lars now has {cash}.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CONTINUE → GO Screen 4
```


#### M2 L8 S3-quiet binary-choice (sheet row 78)

text:

```
The team heads straight home without noticing the stand. Lars still has {cash}.
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CONTINUE → GO Screen 4
```


#### M2 L8 S4 spotlight-rounds (sheet row 79)

text:

```
Mia stops by on her way to a garage sale down the street. Everything there is $3. Lars has {cash}. What do you want Lars to do?
```


image:

```
lars-mia-chatting.webp
```


settings:

```
CHOICE A: 🔎 Go with Mia and look for a $3 cooler bag → SET cash=cash-3 → GO Screen 4-browse
CHOICE B: 🍋 Keep the stand open for garage-sale shoppers → SET cash=cash+6 → GO Screen 4-keep
```


#### M2 L8 S4-browse binary-choice (sheet row 80)

text:

```
Lars has wanted a cooler bag since his ice ran out. He checks that the zipper works, then pays $3. He has {cash} left.
```


image:

```
lars-mia-sidebyside.webp
```


settings:

```
CONTINUE → GO Screen 5
```


#### M2 L8 S4-keep binary-choice (sheet row 81)

text:

```
Lars waves Mia off. Soon, shoppers from the garage sale walk past, and three of them buy a cup. Lars now has {cash}.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CONTINUE → GO Screen 5
```


#### M2 L8 S5 spotlight-rounds (sheet row 82)

text:

```
Back home, Lars has {cash}. How much do you want him to put toward his bike?
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
IF cash >= 10 THEN
CHOICE A: 🚲 $10 for the bike → SET cash=cash-10 → GO Screen 5-big
CHOICE B: 🚲 $5 for the bike → SET cash=cash-5 → GO Screen 5-small
CHOICE C: 🫙 Keep it all for now → GO Screen 5-none
IF cash < 10 THEN
TEXT: Back home, Lars has {cash}. That's not enough for $10. How much do you want him to put toward his bike?
CHOICE A: 🚲 $5 for the bike → SET cash=cash-5 → GO Screen 5-small
CHOICE B: 🫙 Keep it all for now → GO Screen 5-none
```


notes:

```
Melvin: the cash >= 10 branch now has three choices. Check that the decision screen shows all three.
```


#### M2 L8 S5-big binary-choice (sheet row 83)

text:

```
$10 goes toward the bike. Lars has {cash} left for the stand and fun.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CONTINUE → GO Screen 6
```


#### M2 L8 S5-small binary-choice (sheet row 84)

text:

```
$5 goes toward the bike. Lars has {cash} left for the stand and fun.
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CONTINUE → GO Screen 6
```


#### M2 L8 S5-none binary-choice (sheet row 85)

text:

```
Lars keeps all {cash} for now. The bike will have to wait a little longer.
```


image:

```
lars-sitting-512.webp
```


settings:

```
CONTINUE → GO Screen 6
```


#### M2 L8 S6 spotlight-rounds (sheet row 86)

text:

```
Before bed, Lars wants to remember his busy day. What do you want him to do?
```


image:

```
lars-thinking-512.webp
```


settings:

```
CHOICE A: 📝 Write money in and out on a note → GO Screen 6-note
CHOICE B: 🧠 Try to remember it all → GO Screen 6-head
```


#### M2 L8 S6-note binary-choice (sheet row 87)

text:

```
Lars writes it all down. One more note joins the pile on his desk.
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CONTINUE → GO Screen 7
```


#### M2 L8 S6-head binary-choice (sheet row 88)

text:

```
By Monday, Lars can't remember what the ice cost or how many cups he sold.
```


image:

```
lars-sitting-512.webp
```


settings:

```
CONTINUE → GO Screen 7
```


#### M2 L8 S7 binary-choice (sheet row 89)

text:

```
What a Saturday! Lars ends the day with {cash} for the stand and fun. Every choice changed that number.
```


image:

```
lars-waving-512.webp
```


settings:

```
CONTINUE → GO Screen 8
```


#### M2 L8 S8 completion (sheet row 90)

settings:

```
MEDAL: none
```


#### M2 L9 S1 binary-choice (sheet row 91)

text:

```
Tap a skill to test yourself. When all three are done, tap Finish.
```


image:

```
lars-waving-512.webp
```


settings:

```
HUB
BUTTON: 🍋 Create Value People Will Pay For → GO Screen 2
BUTTON: 🙋 Find & Close Simple Opportunities → GO Screen 4
BUTTON: 📝 Track What You Earn and Spend → GO Screen 6
BUTTON: Finish → GO Screen 8 WHEN complete
```


notes:

```
Lesson title (proposed): A Regular Order. All three skills (mastery hub).
```


#### M2 L9 S2 binary-choice (sheet row 92)

text:

```
Create Value People Will Pay For means offering something people want. A neighbor wants cold lemonade every Saturday for lunch. Why would she pay Lars?
```


image:

```
lars-thinking-512.webp
```


settings:

```
CHOICE A: 🧊 Fresh cold lemonade right next door → GO Screen 3
CHOICE B: 🤷 Because she feels sorry for him → GO Screen 3
CORRECT: A
```


#### M2 L9 S3 true-false (sheet row 93)

text:

```
True or false: Lars should drop to $1 a cup so she's sure to say yes.
```


image:

```
lars-deciding-512.webp
```


settings:

```
CORRECT: False
CONTINUE → GO Screen 1
```


error:

```
Not quite! His lemonade is worth $2. Half price means double the cups. Try again!
```


#### M2 L9 S4 binary-choice (sheet row 94)

text:

```
Find & Close Simple Opportunities means asking clearly. She asks about 4 cups each Saturday. Which reply gets a clear answer?
```


image:

```
lars-hands-on-hips-512.webp
```


settings:

```
CHOICE A: 💬 "4 cups is $8. Can I start this Saturday?" → GO Screen 5
CHOICE B: 🤷 "Um... pay whatever you like." → GO Screen 5
CORRECT: A
```


#### M2 L9 S5 word-drop (sheet row 95)

text:

```
She says, "Maybe. Let me think." Lars smiles. "No problem. I'm here every ______ morning."
```


image:

```
lars-walking-512.webp
```


settings:

```
OPTIONS: 📅 Saturday | 🌙 midnight | 🤷 sometimes
CORRECT: 📅 Saturday
CONTINUE → GO Screen 1
```


#### M2 L9 S6 binary-choice (sheet row 96)

text:

```
Track What You Earn and Spend means writing down money in and out. After four Saturdays of her order, which note helps Lars most?
```


image:

```
lars-sitting-512.webp
```


settings:

```
CHOICE A: 📝 "$32 in. $8 out for lemons." → GO Screen 7
CHOICE B: 🧠 "I'll just remember it." → GO Screen 7
CORRECT: A
```


#### M2 L9 S7 true-false (sheet row 97)

text:

```
Lars's note says $32 in and $8 out. True or false: he really kept $24.
```


image:

```
lars-celebrating-512.webp
```


settings:

```
CORRECT: True
CONTINUE → GO Screen 1
```


#### M2 L9 S8 completion (sheet row 98)

settings:

```
MEDAL: gold
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 99)

text:

```
The neighbor's order becomes a Saturday habit: $8 every week he can count on.

His bike money is growing, one scrap of paper at a time.
```


notes:

```
After L9 S8 (beat image 1 of 2)
```


image brief:

```
Lars handing a tray of four lemonade cups across the front gate to a smiling neighbor, Mom waving from the porch.
```


#### M2 LScenario Beat S(none) scenario-beat (sheet row 100)

text:

```
On Sunday, Lars gathers his notes from his desk, his bed and his comic.

He can see the pieces, but he can't see the total yet.
```


notes:

```
After L9 S8 (beat image 2 of 2)
```


image brief:

```
Lars sitting on his bedroom floor surrounded by scraps of paper, scratching his head.
```



### explorer-m1/lessons.json versus Explorer M1

This is the file Explorer actually plays. Scenario beats are matched to master scenario beats in play order inside each lesson. A master follow line that lessons.json stores as `FOLLOW:` is stripped before the text compare.

#### explorer L1 S5 — text (OLD-ONLY)

Old:

```
The next day, Lars gets his $5 pocket money. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```

Master:

```
The next day, Lars gets his $5 allowance. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### explorer beat explorer-m1-intro-beat1 — text (OLD-ONLY)

Master cell includes the follow line. That line was removed before this compare because lessons.json stores it as FOLLOW.

Old:

```
Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he goes from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.
```

Master:

```
Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he moves from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.
```


#### explorer beat explorer-m1-intro-beat1 — image brief (OLD-ONLY)

Old:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna in the background, coins and a bill slipping through his fingers.
```

Master:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna (Senna younger) in the background, coins and a bill slipping through his fingers.
```


#### explorer beat explorer-m1-intro-beat1 — audio (OLD-ONLY)

Old:

```
explorer-m1-intro-beat1-6a9361ab.mp3
```

Master:

```
explorer-m1-intro-beat1-3cb1a9a8.mp3
```


#### explorer beat explorer-m1-l1-beat1 — image brief (OLD-ONLY)

Old:

```
Lars sitting on the edge of a bed, watching his big brother Senna count dog-walking money into a jar at home.
```

Master:

```
Lars sitting on the edge of a bed, watching his big brother Senna (Senna younger) count dog-walking money into a jar at home.
```



#### explorer L2 S4 — settings (OLD-ONLY)

Old:

```
CHOICE A: 🎒 A new schoolbag
CHOICE B: 🥤 Fancy smoothie
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```

Master:

```
CHOICE A: 🎒 A new backpack
CHOICE B: 🥤 Fancy smoothie
CHOICE C: 🔌 Phone charging cable
CORRECT: A+C
```


#### explorer beat explorer-m1-l2-beat3 — image brief (OLD-ONLY)

Old:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking keen.
```

Master:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking eager.
```


#### explorer beat explorer-m1-l2-beat1 — text (OLD-ONLY)

Old:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike.

His parents say they'll help, but Lars has to pay for part of it himself. Pocket money won't get him there, so Lars makes a plan.
```

Master:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike.

His parents say they'll help, but Lars has to pay for part of it himself. His allowance won't get him there, so Lars makes a plan.
```


#### explorer beat explorer-m1-l2-beat1 — audio (OLD-ONLY)

Old:

```
explorer-m1-l2-beat1-7a5ee3c6.mp3
```

Master:

```
explorer-m1-l2-beat1-cff52583.mp3
```


#### explorer beat explorer-m1-l2-beat2 — text (OLD-ONLY)

Old:

```
Lars wants to run a lemonade stand. First he needs a jug, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it.

Mom agrees, as long as the stand goes by their front gate, where she can see him.
```

Master:

```
Lars wants to run a lemonade stand. First he needs a pitcher, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it.

Mom agrees, as long as the stand goes by their front gate, where she can see him.
```


#### explorer beat explorer-m1-l2-beat2 — image brief (OLD-ONLY)

Old:

```
Lars writing his startup list (jug, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```

Master:

```
Lars writing his startup list (pitcher, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```


#### explorer beat explorer-m1-l2-beat2 — audio (OLD-ONLY)

Old:

```
explorer-m1-l2-beat2-f61aa9bb.mp3
```

Master:

```
explorer-m1-l2-beat2-923533ed.mp3
```



#### explorer lesson 3 — main character (master wins)

Old:

```
Mia
```

Master:

```
Lars
```


#### explorer L3 S4 — settings (OLD-ONLY)

Old:

```
ITEMS: 💵 First, Lars gets his pocket money.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: pocket, jar, fun
```

Master:

```
ITEMS: 💵 First, Lars gets his allowance.
ITEMS: 🫙 Next, some goes in his Emergencies jar.
ITEMS: 🎮 Last, he spends what's left on fun.
ORDER: allowance, jar, fun
```



#### explorer beat explorer-m1-l4-beat3 — text (OLD-ONLY)

Old:

```
After school, Lars walks home past the shops. Every window seems to be shouting at him.
```

Master:

```
After school, Lars walks home past the stores. Every window seems to be shouting at him.
```


#### explorer beat explorer-m1-l4-beat3 — image brief (OLD-ONLY)

Old:

```
Lars walking past a row of shop windows full of bright sale signs.
```

Master:

```
Lars walking past a row of store windows full of bright sale signs.
```


#### explorer beat explorer-m1-l4-beat3 — audio (OLD-ONLY)

Old:

```
explorer-m1-l4-beat3-e61399db.mp3
```

Master:

```
explorer-m1-l4-beat3-32c15d3e.mp3
```


#### explorer beat explorer-m1-l4-beat2 — text (OLD-ONLY)

Old:

```
He tucks the envelope away. $10 saved, $5 to go.

He pictures his stand by the front gate, with a bright sign and a jug of lemonade.
```

Master:

```
He tucks the envelope away. $10 saved, $5 to go.

He pictures his stand by the front gate, with a bright sign and a pitcher of lemonade.
```


#### explorer beat explorer-m1-l4-beat2 — audio (OLD-ONLY)

Old:

```
explorer-m1-l4-beat2-ed7459dc.mp3
```

Master:

```
explorer-m1-l4-beat2-e3a30f92.mp3
```




#### explorer lesson 6 — title (OLD-ONLY)

Old:

```
Stay Above Zero
```

Master:

```
The movie night
```


#### explorer L6 S1 — text (OLD-ONLY)

Old:

```
Mia asks Lars to the movies. The ticket and popcorn cost $10, and Mom will pay half. Lars has saved $8 of pocket money. Can he pay his half?
```

Master:

```
Mia asks Lars to the movies. The ticket and popcorn cost $10, and Mom will pay half. Lars has saved $8 from his allowance. Can he pay his half?
```


#### explorer beat explorer-m1-l5-beat3 — text (OLD-ONLY)

Old:

```
A week later, the movie everyone's talking about hits the cinema.

Mia has an idea.
```

Master:

```
A week later, the movie everyone's talking about hits theaters.

Mia has an idea.
```


#### explorer beat explorer-m1-l5-beat3 — audio (OLD-ONLY)

Old:

```
explorer-m1-l5-beat3-63e30b80.mp3
```

Master:

```
explorer-m1-l5-beat3-dfde6164.mp3
```


#### explorer beat explorer-m1-l6-beat4 — text (OLD-ONLY)

Old:

```
Friday night, Mom and Lars meet Mia at the cinema. The smell of popcorn hits them at the door.
```

Master:

```
Friday night, Mom and Lars meet Mia at the movie theater. The smell of popcorn hits them at the door.
```


#### explorer beat explorer-m1-l6-beat4 — image brief (OLD-ONLY)

Old:

```
Lars, Mom and Mia arriving at a cinema entrance at night, a popcorn stand inside.
```

Master:

```
Lars, Mom and Mia arriving at a movie theater entrance at night, a popcorn stand inside.
```


#### explorer beat explorer-m1-l6-beat4 — audio (OLD-ONLY)

Old:

```
explorer-m1-l6-beat4-89cafab4.mp3
```

Master:

```
explorer-m1-l6-beat4-52418502.mp3
```



#### explorer lesson 7 — title (OLD-ONLY)

Old:

```
Levelling up
```

Master:

```
Leveling up
```


#### explorer L7 S4 — text (OLD-ONLY)

Old:

```
Lars has $8: his $3 spare plus this week's $5 pocket money. He pays his $6 share first. A slushie is $2. What should Lars do?
```

Master:

```
Lars has $8: his $3 spare plus this week's $5 allowance. He pays his $6 share first. A slushie is $2. What should Lars do?
```



#### explorer beat explorer-m1-l7-beat3 — text (OLD-ONLY)

Old:

```
Lars has two weeks of pocket money, $10, at the mall. And what he does with the money he brought, is up to you!
Let's see the choices Lars has to make today.
```

Master:

```
Lars has two weeks of allowance, $10, at the mall. And what he does with the money he brought, is up to you!
Let's see the choices Lars has to make today.
```


#### explorer beat explorer-m1-l7-beat3 — audio (OLD-ONLY)

Old:

```
explorer-m1-l7-beat3-33ba5d20.mp3
```

Master:

```
explorer-m1-l7-beat3-9806274c.mp3
```



#### explorer L9 S1 — settings (OLD-ONLY)

Old:

```
HUB
BUTTON: 🧠 Catch Impulse Spending → GO Screen 2
BUTTON: ✅ Choose Needs Over Wants → GO Screen 4
BUTTON: 💰 Don't Spend Money You Don't Have → GO Screen 6
BUTTON: Finish → GO Screen explorer-m1-l9-beat1 WHEN complete
```

Master:

```
HUB
BUTTON: 🧠 Catch Impulse Spending → GO Screen 2
BUTTON: ✅ Choose Needs Over Wants → GO Screen 4
BUTTON: 💰 Don't Spend Money You Don't Have → GO Screen 6
BUTTON: Finish → GO Screen 8 WHEN complete
```


#### explorer beat explorer-m1-l9-beat1 — text (OLD-ONLY)

Old:

```
With $15 in his envelope, Lars buys a jug, cups, lemons and sugar. Mia's sign goes on the front.
On Saturday, his stand opens by the front gate.
He's one step closer to his mountain bike!
```

Master:

```
With $15 in his envelope, Lars buys a pitcher, cups, lemons and sugar. Mia's sign goes on the front.
On Saturday, his stand opens by the front gate.
He's one step closer to his mountain bike!
```


#### explorer beat explorer-m1-l9-beat1 — audio (OLD-ONLY)

Old:

```
explorer-m1-l9-beat1-0f124ac0.mp3
```

Master:

```
explorer-m1-l9-beat1-96835870.mp3
```




### intro.json versus the first Explorer scenario beat

#### explorer intro — text+follow (OLD-ONLY)

Old:

```
Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he goes from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.
Are you ready? Let's go!
```

Master:

```
Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he moves from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.
Are you ready? Let's go!
```


#### explorer intro — image brief (OLD-ONLY)

Old:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna in the background, coins and a bill slipping through his fingers.
```

Master:

```
Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna (Senna younger) in the background, coins and a bill slipping through his fingers.
```


intro.json does not store an audio filename. The manifest does. See the audio section.


### narration.csv versus Explorer scenario beats after the intro

Narration rows: 25. Master beats after the intro: 25.

#### narration explorer-m1-l1-beat1 — narration (master wins)

Old:

```
Lars spent all his birthday money. At home, he watches his big brother Senna count his bills and coins. Senna earned it walking dogs in the neighborhood. "It's a great way to make some money," Senna says.
```

Master:

```
Lars spent all his birthday money. At home, he watches his big brother Senna count his bills and coins.

Senna earned it walking dogs in the neighborhood. "It's a great way to make some money," Senna says.
```


#### narration explorer-m1-l1-beat1 — image brief (OLD-ONLY)

Old:

```
Lars sitting on the edge of a bed, watching his big brother Senna count dog-walking money into a jar at home.
```

Master:

```
Lars sitting on the edge of a bed, watching his big brother Senna (Senna younger) count dog-walking money into a jar at home.
```


#### narration explorer-m1-l1-beat2 — narration (master wins)

Old:

```
Lars kept his $5 safe today. That night, he thinks about Senna's dog walking. He decides to start his own business: a lemonade stand!
```

Master:

```
Lars kept his $5 safe today. That night, he thinks about Senna's dog walking.

He decides to start his own business: a lemonade stand!
```


#### narration explorer-m1-l1-beat3 — narration (master wins)

Old:

```
Senna's birthday is on Saturday, and Lars has a plan. He's going to get Senna the cool phone case from the store window. There's just one problem...
```

Master:

```
Senna's birthday is on Saturday, and Lars has a plan.

He's going to get Senna the cool phone case from the store window. There's just one problem...
```


#### narration explorer-m1-l2-beat3 — narration (master wins)

Old:

```
Lars asks Mom if he can earn some extra money before Saturday. Mom hands him a chore list. "Get these done by Friday, and they're worth $10."
```

Master:

```
Lars asks Mom if he can earn some extra money before Saturday.

Mom hands him a chore list. "Get these done by Friday, and they're worth $10."
```


#### narration explorer-m1-l2-beat3 — image brief (OLD-ONLY)

Old:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking keen.
```

Master:

```
Lars and Mom in the kitchen, Mom handing Lars a chore list, Lars looking eager.
```


#### narration explorer-m1-l2-beat1 — narration (OLD-ONLY)

Old:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike. His parents say they'll help, but Lars has to pay for part of it himself. Pocket money won't get him there, so Lars makes a plan.
```

Master:

```
Senna loves his new phone case. That night, Lars tells Mom his big dream: swapping his old bike for a better mountain bike.

His parents say they'll help, but Lars has to pay for part of it himself. His allowance won't get him there, so Lars makes a plan.
```


#### narration explorer-m1-l2-beat2 — narration (OLD-ONLY)

Old:

```
Lars wants to run a lemonade stand. First he needs a jug, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it. Mom agrees, as long as the stand goes by their front gate, where she can see him.
```

Master:

```
Lars wants to run a lemonade stand. First he needs a pitcher, paper cups, lemons, sugar and ingredients to bake cookies. That all costs money, so he decides to save for it.

Mom agrees, as long as the stand goes by their front gate, where she can see him.
```


#### narration explorer-m1-l2-beat2 — image brief (OLD-ONLY)

Old:

```
Lars writing his startup list (jug, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```

Master:

```
Lars writing his startup list (pitcher, cups, lemons, sugar) while Mom reads over his shoulder, smiling.
```


#### narration explorer-m1-l2-beat4 — narration (master wins)

Old:

```
Saving for the lemonade stand idea sounds easy, but he keeps spending his money at the corner store. The weeks fly by. Then one afternoon, Lars borrows Senna's headphones...
```

Master:

```
Saving for the lemonade stand idea sounds easy, but he keeps spending his money at the corner store. The weeks fly by.

Then one afternoon, Lars borrows Senna's headphones...
```


#### narration explorer-m1-l3-beat1 — narration (master wins)

Old:

```
Lars finds an old jam jar and writes 'Emergencies' on the lid to save for when things go wrong. It's only a jar, but it's a start. Every time he gets money, some goes in. Next time something breaks, he'll be ready.
```

Master:

```
Lars finds an old jam jar and writes 'Emergencies' on the lid to save for when things go wrong. It's only a jar, but it's a start.

Every time he gets money, some goes in. Next time something breaks, he'll be ready.
```


#### narration explorer-m1-l3-beat2 — narration (master wins)

Old:

```
The headphones are replaced, but Lars's startup money is still $0. "Before you buy something, ask if you really want or need it," says his school friend Mason. "That's how I've saved so much."
```

Master:

```
The headphones are replaced, but Lars's startup money is still $0.

"Before you buy something, ask if you really want or need it," says his school friend Mason. "That's how I've saved so much."
```


#### narration explorer-m1-l3-beat3 — narration (master wins)

Old:

```
One afternoon, Lars's friends all ping him. A new skin has dropped on their favorite game. A limited time offer and the countdown is ticking. Lars remembers Mason's words. His startup money is still $0.
```

Master:

```
One afternoon, Lars's friends all ping him. A new skin has dropped on their favorite game. A limited time offer and the countdown is ticking.

Lars remembers Mason's words. His startup money is still $0.
```


#### narration explorer-m1-l4-beat3 — narration (OLD-ONLY)

Old:

```
After school, Lars walks home past the shops. Every window seems to be shouting at him.
```

Master:

```
After school, Lars walks home past the stores. Every window seems to be shouting at him.
```


#### narration explorer-m1-l4-beat3 — image brief (OLD-ONLY)

Old:

```
Lars walking past a row of shop windows full of bright sale signs.
```

Master:

```
Lars walking past a row of store windows full of bright sale signs.
```


#### narration explorer-m1-l4-beat2 — narration (OLD-ONLY)

Old:

```
He tucks the envelope away. $10 saved, $5 to go. He pictures his stand by the front gate, with a bright sign and a jug of lemonade.
```

Master:

```
He tucks the envelope away. $10 saved, $5 to go.

He pictures his stand by the front gate, with a bright sign and a pitcher of lemonade.
```


#### narration explorer-m1-l4-beat4 — narration (master wins)

Old:

```
It's Mia's birthday! She's invited Lars to the gelato shop after school to celebrate.
```

Master:

```
It's Mia's birthday!

She's invited Lars to the gelato shop after school to celebrate.
```


#### narration explorer-m1-l5-beat2 — narration (master wins)

Old:

```
At the shop, the counter is a rainbow of flavors. Mia picks hers straight away. Lars looks at the cups and his tummy rumbles.
```

Master:

```
At the shop, the counter is a rainbow of flavors. Mia picks hers straight away.

Lars looks at the cups and his tummy rumbles.
```


#### narration explorer-m1-l5-beat1 — narration (master wins)

Old:

```
Lars and Mia share the birthday gelato. She's happy Lars came along, and Lars is grateful for Mia's generosity. He decides to repay the favor to Mia when he can. His startup envelope still holds $10.
```

Master:

```
Lars and Mia share the birthday gelato. She's happy Lars came along, and Lars is grateful for Mia's generosity. He decides to repay the favor to Mia when he can.

His startup envelope still holds $10.
```


#### narration explorer-m1-l5-beat3 — narration (OLD-ONLY)

Old:

```
A week later, the movie everyone's talking about hits the cinema. Mia has an idea.
```

Master:

```
A week later, the movie everyone's talking about hits theaters.

Mia has an idea.
```


#### narration explorer-m1-l6-beat4 — narration (OLD-ONLY)

Old:

```
Friday night, Mom and Lars meet Mia at the cinema. The smell of popcorn hits them at the door.
```

Master:

```
Friday night, Mom and Lars meet Mia at the movie theater. The smell of popcorn hits them at the door.
```


#### narration explorer-m1-l6-beat4 — image brief (OLD-ONLY)

Old:

```
Lars, Mom and Mia arriving at a cinema entrance at night, a popcorn stand inside.
```

Master:

```
Lars, Mom and Mia arriving at a movie theater entrance at night, a popcorn stand inside.
```


#### narration explorer-m1-l6-beat1 — narration (master wins)

Old:

```
Lars paid his own half. No borrowing, no stress. His startup money stayed at $10, and he still has $3 spare.
```

Master:

```
Lars paid his own half. No borrowing, no stress.

His startup money stayed at $10, and he still has $3 spare.
```


#### narration explorer-m1-l6-beat2 — narration (master wins)

Old:

```
While they wait, Mia doodles a lemon on her ticket. "I could design the sign for your stand," she says.
```

Master:

```
While they wait, Mia doodles a lemon on her ticket.

"I could design the sign for your stand," she says.
```


#### narration explorer-m1-l6-beat3 — narration (master wins)

Old:

```
At the bus stop, Lars shares some big news with Mason. Mom told the neighbors about his lemonade stand idea, and lots of them want to buy some!
```

Master:

```
At the bus stop, Lars shares some big news with Mason.

Mom told the neighbors about his lemonade stand idea, and lots of them want to buy some!
```


#### narration explorer-m1-l7-beat1 — narration (master wins)

Old:

```
Two straws, one slushie, and $1 still in Lars's pocket. "Deals like that used to get me every time," Lars laughs.
```

Master:

```
Two straws, one slushie, and $1 still in Lars's pocket.

"Deals like that used to get me every time," Lars laughs.
```


#### narration explorer-m1-l7-beat2 — narration (master wins)

Old:

```
Saturday morning. Lars and his friends are going to the mall. Lars looks at the note and picture above his desk: 'Mountain bike'. He decides to leave the money for his startup at home.
```

Master:

```
Saturday morning. Lars and his friends are going to the mall. Lars looks at the note and picture above his desk: 'Mountain bike'.
He decides to leave the money for his startup at home.
```


#### narration explorer-m1-l7-beat3 — narration (OLD-ONLY)

Old:

```
Lars has two weeks of pocket money, $10, at the mall. And what he does with the money he brought, is up to you! Let's see the choices Lars has to make today.
```

Master:

```
Lars has two weeks of allowance, $10, at the mall. And what he does with the money he brought, is up to you!
Let's see the choices Lars has to make today.
```


#### narration explorer-m1-l9-beat1 — narration (OLD-ONLY)

Old:

```
With $15 in his envelope, Lars buys a jug, cups, lemons and sugar. Mia's sign goes on the front. On Saturday, his stand opens by the front gate. He's one step closer to his mountain bike!
```

Master:

```
With $15 in his envelope, Lars buys a pitcher, cups, lemons and sugar. Mia's sign goes on the front.
On Saturday, his stand opens by the front gate.
He's one step closer to his mountain bike!
```



### Lesson-Details.csv versus Lesson Details

#### maverick lesson 1 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### maverick lesson 2 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### explorer lesson 3 — main character (master wins)

Old:

```
Mia
```

Master:

```
Lars
```


#### maverick lesson 3 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### maverick lesson 3 — support character (master wins)

Old:

```
Senna
```

Master:

```
(blank)
```


#### explorer lesson 4 — support character (master wins)

Old:

```
Senna
```

Master:

```
(blank)
```


#### maverick lesson 4 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### maverick lesson 4 — support character (master wins)

Old:

```
Senna
```

Master:

```
(blank)
```


#### maverick lesson 5 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### explorer lesson 6 — title (OLD-ONLY)

Old:

```
Stay Above Zero
```

Master:

```
The movie night
```


#### pathfinder lesson 6 — title (OLD-ONLY)

Old:

```
Stay Above Zero
```

Master:

```
The movie night
```


#### maverick lesson 6 — title (OLD-ONLY)

Old:

```
Stay Above Zero
```

Master:

```
The movie night
```


#### maverick lesson 6 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### explorer lesson 7 — title (OLD-ONLY)

Old:

```
Levelling up
```

Master:

```
Leveling up
```


#### pathfinder lesson 7 — title (OLD-ONLY)

Old:

```
Levelling up
```

Master:

```
Leveling up
```


#### maverick lesson 7 — title (OLD-ONLY)

Old:

```
Levelling up
```

Master:

```
Leveling up
```


#### maverick lesson 7 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### maverick lesson 8 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


#### maverick lesson 9 — main character (master wins)

Old:

```
Aiden
```

Master:

```
Senna
```


The master Lesson Details sheet adds a per-cohort `Characters` cast list and one row per cohort. The live CSV stores one shared title and three character columns on the same lesson.


### Audio filenames

Shipped mp3 files: 26, all under `public/academy-audio/explorer-m1/`.

Checked-in manifest rows: 26.

Manifest files missing from disk: none.

Disk files missing from the manifest: none.

- Master explorer audio cells: 26. On disk: 17. Missing: 9.

- Explorer master audio names that are not in the live manifest: 9.

  - `explorer-m1-intro-beat1-3cb1a9a8.mp3`

  - `explorer-m1-l2-beat1-cff52583.mp3`

  - `explorer-m1-l2-beat2-923533ed.mp3`

  - `explorer-m1-l4-beat2-e3a30f92.mp3`

  - `explorer-m1-l4-beat3-32c15d3e.mp3`

  - `explorer-m1-l5-beat3-dfde6164.mp3`

  - `explorer-m1-l6-beat4-52418502.mp3`

  - `explorer-m1-l7-beat3-9806274c.mp3`

  - `explorer-m1-l9-beat1-96835870.mp3`

- Live manifest names that are not in the master: 9.

  - `explorer-m1-intro-beat1-6a9361ab.mp3`

  - `explorer-m1-l2-beat1-7a5ee3c6.mp3`

  - `explorer-m1-l2-beat2-f61aa9bb.mp3`

  - `explorer-m1-l4-beat2-ed7459dc.mp3`

  - `explorer-m1-l4-beat3-e61399db.mp3`

  - `explorer-m1-l5-beat3-63e30b80.mp3`

  - `explorer-m1-l6-beat4-89cafab4.mp3`

  - `explorer-m1-l7-beat3-33ba5d20.mp3`

  - `explorer-m1-l9-beat1-0f124ac0.mp3`

- Master pathfinder audio cells: 26. On disk: 0. Missing: 26.

  - First missing names: `pathfinder-m1-intro-beat1-8c287c65.mp3`, `pathfinder-m1-l1-beat1-6dac43c0.mp3`, `pathfinder-m1-l1-beat2-4ab2d1c5.mp3`, `pathfinder-m1-l1-beat3-b2a4f32d.mp3`, `pathfinder-m1-l2-beat1-18da10b3.mp3`, `pathfinder-m1-l2-beat2-a0dfe048.mp3`, `pathfinder-m1-l2-beat3-750776ea.mp3`, `pathfinder-m1-l2-beat4-58918a04.mp3` ...

- Master maverick audio cells: 26. On disk: 0. Missing: 26.

  - First missing names: `maverick-m1-intro-beat1-7b02bf77.mp3`, `maverick-m1-l1-beat1-a318cf86.mp3`, `maverick-m1-l1-beat2-ff0cc2b0.mp3`, `maverick-m1-l1-beat3-f3e0e7b7.mp3`, `maverick-m1-l2-beat1-ee6ac5b3.mp3`, `maverick-m1-l2-beat2-1a2c4c12.mp3`, `maverick-m1-l2-beat3-07af9912.mp3`, `maverick-m1-l2-beat4-e44a6ee7.mp3` ...


### Authoring templates and baked lesson files — strings absent from the master

These files are not row-aligned with the master. Every substantial string (and every image or audio filename) that does not occur in the master is listed. Strings that do occur are omitted.


#### lib/academy/lessons/content/m1-l1.ts

#### m1-l1.ts (string)

```
Control Your Spending
```


#### m1-l1.ts (string)

```
Control Your Spending · Lesson 1 · Money In, Money Out
```


#### m1-l1.ts (string)

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be
```


#### m1-l1.ts (string)

```
Not quite! Holly's friends are showing off - what's her brain pushing her to do with that $25?
```


#### m1-l1.ts (string)

```
Pick the word that fits
```


#### m1-l1.ts (string)

```
Holly gets her eyelashes done right away with the $25 but ten minutes later...
```


#### m1-l1.ts (string)

```
...the initial excitement fades and her $25 is gone.
```


#### m1-l1.ts (string)

```
...her $25 magically reappears in her wallet.
```


#### m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### m1-l1.ts (string)

```
Holly's $25 is gone and she only had a few minutes of excitement. Tap each item to see whether it's short fun or longer fun!
```


#### m1-l1.ts (string)

```
Glow-in-the-dark slime kit
```


#### m1-l1.ts (string)

```
Your turn! Drag each item into the correct bucket.
```


#### m1-l1.ts (string)

```
Cheap glow sticks / LED toys
```


#### m1-l1.ts (string)

```
Wireless speaker for hangouts
```


#### m1-l1.ts (string)

```
Journal + good pen set
```


#### m1-l1.ts (string)

```
Limited time - new skin 70% off! 15 MINUTES LEFT!
```


#### m1-l1.ts (string)

```
To stop her from pausing to decide if she really needs it.
```


#### m1-l1.ts (string)

```
Because they want to make sure she gets a good deal.
```


#### m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Holly so she won't stop to think if she really wants to spend her money on it. Try again!
```


#### m1-l1.ts (string)

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, by silencing the chat alerts.
```


#### m1-l1.ts (string)

```
Thank you! Holly's had time to think.
```


#### m1-l1.ts (string)

```
Holly chooses to keep her money instead of giving in to the rush. She stays in control of spending.
```


#### m1-l1.ts (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be
```


#### m1-l1.ts (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### m1-l1.ts (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...
```


#### m1-l1.ts (string)

```
...his $20 cash magically reappears.
```


#### m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### m1-l1.ts (string)

```
Lars's money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```


#### m1-l1.ts (string)

```
Bubble tea with all the toppings
```


#### m1-l1.ts (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### m1-l1.ts (string)

```
Because the game creators love him.
```


#### m1-l1.ts (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### m1-l1.ts (string)

```
Help Lars by giving him a 'buy freeze' so his brain has time to think.
```


#### m1-l1.ts (string)

```
Success! Lars has to wait 24 hours.
```


#### m1-l1.ts (string)

```
The freeze worked!

The next morning, Lars realized he didn't even want that skin anymore.

He kept his money safe for a new gaming headset. 🎧

Congratulations for helping him avoid wasting his money! 🎉
```


#### m1-l1.ts (string)

```
Aiden just got $40 cash from a quick delivery gig. He opens the marketplace app and sees the exact wireless earbuds he's been tracking. His brain tricks him into thinking the cash must be
```


#### m1-l1.ts (string)

```
Not quite! Aiden spotted those earbuds - what's his brain pushing him to do with that $40?
```


#### m1-l1.ts (string)

```
Aiden buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first, but a few hours later...
```


#### m1-l1.ts (string)

```
...the thrill starts to wear off and his $40 is spent.
```


#### m1-l1.ts (string)

```
...the seller gives him his money back because he bought them so quickly.
```


#### m1-l1.ts (string)

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```


#### m1-l1.ts (string)

```
Aiden's $40 is gone after buying the earbuds and he only had a short burst of satisfaction. Tap these items to see the difference between things that give short fun and things that give more fun for longer!
```


#### m1-l1.ts (string)

```
Energy drink + snack
```


#### m1-l1.ts (string)

```
Scratch-it lottery ticket
```


#### m1-l1.ts (string)

```
Multi-tool / pocket knife
```


#### m1-l1.ts (string)

```
Food delivery with priority fee
```


#### m1-l1.ts (string)

```
Disposable concert merch
```


#### m1-l1.ts (string)

```
Second-hand quality guitar
```


#### m1-l1.ts (string)

```
High-quality piece of clothing
```


#### m1-l1.ts (string)

```
Flash sale on premium bike lights - huge discount but ONLY 10 MINUTES LEFT!
```


#### m1-l1.ts (string)

```
To trick his brain into buying fast without thinking.
```


#### m1-l1.ts (string)

```
Because the company genuinely cares about Aiden's safety.
```


#### m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Aiden so he won't stop to think if he really wants to spend his money on it. Try again!
```


#### m1-l1.ts (string)

```
If Aiden had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Aiden can think if he really needs the item right now.
```


#### m1-l1.ts (string)

```
Aiden pauses and realizes: 'It's just a flash sale. I don't really need this right now and there will always be another deal.'
```


#### m1-l1.ts (string)

```
Aiden walked away from the impulsive offer and kept his money exactly where it belongs: in his pocket.
```


#### m1-l1.ts (string)

```
Tap and hold the button to give Holly time to think.
```



#### lib/academy/lessons/content/m1-l2.ts

#### m1-l2.ts (string)

```
Control Your Spending
```


#### m1-l2.ts (string)

```
Control Your Spending · Lesson 2 · Needs vs Wants Sort
```


#### m1-l2.ts (string)

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```


#### m1-l2.ts (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```


#### m1-l2.ts (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'
```


#### m1-l2.ts (string)

```
Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves!
```


#### m1-l2.ts (string)

```
Wait! If your phone cable is broken, your phone dies. That's a Need!
```


#### m1-l2.ts (string)

```
Beast Munch tastes great, but you won't get stuck without it. That's a Want!
```


#### m1-l2.ts (string)

```
A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!
```


#### m1-l2.ts (string)

```
Which item is the one Lars 'Needs' to buy before he spends money on what he 'Wants' to buy?
```


#### m1-l2.ts (string)

```
A new phone case, even though his old one is still fine
```


#### m1-l2.ts (string)

```
A new phone case he promised to buy his brother for his birthday
```


#### m1-l2.ts (string)

```
Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have!
```


#### m1-l2.ts (string)

```
A light for his bike to be seen in the dark
```


#### m1-l2.ts (string)

```
A new gaming mouse with lights (his old one still works)
```


#### m1-l2.ts (string)

```
If the old one's still working, replacing it becomes a 'want' not a 'need'.
```


#### m1-l2.ts (string)

```
Buy lunch for himself with his weekly tuckshop money
```


#### m1-l2.ts (string)

```
Buy lunch for all his friends on Monday and have nothing left over
```


#### m1-l2.ts (string)

```
Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!
```


#### m1-l2.ts (string)

```
You have $30 left. Check the boxes to buy what you actually need.
```


#### m1-l2.ts (string)

```
Uncheck the item you don't really 'need'.
```


#### m1-l2.ts (string)

```
Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!
```


#### m1-l2.ts (string)

```
Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!
```


#### m1-l2.ts (string)

```
Lars has $25 💰
He needs $20 for Senna's phone case 🎁
Slide to save at least $20 👇
```


#### m1-l2.ts (string)

```
Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!
```


#### m1-l2.ts (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### m1-l2.ts (string)

```
Don't buy anything - keep the $5.
```


#### m1-l2.ts (string)

```
Choose something cheaper for $5 to enjoy now.
```


#### m1-l2.ts (string)

```
Borrow $5 from dad to buy the $10 bottle.
```


#### m1-l2.ts (string)

```
Not quite! Borrowing money creates debt and you don't want to do that for something you 'want' but can do without. This is the option to avoid and should be at the very bottom of our list. Try again!
```


#### m1-l2.ts (string)

```
Not quite! While that is an okay choice, there's a better option to choose first in this list. Try again!
```


#### m1-l2.ts (string)

```
Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct. That's smart spending control that Lars can count on.
```


#### m1-l2.ts (string)

```
Fast forward to next week! Drag the gift to Senna to help Lars deliver his promise.
```


#### m1-l2.ts (string)

```
Senna receiving a birthday gift
```


#### m1-l2.ts (string)

```
Lars delivering Senna's birthday gift
```


#### m1-l2.ts (string)

```
Lars giving Senna a wrapped birthday present
```


#### m1-l2.ts (string)

```
By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.
```


#### m1-l2.ts (string)

```
Nope! That cash is already gone.
```


#### m1-l2.ts (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy.
```


#### m1-l2.ts (string)

```
Help Lars identify which items are 'Things he wants' or 'Things he needs'
```


#### m1-l2.ts (string)

```
You promised Senna. That's a need!
```


#### m1-l2.ts (string)

```
Broken cable, dead phone. Need it!
```


#### m1-l2.ts (string)

```
Tasty, but you can skip it. Want!
```


#### m1-l2.ts (string)

```
Cool skin, not a must-have. Want!
```


#### m1-l2.ts (string)

```
The promise is the need, not a spare case.
```


#### m1-l2.ts (string)

```
If the old one still works, that's a want!
```


#### m1-l2.ts (string)

```
Feed you first. Friends' lunch is extra.
```


#### m1-l2.ts (string)

```
Uncheck the thing you don't really need.
```


#### m1-l2.ts (string)

```
Skip the drink. Grab the cable.
```


#### m1-l2.ts (string)

```
Skip the drink. Grab the bus pass.
```


#### m1-l2.ts (string)

```
Slide until $20 is locked for the gift.
```


#### m1-l2.ts (string)

```
Borrowing for a want goes last. Try again!
```


#### m1-l2.ts (string)

```
There's a smarter first move. Try again!
```



#### lib/academy/lessons/content/m1-l3.ts

#### m1-l3.ts (string)

```
Control Your Spending
```


#### m1-l3.ts (string)

```
Keep Some Money Aside
```


#### m1-l3.ts (string)

```
Control Your Spending · Lesson 3 · Keep Some Money Aside
```


#### m1-l3.ts media (media)

```
holly-mia-sidebyside.webp
```


#### m1-l3.ts (string)

```
Mia spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Mia's sister crashes out because:
```


#### m1-l3.ts (string)

```
Mia has no money to buy a new pair
```


#### m1-l3.ts (string)

```
Mia tries to fix them with sticky tape and now they're even worse
```


#### m1-l3.ts (string)

```
the dog runs off with one of the pieces
```


#### m1-l3.ts (string)

```
Exactly! No money left = big sister drama.
```


#### m1-l3.ts (string)

```
Haha, maybe. But let's try again.
```


#### m1-l3.ts (string)

```
Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.
```


#### m1-l3.ts (string)

```
Mia has no money left to pay for new headphones.
```


#### m1-l3.ts media (media)

```
senna-hands-on-hips-512.webp
```


#### m1-l3.ts (string)

```
Senna explains that keeping Spare Cash gives you options. Match the event to what's possible if you have cash:
```


#### m1-l3.ts (string)

```
There's a sale at the toy store
```


#### m1-l3.ts (string)

```
I can buy my favourite toy for less
```


#### m1-l3.ts (string)

```
Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.
```


#### m1-l3.ts (string)

```
Build your Spare Cash
```


#### m1-l3.ts (string)

```
Pocket money, buffer jar, and fun spending steps
```


#### m1-l3.ts (string)

```
Get your pocket money.
```


#### m1-l3.ts (string)

```
Move a small amount to your 'Buffer' jar.
```


#### m1-l3.ts (string)

```
Spend what is left on fun.
```


#### m1-l3.ts (string)

```
Perfect! Spare Cash first, then fun. You're ready for anything!
```


#### m1-l3.ts (string)

```
Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Mia do?
```


#### m1-l3.ts (string)

```
Buy the toy and save $10 more next week.
```


#### m1-l3.ts (string)

```
Buy the headphones to fix what she broke first.
```


#### m1-l3.ts (string)

```
Buy the toy and hope the headphones don't cost $40.
```


#### m1-l3.ts (string)

```
Smart move. Replacing the broken headphones should come first.
```


#### m1-l3.ts (string)

```
That's a trap! Stick to the plan to avoid stress later.
```


#### m1-l3.ts (string)

```
Because I didn't [blank] everything, I had [blank] to [blank] the headphones immediately.
```


#### m1-l3.ts (string)

```
Not quite. Let's try again.
```


#### m1-l3.ts (string)

```
Exactly! Spare cash gave Mia options when she needed them.
```


#### m1-l3.ts (string)

```
Mia could fix the problem because she had spare cash. What are the other benefits of not spending all of your money? Select the best answer:
```


#### m1-l3.ts (string)

```
If I lose something, I can replace it myself.
```


#### m1-l3.ts (string)

```
I won't have to ask my parents for money if I need something.
```


#### m1-l3.ts (string)

```
I can save up for a big goal instead of wasting it on small stuff that doesn't last.
```


#### m1-l3.ts (string)

```
I worry less if I can afford things that I want or have to buy.
```


#### m1-l3.ts (string)

```
Exactly! Keeping some money means you're in charge, you don't have to beg for cash, and you can get the stuff that actually matters.
```


#### m1-l3.ts (string)

```
Yes, but take a look at the other options and see if there's a better answer.
```


#### m1-l3.ts (string)

```
Skill Learned: Don't Spend Money You Don't Have
```


#### m1-l3.ts (string)

```
Lesson complete! You've unlocked a huge secret: Having some spare cash means you're ready for whatever comes next.
```


#### m1-l3.ts media (media)

```
holly-mia-chatting.webp
```


#### m1-l3.ts (string)

```
Holly spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Holly's sister crashes out because:
```


#### m1-l3.ts (string)

```
Holly has no money to buy a new pair
```


#### m1-l3.ts (string)

```
Holly tries to fix them with sticky tape and now they're even worse
```


#### m1-l3.ts (string)

```
Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.
```


#### m1-l3.ts (string)

```
Holly has no money left to pay for new headphones.
```


#### m1-l3.ts (string)

```
Senna explains that keeping Cash for Emergencies gives you options. Match the event to what's possible if you have cash:
```


#### m1-l3.ts (string)

```
Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.
```


#### m1-l3.ts (string)

```
Move some of that money to your jar for 'Emergencies'.
```


#### m1-l3.ts (string)

```
Perfect! Cash for Emergencies first, then fun. You're ready for anything!
```


#### m1-l3.ts (string)

```
Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 toy she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Holly do?
```


#### m1-l3.ts (string)

```
Exactly! Cash for Emergencies gave Holly options when she needed them.
```


#### m1-l3.ts (string)

```
Holly could fix the problem because she had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:
```


#### m1-l3.ts (string)

```
Lesson complete! You've unlocked a huge secret: Having Cash for Emergencies means you're ready for whatever comes next.
```


#### m1-l3.ts (string)

```
Haha, maybe. Try again!
```


#### m1-l3.ts (string)

```
Move a small amount to your Emergencies jar.
```


#### m1-l3.ts (string)

```
Trap! Fix the headphones first.
```


#### m1-l3.ts (string)

```
Not quite. Try another combo!
```


#### m1-l3.ts (string)

```
Good try. One answer covers all of them.
```



#### lib/academy/lessons/content/m1-l4.ts

#### m1-l4.ts (string)

```
Control Your Spending
```


#### m1-l4.ts (string)

```
Pause Under Pressure
```


#### m1-l4.ts (string)

```
Control Your Spending · Lesson 4 · Pause Under Pressure
```


#### m1-l4.ts (string)

```
All of Senna's friends are buying a limited-time game skin, but Lars notices that Senna decides to wait with getting one.

What skill is Senna practicing?
```


#### m1-l4.ts (string)

```
Not quite! Senna is actually being smart by not rushing into a trap.
```


#### m1-l4.ts (string)

```
Nah, running out of cash isn't a skill! What Senna is choosing to do instead?
```


#### m1-l4.ts (string)

```
That's right! Senna is hitting the brakes before his brain makes a quick mistake.
```


#### m1-l4.ts (string)

```
Not quite! Take another look at what Senna is choosing to do.
```


#### m1-l4.ts (string)

```
Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed.
```


#### m1-l4.ts (string)

```
Senna sees the one-time offer.
```


#### m1-l4.ts (string)

```
Senna remembers the price could drop later.
```


#### m1-l4.ts (string)

```
Senna waits a day and checks again.
```


#### m1-l4.ts (string)

```
Senna is happy he waited - he can buy the same item for even less.
```


#### m1-l4.ts (string)

```
Perfect! Senna didn't rush. He checked the price, and he stayed in control of his spending.
```


#### m1-l4.ts (string)

```
Which one helps Lars stop and think?
```


#### m1-l4.ts (string)

```
It's a limited time offer - I have to buy it now!
```


#### m1-l4.ts (string)

```
I can wait and get it cheaper later.
```


#### m1-l4.ts (string)

```
That thought is rushing you. Pick the one that helps you stop.
```


#### m1-l4.ts (string)

```
It looks cool, I need it right now!
```


#### m1-l4.ts (string)

```
Everyone has it, I don't want to be left out.
```


#### m1-l4.ts (string)

```
I'll ask my friends if it's actually any good.
```


#### m1-l4.ts (string)

```
Sale sign for a fishing rod
```


#### m1-l4.ts (string)

```
Mia and Lars are walking home from school. They walk past a big, flashy sign for a fishing rod. It's making Lars want to rush to the shop and buy it immediately.
```


#### m1-l4.ts (string)

```
Select which parts of the sign are making Lars rush.
```


#### m1-l4.ts (string)

```
That's right. These are all tricks so you spend your money, without stopping to think.
```


#### m1-l4.ts (string)

```
Not quite - that's just info on the sign, not a pressure trick.
```


#### m1-l4.ts (string)

```
Lars gets a limited-time offer for extra lives in his game. He remembers Senna's advice and stops. What should he ask himself?
```


#### m1-l4.ts (string)

```
Not quite! That button is trying to do the thinking for you. Don't let it!
```


#### m1-l4.ts (string)

```
Great questions! Lars is thinking for himself - not letting the game rush him into spending.
```


#### m1-l4.ts (string)

```
Lars chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.
```


#### m1-l4.ts (string)

```
Lars's money is safe from mindless spending!
```


#### m1-l4.ts (string)

```
Lars wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.
```


#### m1-l4.ts (string)

```
Things Lars wants to buy
```


#### m1-l4.ts (string)

```
Lars doing a wheelie on his bike
```


#### m1-l4.ts (string)

```
Lars doing a wheelie on his bike at the bike event
```


#### m1-l4.ts (string)

```
Learn to Wheelie - 30 Minute Workshop: $20
```


#### m1-l4.ts (string)

```
Goal Achieved! Lars saved enough for the Wheelie Workshop.
```


#### m1-l4.ts (string)

```
Not quite! Senna isn't rushing into a trap.
```


#### m1-l4.ts (string)

```
Nah, empty pockets isn't a skill. Try again!
```


#### m1-l4.ts (string)

```
Look again at what Senna is choosing to do.
```


#### m1-l4.ts (string)

```
That button wants to think for you. Skip it!
```


#### m1-l4.ts (string)

```
Which one helps Holly stop and think?
```


#### m1-l4.ts (string)

```
Select which parts of the sign are making Holly rush.
```


#### m1-l4.ts (string)

```
Immi and Holly are walking through the shops. They walk past a big, flashy sign for a fishing rod. It's making Holly want to rush in and buy it immediately.
```


#### m1-l4.ts (string)

```
Holly gets a limited-time offer for extra lives in her game. She remembers Mia's advice and stops. What should she ask herself?
```


#### m1-l4.ts (string)

```
Holly chooses to keep her money. Swipe her money from 'Spend Now' to 'Save for Later'.
```


#### m1-l4.ts (string)

```
Holly wants to do a $20 nail-art workshop. To afford it, she said no to three things. Drag them into the box to reach her goal.
```


#### m1-l4.ts (string)

```
Which one helps Aiden stop and think?
```


#### m1-l4.ts (string)

```
Select which parts of the sign are making Aiden rush.
```


#### m1-l4.ts (string)

```
Dash and Aiden are at a local market. They walk past a big, flashy sign for a fishing rod. It's making Aiden want to rush in and buy it immediately.
```


#### m1-l4.ts (string)

```
Aiden gets a limited-time offer for extra lives in his game. He remembers Dash's advice and stops. What should he ask himself?
```


#### m1-l4.ts (string)

```
Aiden chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.
```


#### m1-l4.ts (string)

```
Aiden wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.
```


#### m1-l4.ts (string)

```
Things Aiden didn't buy
```



#### lib/academy/lessons/content/m1-l5.ts

#### m1-l5.ts (string)

```
Control Your Spending
```


#### m1-l5.ts (string)

```
The birthday discount
```


#### m1-l5.ts (string)

```
Control Your Spending · Lesson 5 · The birthday discount
```


#### m1-l5.ts (string)

```
It is Immi's birthday. The local gelato store offers a birthday discount. Immi wants Holly to come with her and get one too. Going along so she is not left out is a
```


#### m1-l5.ts (string)

```
A limited time offer does not make it a 'need'.
```


#### m1-l5.ts media (media)

```
holly-immi-sidebyside.webp
```


#### m1-l5.ts (string)

```
The birthday discount is only on today. Holly is saving for an exchange trip overseas and can't really afford the gelato. What should she do?
```


#### m1-l5.ts (string)

```
Skip buying her own gelato and ask Immi to share hers.
```


#### m1-l5.ts (string)

```
Buy her own because the deal is only on today
```


#### m1-l5.ts (string)

```
The money for the exchange trip is the 'need'. The gelato is the 'want'.
```


#### m1-l5.ts (string)

```
The gelato is a 'need' because the deal is only available today.
```


#### m1-l5.ts (string)

```
A limited time offer does not turn a 'want' into a 'need'.
```


#### m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Holly right now?
```


#### m1-l5.ts (string)

```
Holly does not want to feel left out, but the birthday deal expires today. What now?
```


#### m1-l5.ts (string)

```
Share a gelato and keep at least half of what she would otherwise have spent.
```


#### m1-l5.ts (string)

```
Buy one so she isn't the odd one out
```


#### m1-l5.ts (string)

```
Put these in the order Holly should try. Best first.
```


#### m1-l5.ts (string)

```
Ask if this is a 'want' or a 'need'
```


#### m1-l5.ts (string)

```
Share a gelato with Immi
```


#### m1-l5.ts (string)

```
Buy her own because it is only today
```


#### m1-l5.ts (string)

```
Name it a 'want' or 'need', then share, then buy.
```


#### m1-l5.ts (string)

```
Immi was happy to share the gelato without Holly having to pay for it. Holly stays on track with saving for her big trip.
```


#### m1-l5.ts (string)

```
It is Senna's birthday. The local gelato store offers a birthday discount. Senna wants Lars to come with him and get one too. Going along so he is not left out is a
```


#### m1-l5.ts (string)

```
The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?
```


#### m1-l5.ts (string)

```
The bike parts are the 'need'. The gelato is the 'want'.
```


#### m1-l5.ts (string)

```
Skip buying his own gelato and ask Senna to share his.
```


#### m1-l5.ts (string)

```
Buy his own because the deal is only on today
```


#### m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Lars right now?
```


#### m1-l5.ts (string)

```
New helmet for the race
```


#### m1-l5.ts (string)

```
Race registration fee
```


#### m1-l5.ts (string)

```
Lars does not want to feel left out, but the birthday deal expires today. What now?
```


#### m1-l5.ts (string)

```
Share a gelato and keep at least half of what he would otherwise have spent.
```


#### m1-l5.ts (string)

```
Buy one so he isn't the odd one out
```


#### m1-l5.ts (string)

```
Put these in the order Lars should try. Best first.
```


#### m1-l5.ts (string)

```
Share a gelato with Senna
```


#### m1-l5.ts (string)

```
Buy his own because it is only today
```


#### m1-l5.ts (string)

```
Senna was happy to share the gelato without Lars having to pay for it. Lars can buy what he needs for his race.
```


#### m1-l5.ts (string)

```
It is Immi's birthday. The local gelato store offers a birthday discount. She wants Aiden to come with her and get one too. Going along so he is not left out is a
```


#### m1-l5.ts media (media)

```
aiden-waving-512.webp
```


#### m1-l5.ts (string)

```
The birthday discount is only on today. Aiden is saving for a gap year and doesn't really want to spend the money on gelato. What should he do?
```


#### m1-l5.ts (string)

```
The money for the gap year is the 'need'. The gelato is the 'want'.
```


#### m1-l5.ts (string)

```
Skip buying his own gelato and ask Immi to share hers.
```


#### m1-l5.ts media (media)

```
aiden-deciding-512.webp
```


#### m1-l5.ts media (media)

```
aiden-thinking-512.webp
```


#### m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Aiden right now?
```


#### m1-l5.ts (string)

```
Aiden does not want to feel left out, but the birthday deal expires today. What now?
```


#### m1-l5.ts media (media)

```
aiden-hands-on-hips-512.webp
```


#### m1-l5.ts (string)

```
Put these in the order Aiden should try. Best first.
```


#### m1-l5.ts (string)

```
Immi was happy to share the gelato without Aiden having to pay for it. Aiden stays on track with saving for his big trip.
```


#### m1-l5.ts media (media)

```
aiden-celebrating-512.webp
```



#### lib/academy/lessons/content/_template.ts

#### _template.ts (string)

```
Control Your Spending
```


#### _template.ts (string)

```
REPLACE: Lesson Title From Design Doc
```


#### _template.ts (string)

```
Control Your Spending · Lesson 3 · REPLACE: Lesson Title
```


#### _template.ts (string)

```
REPLACE: text before the blank
```


#### _template.ts (string)

```
REPLACE: error message from Excel
```


#### _template.ts (string)

```
REPLACE: setup sentence ending with ...
```


#### _template.ts (string)

```
REPLACE: correct ending
```


#### _template.ts (string)

```
REPLACE: wrong ending
```


#### _template.ts (string)

```
REPLACE: error message
```


#### _template.ts (string)

```
REPLACE: tap intro from Excel
```


#### _template.ts (string)

```
Your turn! Sort these items into the correct bucket.
```


#### _template.ts (string)

```
REPLACE: countdown trap question
```


#### _template.ts (string)

```
REPLACE: true reason
```


#### _template.ts (string)

```
REPLACE: false reason
```


#### _template.ts (string)

```
REPLACE: trap error message
```


#### _template.ts (string)

```
REPLACE: hold screen narrative
```


#### _template.ts (string)

```
REPLACE: success quote after hold completes
```


#### _template.ts (string)

```
REPLACE: celebration narrative
```


#### _template.ts (string)

```
REPLACE: Lars hook text before blank
```


#### _template.ts (string)

```
REPLACE: Lars hook error
```


#### _template.ts (string)

```
REPLACE: Lars screen 2 prompt
```


#### _template.ts (string)

```
REPLACE: Lars screen 3 intro
```


#### _template.ts (string)

```
Bubble tea with all the toppings
```


#### _template.ts (string)

```
REPLACE: Lars trap prompt
```


#### _template.ts (string)

```
REPLACE: Lars hold narrative
```


#### _template.ts (string)

```
REPLACE: Lars success message
```


#### _template.ts (string)

```
REPLACE: Lars resolution (no bonus tap)
```


#### _template.ts (string)

```
REPLACE: Aiden hook text before blank
```


#### _template.ts (string)

```
REPLACE: Aiden hook error
```


#### _template.ts (string)

```
REPLACE: Aiden screen 2 prompt
```


#### _template.ts (string)

```
REPLACE: Aiden screen 3 intro
```


#### _template.ts (string)

```
Energy drink + snack
```


#### _template.ts (string)

```
Scratch-it lottery ticket
```


#### _template.ts (string)

```
Multi-tool / pocket knife
```


#### _template.ts (string)

```
Food delivery with priority fee
```


#### _template.ts (string)

```
Disposable concert merch
```


#### _template.ts (string)

```
Second-hand quality guitar
```


#### _template.ts (string)

```
High-quality piece of clothing
```


#### _template.ts (string)

```
REPLACE: Aiden trap prompt
```


#### _template.ts (string)

```
REPLACE: Aiden hold narrative
```


#### _template.ts (string)

```
REPLACE: Aiden success quote
```


#### _template.ts (string)

```
REPLACE: Aiden celebration copy
```



#### lib/academy/lessons/content/data/explorer/index.ts

No old-only strings.


#### lib/academy/lessons/content/data/explorer/m1-l1.json

#### m1-l1.json (string)

```
Module 1 · Lesson 1 · Money In, Money Out
```


#### m1-l1.json (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l1.json (string)

```
I understand the basics of recognising spending triggers
```


#### m1-l1.json (string)

```
Impulsive spending happens quickly, but can be stopped by pausing before acting
```


#### m1-l1.json (string)

```
From spending immediately when something feels exciting
 → To pausing before spending to decide if it is worth it
```


#### m1-l1.json (string)

```
I always pause before buying something I want
```


#### m1-l1.json (string)

```
Introduce Recognise Spending Triggers
```


#### m1-l1.json (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be
```


#### m1-l1.json (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### m1-l1.json (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l1.json (string)

```
The Fill-the-Blank Drop
```


#### m1-l1.json (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be [ ______ ] right away!
```


#### m1-l1.json (string)

```
Drag-and-Drop: User drags the correct capsule into the blank space to start the story.
```


#### m1-l1.json (string)

```
Correct: [Spent]


Pool: [Spent], [Saved], [Hidden]
```


#### m1-l1.json (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He’s super happy, but ten minutes later...
```


#### m1-l1.json (string)

```
...his $20 cash magically reappears.
```


#### m1-l1.json (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### m1-l1.json (string)

```
Concept Introduction (Mechanism)
```


#### m1-l1.json (string)

```
The Sentence Finisher
```


#### m1-l1.json (string)

```
Simple Tap: User taps the true ending block to finish the thought.
```


#### m1-l1.json (string)

```
🟢 [...the candy is gone and the toy feels boring.]


🔴 [...his $20 cash magically reappears.]
```


#### m1-l1.json (string)

```
Lars’s money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```


#### m1-l1.json (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l1.json (string)

```
Tap-to-Reveal: User taps items to watch them flash and sort into distinct piles.
```


#### m1-l1.json (string)

```
🍬 Sour Worms ──> Flashes red to Short Fun.

🍿 Cinema Popcorn ──> Flashes red to Short Fun.

🎧 Wireless Headphones ──> Flashes green to More Fun for Longer.

🛹 Skateboard ──> Flashes green to More Fun for Longer.
```


#### m1-l1.json (string)

```
(Exploratory mode — no error message needed)
```


#### m1-l1.json (string)

```
Your turn! Sort these items into the correct bucket.
```


#### m1-l1.json (string)

```
tea with all the toppings
```


#### m1-l1.json (string)

```
Active Processing (Triage/Application)
```


#### m1-l1.json (string)

```
Left/Right Tap: User taps left/right buttons. Static items load one by one. Screen borders flash green/red on input.
```


#### m1-l1.json (string)

```
Short Fun (Left):

🍕 Slice of pizza
🥤Bubble tea with all the toppings


More Fun for Longer (Right):

🎮 Gaming controller
📚 Dance Emote
```


#### m1-l1.json (string)

```
Wrong input: Screen vibrates and shows a thick red border around the glass.
```


#### m1-l1.json (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### m1-l1.json (string)

```
...To trick his brain into buying fast.
```


#### m1-l1.json (string)

```
...Because the game creators love him.
```


#### m1-l1.json (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### m1-l1.json (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l1.json (string)

```
Simple Tap: User taps the true hidden reason behind the flash countdown.
```


#### m1-l1.json (string)

```
🟢 [To trick his brain into buying fast.]


🔴 [Because the game creators love him.]
```


#### m1-l1.json (string)

```
Don't tap buy! Stop the rush with a 24-Hour Buy Freeze. Give your brain time to cool down.
```


#### m1-l1.json (string)

```
Success! Lars has to wait 24 hours.
```


#### m1-l1.json (string)

```
(Must hold down fully for 2 seconds to activate)
```


#### m1-l1.json (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l1.json (string)

```
Hold-to-Activate: Child presses and holds a big blue button for 2 seconds to freeze the offer.
```


#### m1-l1.json (string)

```
Button: [❄️ HOLD TO FREEZE ❄️]


Visual: Frost animation cracks over the layout; timer sits at 24:00:00 Safe.
```


#### m1-l1.json (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin.
```


#### m1-l1.json (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l1.json (string)

```
Timeline Progression
```


#### m1-l1.json (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin.

Tap to collect bonus 50xp for successfully staying in control of spending.
```


#### m1-l1.json (string)

```
User taps gold button with  BONUS - 50XP  on it. When user taps, bonus points are instantly added to user's points count
```


#### m1-l1.json (string)

```
Giant glowing button: [Claim 50 XP BONUS]
```


#### m1-l1.json (string)

```
Neurological Closure (Variable Reward System)
```


#### m1-l1.json (string)

```
Pressing the button triggers the screen to close and game to go back to learning journey, with next lesson button now unlocked and clickable.
```


#### m1-l1.json (string)

```
Vault: Skill 1 initializes at Bronze.
```



#### lib/academy/lessons/content/data/explorer/m1-l1.ts

#### m1-l1.ts (string)

```
Module 1 · Lesson 1 · Money In, Money Out
```


#### m1-l1.ts (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l1.ts (string)

```
I understand the basics of recognising spending triggers
```


#### m1-l1.ts (string)

```
Impulsive spending happens quickly, but can be stopped by pausing before acting
```


#### m1-l1.ts (string)

```
From spending immediately when something feels exciting
 → To pausing before spending to decide if it is worth it
```


#### m1-l1.ts (string)

```
I always pause before buying something I want
```


#### m1-l1.ts (string)

```
Introduce Recognise Spending Triggers
```


#### m1-l1.ts (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be
```


#### m1-l1.ts (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### m1-l1.ts (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l1.ts (string)

```
The Fill-the-Blank Drop
```


#### m1-l1.ts (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be [ ______ ] right away!
```


#### m1-l1.ts (string)

```
Drag-and-Drop: User drags the correct capsule into the blank space to start the story.
```


#### m1-l1.ts (string)

```
Correct: [Spent]


Pool: [Spent], [Saved], [Hidden]
```


#### m1-l1.ts (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He’s super happy, but ten minutes later...
```


#### m1-l1.ts (string)

```
...his $20 cash magically reappears.
```


#### m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### m1-l1.ts (string)

```
Concept Introduction (Mechanism)
```


#### m1-l1.ts (string)

```
The Sentence Finisher
```


#### m1-l1.ts (string)

```
Simple Tap: User taps the true ending block to finish the thought.
```


#### m1-l1.ts (string)

```
🟢 [...the candy is gone and the toy feels boring.]


🔴 [...his $20 cash magically reappears.]
```


#### m1-l1.ts (string)

```
Lars’s money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```


#### m1-l1.ts (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l1.ts (string)

```
Tap-to-Reveal: User taps items to watch them flash and sort into distinct piles.
```


#### m1-l1.ts (string)

```
🍬 Sour Worms ──> Flashes red to Short Fun.

🍿 Cinema Popcorn ──> Flashes red to Short Fun.

🎧 Wireless Headphones ──> Flashes green to More Fun for Longer.

🛹 Skateboard ──> Flashes green to More Fun for Longer.
```


#### m1-l1.ts (string)

```
(Exploratory mode — no error message needed)
```


#### m1-l1.ts (string)

```
Your turn! Sort these items into the correct bucket.
```


#### m1-l1.ts (string)

```
tea with all the toppings
```


#### m1-l1.ts (string)

```
Active Processing (Triage/Application)
```


#### m1-l1.ts (string)

```
Left/Right Tap: User taps left/right buttons. Static items load one by one. Screen borders flash green/red on input.
```


#### m1-l1.ts (string)

```
Short Fun (Left):

🍕 Slice of pizza
🥤Bubble tea with all the toppings


More Fun for Longer (Right):

🎮 Gaming controller
📚 Dance Emote
```


#### m1-l1.ts (string)

```
Wrong input: Screen vibrates and shows a thick red border around the glass.
```


#### m1-l1.ts (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### m1-l1.ts (string)

```
...To trick his brain into buying fast.
```


#### m1-l1.ts (string)

```
...Because the game creators love him.
```


#### m1-l1.ts (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### m1-l1.ts (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l1.ts (string)

```
Simple Tap: User taps the true hidden reason behind the flash countdown.
```


#### m1-l1.ts (string)

```
🟢 [To trick his brain into buying fast.]


🔴 [Because the game creators love him.]
```


#### m1-l1.ts (string)

```
Don't tap buy! Stop the rush with a 24-Hour Buy Freeze. Give your brain time to cool down.
```


#### m1-l1.ts (string)

```
Success! Lars has to wait 24 hours.
```


#### m1-l1.ts (string)

```
(Must hold down fully for 2 seconds to activate)
```


#### m1-l1.ts (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l1.ts (string)

```
Hold-to-Activate: Child presses and holds a big blue button for 2 seconds to freeze the offer.
```


#### m1-l1.ts (string)

```
Button: [❄️ HOLD TO FREEZE ❄️]


Visual: Frost animation cracks over the layout; timer sits at 24:00:00 Safe.
```


#### m1-l1.ts (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin.
```


#### m1-l1.ts (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l1.ts (string)

```
Timeline Progression
```


#### m1-l1.ts (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin.

Tap to collect bonus 50xp for successfully staying in control of spending.
```


#### m1-l1.ts (string)

```
User taps gold button with  BONUS - 50XP  on it. When user taps, bonus points are instantly added to user's points count
```


#### m1-l1.ts (string)

```
Giant glowing button: [Claim 50 XP BONUS]
```


#### m1-l1.ts (string)

```
Neurological Closure (Variable Reward System)
```


#### m1-l1.ts (string)

```
Pressing the button triggers the screen to close and game to go back to learning journey, with next lesson button now unlocked and clickable.
```


#### m1-l1.ts (string)

```
Vault: Skill 1 initializes at Bronze.
```



#### lib/academy/lessons/content/data/explorer/m1-l2.json

#### m1-l2.json (string)

```
Module 1 · Lesson 2 · Needs vs Wants Sort
```


#### m1-l2.json (string)

```
Consider Consequences Before Choosing
```


#### m1-l2.json (string)

```
I understand the basics of time & trade-offs
```


#### m1-l2.json (string)

```
Spending money on non-essential wants reduces your ability to pay for essential needs later
```


#### m1-l2.json (string)

```
From spending on wants without considering future needs
 → To checking whether spending now will stop me from paying for something more important later
```


#### m1-l2.json (string)

```
I don’t buy wants until my needs are already paid for
```


#### m1-l2.json (string)

```
Introduce Time & Trade-offs
```


#### m1-l2.json (string)

```
You have $30 left. Check the boxes to buy what you actually need.
```


#### m1-l2.json (string)

```
⚡ Energy Drink ($10)
```


#### m1-l2.json (string)

```
Uncheck the item you don't really 'need'.
```


#### m1-l2.json (string)

```
Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!
```


#### m1-l2.json (string)

```
Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!
```


#### m1-l2.json (string)

```
Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn't spend it. Slide the divider to secure that money now.
```


#### m1-l2.json (string)

```
Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!
```


#### m1-l2.json (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### m1-l2.json (string)

```
Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct.
```


#### m1-l2.json (string)

```
Don't buy anything - keep the $5.
```


#### m1-l2.json (string)

```
Choose something cheaper for $5 to enjoy now.
```


#### m1-l2.json (string)

```
Borrow $5 from dad to buy the $10 bottle.
```


#### m1-l2.json (string)

```
Not quite! Borrowing money creates debt — put this option at the bottom.
```


#### m1-l2.json (string)

```
Not quite! There's a better option to choose first.
```


#### m1-l2.json (string)

```
Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.
```


#### m1-l2.json (string)

```
Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.
```


#### m1-l2.json (string)

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```


#### m1-l2.json (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l2.json (string)

```
Simple Tap: User taps the true status pill to start the scenario.
```


#### m1-l2.json (string)

```
Options:

🔴 [TRUE]

🟢 [FALSE]
```


#### m1-l2.json (string)

```
Persistent Error:  Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Lars spent all his money on things Lars wanted, but didn’t save anything for things he needs to buy. Help Lars identify which items are ‘Things he wants’ or ‘Things he needs’
```


#### m1-l2.json (string)

```
Phone Case Birthday Present
```


#### m1-l2.json (string)

```
Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves!
```


#### m1-l2.json (string)

```
Wait! If your phone cable is broken, your phone dies. That's a Need!
```


#### m1-l2.json (string)

```
Beast Munch tastes great, but you won't get stuck without it. That's a Want!
```


#### m1-l2.json (string)

```
New skin for his favourite game
```


#### m1-l2.json (string)

```
A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!
```


#### m1-l2.json (string)

```
Concept Introduction (Mechanism)
```


#### m1-l2.json (string)

```
The Stacked Sorting Triage
```


#### m1-l2.json (string)

```
Drag-and-Drop: User rapidly flings 4 successive cards into the bottom category buckets.
```


#### m1-l2.json (string)

```
Buckets:

[Things Lars wants] | [Things Lars needs]


Cards (Sequential):

1. 📱 Phone Case Birthday Present (Needs)

2. 🔌 Broken Phone Cable (Needs)

3. 🍫 Beast Munch (Wants)

4. 🎨 New skin for his favourite game (Wants)
```


#### m1-l2.json (string)

```
Persistent Error Handlers:

• Card 1:  Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves! 

• Card 2:  Wait! If your phone cable is broken, your phone dies. That's a Need! 

• Card 3:  Beast Munch tastes great, but you won't get stuck without it. That's a Want! 

• Card 4:  A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants! 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Which item is the one Lars ‘Needs’ to buy before he spends money on what he ‘Wants’ to buy?
```


#### m1-l2.json (string)

```
A new phone case, even though his old one is still fine
```


#### m1-l2.json (string)

```
A new phone case he promised to buy his brother for his birthday
```


#### m1-l2.json (string)

```
Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have!
```


#### m1-l2.json (string)

```
A new gaming mouse with lights (his old one still works)
```


#### m1-l2.json (string)

```
A light for his bike to be seen in the dark
```


#### m1-l2.json (string)

```
If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’.
```


#### m1-l2.json (string)

```
Buy lunch for all his friends on Monday and have nothing left over
```


#### m1-l2.json (string)

```
Buy lunch for himself with his weekly tuckshop money
```


#### m1-l2.json (string)

```
Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!
```


#### m1-l2.json (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l2.json (string)

```
The Pick One / Spotlight (3-Round Challenge)
```


#### m1-l2.json (string)

```
Side-by-Side Tap: Three sequential rounds of asset-supported choice pills that refresh dynamically upon correct selection.
```


#### m1-l2.json (string)

```
Round 1:

❌ [Icon] A new phone case, even though his old one is still fine

✅ [Icon] A new phone case he promised to buy his brother for his birthday


Round 2:

✅ [Icon] A light for his bike to be seen in the dark

❌ [Icon] A new gaming mouse with lights (his old one still works)


Round 3:

✅ [Icon] Buy lunch for himself with his weekly tuckshop money

❌ [Icon] Buy lunch for all his friends on Monday and have nothing left over


Completion State: Render All done text in green font upon clearing Round 3.
```


#### m1-l2.json (string)

```
Persistent Error Handlers:

• Round 1:  Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have! 

• Round 2:  If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’. 

• Round 3:  Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself! 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Active Processing (Triage/Application)
```


#### m1-l2.json (string)

```
Multi-Select Tap: User toggles items. Wallet asset actively updates balance from a baseline pool of $30.
```


#### m1-l2.json (string)

```
Wallet: $30 baseline pool


Toggles:

[ ] 🚍 Bus Pass ($15)

[ ] ⚡ Energy Drink ($10)

[ ] 🔌 Phone Cable ($15)
```


#### m1-l2.json (string)

```
Persistent Error Handlers:

• Missing Cable:  Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline! 

• Missing Bus Pass:  Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home! 

• Over Budget:  Uncheck the item you don’t really ‘need’. 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Wait! Your phone is dead without that cable.
```


#### m1-l2.json (string)

```
Hold up! You're stranded at school without that Bus Pass.
```


#### m1-l2.json (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l2.json (string)

```
The Allocation Slider
```


#### m1-l2.json (string)

```
Horizontal Slider (Overlaid): User drags a large/fat single divider slider bar set directly above narrow, compact object cards.
```


#### m1-l2.json (string)

```
Layout configuration:

• Top: Expanded horizontal slider tracking line.

• Bottom: Narrow UI cards for [Phone Case Icon ($20)] and [Energy Drink Icon ($10)]


Dynamic Logic:

Moving slider to secure $20 locks the phone case card. The remaining $5 causes the Energy Drink tile to instantly dim out to a lighter shade (without displaying text like 'Locked').
```


#### m1-l2.json (string)

```
Persistent Error:  Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20! 

(Tap anywhere to dismiss)
```


#### m1-l2.json (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l2.json (string)

```
Vertical Stack with CTA: User sorts list elements vertically, then explicitly hits a central [Submit Answer] button.
```


#### m1-l2.json (string)

```
Blocks to sort:

• Don’t buy anything - keep the $5.

• Choose something cheaper for $5 to enjoy now.

• Borrow $5 from dad to buy the $10 bottle.


Correct Target Order:

1. Don’t buy anything - keep the $5. (Best)

2. Choose something cheaper... (Okay)

3. Borrow $5 from dad... (Avoid)
```


#### m1-l2.json (string)

```
Persistent Error Handlers:

• If submitted with Borrow at top:  Not quite! Borrowing money creates debt and you don’t want to do that for something you ‘want’ but can do without. This is the option to avoid and should be at the very bottom of our list. Try again! 

• If submitted with Choose cheaper at top:  Not quite! While that is an okay choice, there’s a better option to choose first in this list. Try again! 


If submitted correct: Display a clean validation text block regarding strong wealth protection habits, hide the Submit button, and enable [Next].
```


#### m1-l2.json (string)

```
Timeline Progression
```


#### m1-l2.json (string)

```
Reveal Tap with Recap Pop-up: User clicks a central gift box flanked by avatars to open it, which brings up a final lesson wrap-up card.
```


#### m1-l2.json (string)

```
UI Components:

• Lars Avatar & Senna Avatar displayed.

• Tappable standard Gift Box asset centered between them.


Success Output: Gift box visually opens. A recap text element overlays on completion:  Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.
```


#### m1-l2.json (string)

```
Error: None. Clicking [Next] after the recap animation updates triggers the final module exit block.
```


#### m1-l2.json (string)

```
Neurological Closure (Variable Reward System)
```


#### m1-l2.json (string)

```
Milestone Splash Page
```


#### m1-l2.json (string)

```
Display skill medal (no colour medal yet, just the outline of the skill medal) with text underneath:
Skill Learned: Put 'Needs' First
Button with text:  Lesson points earned: 100XP

Lesson complete! You’ve unlocked one of the most important secrets of money. By looking after what you 'need' before spending money on what you 'want', you can keep your promises and smash your money goals.
```


#### m1-l2.json (string)

```
Terminal Action Tap: User inspects their final performance scorecard metrics, then strikes the main map confirmation exit button.
```


#### m1-l2.json (string)

```
UI Elements:

• Reward summary card overlay.

• Achievement milestone badge asset dynamically mapped to core registry.


Exit Anchor CTA Button: [Back to Map]
```


#### m1-l2.json (string)

```
Rewards Score Engine Data:

• Base Clear: +100 XP

• Perfect Streak Bonus: Up to +50 XP (Calculated dynamically if ScreenMistakes === 0)

• Achievement unlocked: Bronze Medal (Skill Title:  The Giving Mindset )
```



#### lib/academy/lessons/content/data/explorer/m1-l2.ts

#### m1-l2.ts (string)

```
Module 1 · Lesson 2 · Needs vs Wants Sort
```


#### m1-l2.ts (string)

```
Consider Consequences Before Choosing
```


#### m1-l2.ts (string)

```
I understand the basics of time & trade-offs
```


#### m1-l2.ts (string)

```
Spending money on non-essential wants reduces your ability to pay for essential needs later
```


#### m1-l2.ts (string)

```
From spending on wants without considering future needs
 → To checking whether spending now will stop me from paying for something more important later
```


#### m1-l2.ts (string)

```
I don’t buy wants until my needs are already paid for
```


#### m1-l2.ts (string)

```
Introduce Time & Trade-offs
```


#### m1-l2.ts (string)

```
You have $30 left. Check the boxes to buy what you actually need.
```


#### m1-l2.ts (string)

```
⚡ Energy Drink ($10)
```


#### m1-l2.ts (string)

```
Uncheck the item you don't really 'need'.
```


#### m1-l2.ts (string)

```
Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!
```


#### m1-l2.ts (string)

```
Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!
```


#### m1-l2.ts (string)

```
Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn't spend it. Slide the divider to secure that money now.
```


#### m1-l2.ts (string)

```
Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!
```


#### m1-l2.ts (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### m1-l2.ts (string)

```
Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct.
```


#### m1-l2.ts (string)

```
Don't buy anything - keep the $5.
```


#### m1-l2.ts (string)

```
Choose something cheaper for $5 to enjoy now.
```


#### m1-l2.ts (string)

```
Borrow $5 from dad to buy the $10 bottle.
```


#### m1-l2.ts (string)

```
Not quite! Borrowing money creates debt — put this option at the bottom.
```


#### m1-l2.ts (string)

```
Not quite! There's a better option to choose first.
```


#### m1-l2.ts (string)

```
Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.
```


#### m1-l2.ts (string)

```
Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.
```


#### m1-l2.ts (string)

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```


#### m1-l2.ts (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l2.ts (string)

```
Simple Tap: User taps the true status pill to start the scenario.
```


#### m1-l2.ts (string)

```
Options:

🔴 [TRUE]

🟢 [FALSE]
```


#### m1-l2.ts (string)

```
Persistent Error:  Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Lars spent all his money on things Lars wanted, but didn’t save anything for things he needs to buy. Help Lars identify which items are ‘Things he wants’ or ‘Things he needs’
```


#### m1-l2.ts (string)

```
Phone Case Birthday Present
```


#### m1-l2.ts (string)

```
Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves!
```


#### m1-l2.ts (string)

```
Wait! If your phone cable is broken, your phone dies. That's a Need!
```


#### m1-l2.ts (string)

```
Beast Munch tastes great, but you won't get stuck without it. That's a Want!
```


#### m1-l2.ts (string)

```
New skin for his favourite game
```


#### m1-l2.ts (string)

```
A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!
```


#### m1-l2.ts (string)

```
Concept Introduction (Mechanism)
```


#### m1-l2.ts (string)

```
The Stacked Sorting Triage
```


#### m1-l2.ts (string)

```
Drag-and-Drop: User rapidly flings 4 successive cards into the bottom category buckets.
```


#### m1-l2.ts (string)

```
Buckets:

[Things Lars wants] | [Things Lars needs]


Cards (Sequential):

1. 📱 Phone Case Birthday Present (Needs)

2. 🔌 Broken Phone Cable (Needs)

3. 🍫 Beast Munch (Wants)

4. 🎨 New skin for his favourite game (Wants)
```


#### m1-l2.ts (string)

```
Persistent Error Handlers:

• Card 1:  Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves! 

• Card 2:  Wait! If your phone cable is broken, your phone dies. That's a Need! 

• Card 3:  Beast Munch tastes great, but you won't get stuck without it. That's a Want! 

• Card 4:  A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants! 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Which item is the one Lars ‘Needs’ to buy before he spends money on what he ‘Wants’ to buy?
```


#### m1-l2.ts (string)

```
A new phone case, even though his old one is still fine
```


#### m1-l2.ts (string)

```
A new phone case he promised to buy his brother for his birthday
```


#### m1-l2.ts (string)

```
Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have!
```


#### m1-l2.ts (string)

```
A new gaming mouse with lights (his old one still works)
```


#### m1-l2.ts (string)

```
A light for his bike to be seen in the dark
```


#### m1-l2.ts (string)

```
If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’.
```


#### m1-l2.ts (string)

```
Buy lunch for all his friends on Monday and have nothing left over
```


#### m1-l2.ts (string)

```
Buy lunch for himself with his weekly tuckshop money
```


#### m1-l2.ts (string)

```
Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!
```


#### m1-l2.ts (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l2.ts (string)

```
The Pick One / Spotlight (3-Round Challenge)
```


#### m1-l2.ts (string)

```
Side-by-Side Tap: Three sequential rounds of asset-supported choice pills that refresh dynamically upon correct selection.
```


#### m1-l2.ts (string)

```
Round 1:

❌ [Icon] A new phone case, even though his old one is still fine

✅ [Icon] A new phone case he promised to buy his brother for his birthday


Round 2:

✅ [Icon] A light for his bike to be seen in the dark

❌ [Icon] A new gaming mouse with lights (his old one still works)


Round 3:

✅ [Icon] Buy lunch for himself with his weekly tuckshop money

❌ [Icon] Buy lunch for all his friends on Monday and have nothing left over


Completion State: Render All done text in green font upon clearing Round 3.
```


#### m1-l2.ts (string)

```
Persistent Error Handlers:

• Round 1:  Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have! 

• Round 2:  If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’. 

• Round 3:  Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself! 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Active Processing (Triage/Application)
```


#### m1-l2.ts (string)

```
Multi-Select Tap: User toggles items. Wallet asset actively updates balance from a baseline pool of $30.
```


#### m1-l2.ts (string)

```
Wallet: $30 baseline pool


Toggles:

[ ] 🚍 Bus Pass ($15)

[ ] ⚡ Energy Drink ($10)

[ ] 🔌 Phone Cable ($15)
```


#### m1-l2.ts (string)

```
Persistent Error Handlers:

• Missing Cable:  Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline! 

• Missing Bus Pass:  Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home! 

• Over Budget:  Uncheck the item you don’t really ‘need’. 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Wait! Your phone is dead without that cable.
```


#### m1-l2.ts (string)

```
Hold up! You're stranded at school without that Bus Pass.
```


#### m1-l2.ts (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l2.ts (string)

```
The Allocation Slider
```


#### m1-l2.ts (string)

```
Horizontal Slider (Overlaid): User drags a large/fat single divider slider bar set directly above narrow, compact object cards.
```


#### m1-l2.ts (string)

```
Layout configuration:

• Top: Expanded horizontal slider tracking line.

• Bottom: Narrow UI cards for [Phone Case Icon ($20)] and [Energy Drink Icon ($10)]


Dynamic Logic:

Moving slider to secure $20 locks the phone case card. The remaining $5 causes the Energy Drink tile to instantly dim out to a lighter shade (without displaying text like 'Locked').
```


#### m1-l2.ts (string)

```
Persistent Error:  Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20! 

(Tap anywhere to dismiss)
```


#### m1-l2.ts (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l2.ts (string)

```
Vertical Stack with CTA: User sorts list elements vertically, then explicitly hits a central [Submit Answer] button.
```


#### m1-l2.ts (string)

```
Blocks to sort:

• Don’t buy anything - keep the $5.

• Choose something cheaper for $5 to enjoy now.

• Borrow $5 from dad to buy the $10 bottle.


Correct Target Order:

1. Don’t buy anything - keep the $5. (Best)

2. Choose something cheaper... (Okay)

3. Borrow $5 from dad... (Avoid)
```


#### m1-l2.ts (string)

```
Persistent Error Handlers:

• If submitted with Borrow at top:  Not quite! Borrowing money creates debt and you don’t want to do that for something you ‘want’ but can do without. This is the option to avoid and should be at the very bottom of our list. Try again! 

• If submitted with Choose cheaper at top:  Not quite! While that is an okay choice, there’s a better option to choose first in this list. Try again! 


If submitted correct: Display a clean validation text block regarding strong wealth protection habits, hide the Submit button, and enable [Next].
```


#### m1-l2.ts (string)

```
Timeline Progression
```


#### m1-l2.ts (string)

```
Reveal Tap with Recap Pop-up: User clicks a central gift box flanked by avatars to open it, which brings up a final lesson wrap-up card.
```


#### m1-l2.ts (string)

```
UI Components:

• Lars Avatar & Senna Avatar displayed.

• Tappable standard Gift Box asset centered between them.


Success Output: Gift box visually opens. A recap text element overlays on completion:  Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.
```


#### m1-l2.ts (string)

```
Error: None. Clicking [Next] after the recap animation updates triggers the final module exit block.
```


#### m1-l2.ts (string)

```
Neurological Closure (Variable Reward System)
```


#### m1-l2.ts (string)

```
Milestone Splash Page
```


#### m1-l2.ts (string)

```
Display skill medal (no colour medal yet, just the outline of the skill medal) with text underneath:
Skill Learned: Put 'Needs' First
Button with text:  Lesson points earned: 100XP

Lesson complete! You’ve unlocked one of the most important secrets of money. By looking after what you 'need' before spending money on what you 'want', you can keep your promises and smash your money goals.
```


#### m1-l2.ts (string)

```
Terminal Action Tap: User inspects their final performance scorecard metrics, then strikes the main map confirmation exit button.
```


#### m1-l2.ts (string)

```
UI Elements:

• Reward summary card overlay.

• Achievement milestone badge asset dynamically mapped to core registry.


Exit Anchor CTA Button: [Back to Map]
```


#### m1-l2.ts (string)

```
Rewards Score Engine Data:

• Base Clear: +100 XP

• Perfect Streak Bonus: Up to +50 XP (Calculated dynamically if ScreenMistakes === 0)

• Achievement unlocked: Bronze Medal (Skill Title:  The Giving Mindset )
```



#### lib/academy/lessons/content/data/explorer/m1-l3.draft.json

#### m1-l3.draft.json (string)

```
Keep Some Money Aside
```


#### m1-l3.draft.json (string)

```
Module 1 · Lesson 3 · Keep Some Money Aside
```


#### m1-l3.draft.json (string)

```
Choose to Keep Some Money Instead of Spending It All
```


#### m1-l3.draft.json (string)

```
I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
Money doesn’t have to be spent - it can be kept and used in more beneficial ways
```


#### m1-l3.draft.json (string)

```
From spending all remaining money on wants once needs are covered
 → To choosing to keep some money because it can be used in better ways than immediate spending
```


#### m1-l3.draft.json (string)

```
I don’t spend everything - I always keep some aside
```


#### m1-l3.draft.json (string)

```
Introduce Money Changes Over Time
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 1] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
The Fill-the-Blank Drop
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 2] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
The Sentence Finisher
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 3] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 4] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 5] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 6] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
[Draft L3 Screen 7] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.json (string)

```
Milestone Splash Page
```



#### lib/academy/lessons/content/data/explorer/m1-l3.draft.ts

#### m1-l3.draft.ts (string)

```
Keep Some Money Aside
```


#### m1-l3.draft.ts (string)

```
Module 1 · Lesson 3 · Keep Some Money Aside
```


#### m1-l3.draft.ts (string)

```
Choose to Keep Some Money Instead of Spending It All
```


#### m1-l3.draft.ts (string)

```
I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
Money doesn’t have to be spent - it can be kept and used in more beneficial ways
```


#### m1-l3.draft.ts (string)

```
From spending all remaining money on wants once needs are covered
 → To choosing to keep some money because it can be used in better ways than immediate spending
```


#### m1-l3.draft.ts (string)

```
I don’t spend everything - I always keep some aside
```


#### m1-l3.draft.ts (string)

```
Introduce Money Changes Over Time
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 1] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
The Fill-the-Blank Drop
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 2] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
The Sentence Finisher
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 3] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 4] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 5] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 6] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
[Draft L3 Screen 7] Introduce Money Changes Over Time — I understand the basics of money changes over time
```


#### m1-l3.draft.ts (string)

```
Milestone Splash Page
```



#### lib/academy/lessons/content/data/explorer/m1-l3.json

#### m1-l3.json (string)

```
Keep Some Money Aside
```


#### m1-l3.json (string)

```
Module 1 · Lesson 3 · Keep Some Money Aside
```


#### m1-l3.json (string)

```
Choose to Keep Some Money Instead of Spending It All
```


#### m1-l3.json (string)

```
I understand the basics of money changes over time
```


#### m1-l3.json (string)

```
Money doesn’t have to be spent - it can be kept and used in more beneficial ways
```


#### m1-l3.json (string)

```
From spending all remaining money on wants once needs are covered
 → To choosing to keep some money because it can be used in better ways than immediate spending
```


#### m1-l3.json (string)

```
I don’t spend everything - I always keep some aside
```


#### m1-l3.json (string)

```
Introduce Money Changes Over Time
```


#### m1-l3.json (string)

```
Drag the choices in the correct order — Spare Cash first, then fun!
```


#### m1-l3.json (string)

```
Spare Cash first, then fun. What would Mia do best?
```


#### m1-l3.json (string)

```
Perfect! Spare Cash first, then fun. You're ready for anything!
```


#### m1-l3.json (string)

```
Set aside Spare Cash for the headphones first
```


#### m1-l3.json (string)

```
Spend what's left on small treats
```


#### m1-l3.json (string)

```
Spend everything on fun stuff right away
```


#### m1-l3.json (string)

```
Not quite! Spending everything first leaves no Spare Cash — put that at the bottom.
```


#### m1-l3.json (string)

```
Not quite! Setting aside Spare Cash comes first.
```


#### m1-l3.json (string)

```
Mia borrowed her sister's headphones and broke them. What happened next?
```


#### m1-l3.json (string)

```
Mia has no money to buy a new pair
```


#### m1-l3.json (string)

```
Mia tries to fix them with sticky tape and now they're even worse
```


#### m1-l3.json (string)

```
Haha, maybe. But let's try again
```


#### m1-l3.json (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l3.json (string)

```
- Mia has no money to buy a new pair
- Mia tries to fix them with sticky tape and now they're even worse
- the dog runs off with one of the pieces
```


#### m1-l3.json (string)

```
Option 1 = correct.
Message if submitted correct: "Exactly! No money left = big sister drama."
If submitted incorrect answer: "Haha, maybe. But let's try again"
```


#### m1-l3.json (string)

```
Mia had $40. Drag each purchase into Spent to see what's left for her sister's headphones.
```


#### m1-l3.json (string)

```
Mia has no money left to pay for new headphones
```


#### m1-l3.json (string)

```
Concept Introduction (Mechanism)
```


#### m1-l3.json (string)

```
Triage Sorter (Standardized Engine Pattern)
```


#### m1-l3.json (string)

```
Screen Layout:

Left Side (Inventory): Three distinct icons representing Mia's recent purchases:

A Squishy toy (+ icon) $25
A Slime (+ tub icon). $8
Snacks (chocolate bar/wrapper icon). $7

Right Side (The bucket/bin): A target area labeled [Spent].
Dynamic Counter (Bottom): A digital display: Total Spent: $0 / $40

Screen starts with '$40 available' and each time an item is dragged to 'spent' the 'amount available' drops by the value of that item.
```


#### m1-l3.json (string)

```
When all items are dragged and the 'amount available' hits $0 a pop up shows the message: "Mia has no money left to pay for new headphones"
```


#### m1-l3.json (string)

```
Mia spent everything on fun stuff. Tap each idea — Spare Cash thinking or Spend-Everything thinking?
```


#### m1-l3.json (string)

```
Set $20 aside for headphones
```


#### m1-l3.json (string)

```
Buy another squishy toy
```


#### m1-l3.json (string)

```
Save before spending on fun
```


#### m1-l3.json (string)

```
Spend every last dollar on snacks
```


#### m1-l3.json (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l3.json (string)

```
Active Processing (Triage/Application)
```


#### m1-l3.json (string)

```
Buy the headphones to fix what she broke.
```


#### m1-l3.json (string)

```
Buy the toy and save $10 more next week.
```


#### m1-l3.json (string)

```
That's a trap! Stick to the plan to avoid stress later'
If #2:
```


#### m1-l3.json (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l3.json (string)

```
What should Mia do?

[Buy the toy and save $10 more next week.] (The Trap)
[Buy the headphones to fix what she broke.] (The Concept Truth)
[Buy the toy and hope the headphones don't cost $40.] (The Trap)
```


#### m1-l3.json (string)

```
If #1 or #3: "That's a trap! Stick to the plan to avoid stress later'
If #2: "Smart move. Replacing the broken headphones should come first."
```


#### m1-l3.json (string)

```
everything, I had Spare Cash to replace the headphones immediately.
```


#### m1-l3.json (string)

```
Think about what Mia did — she didn't use all her money.
```


#### m1-l3.json (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l3.json (string)

```
Fill-in-the-Blanks (Drag & Drop)
```


#### m1-l3.json (string)

```
"Because I didn't ['spend' = correct answer / save = wrong answer] everything, I had ['Spare Cash' = correct/ 'Borrowed money' = incorrect] to ['replace' = good / 'throw away' = bad] the headphones immediately."
```


#### m1-l3.json (string)

```
Exactly! Keeping some money means you’re in charge, you don't have to beg for cash, and you can get the stuff that actually matters.
```


#### m1-l3.json (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l3.json (string)

```
Timeline Progression
```


#### m1-l3.json (string)

```
Neurological Closure (Variable Reward System)
```



#### lib/academy/lessons/content/data/explorer/m1-l3.ts

#### m1-l3.ts (string)

```
Keep Some Money Aside
```


#### m1-l3.ts (string)

```
Module 1 · Lesson 3 · Keep Some Money Aside
```


#### m1-l3.ts (string)

```
Choose to Keep Some Money Instead of Spending It All
```


#### m1-l3.ts (string)

```
I understand the basics of money changes over time
```


#### m1-l3.ts (string)

```
Money doesn’t have to be spent - it can be kept and used in more beneficial ways
```


#### m1-l3.ts (string)

```
From spending all remaining money on wants once needs are covered
 → To choosing to keep some money because it can be used in better ways than immediate spending
```


#### m1-l3.ts (string)

```
I don’t spend everything - I always keep some aside
```


#### m1-l3.ts (string)

```
Introduce Money Changes Over Time
```


#### m1-l3.ts (string)

```
Drag the choices in the correct order — Spare Cash first, then fun!
```


#### m1-l3.ts (string)

```
Spare Cash first, then fun. What would Mia do best?
```


#### m1-l3.ts (string)

```
Perfect! Spare Cash first, then fun. You're ready for anything!
```


#### m1-l3.ts (string)

```
Set aside Spare Cash for the headphones first
```


#### m1-l3.ts (string)

```
Spend what's left on small treats
```


#### m1-l3.ts (string)

```
Spend everything on fun stuff right away
```


#### m1-l3.ts (string)

```
Not quite! Spending everything first leaves no Spare Cash — put that at the bottom.
```


#### m1-l3.ts (string)

```
Not quite! Setting aside Spare Cash comes first.
```


#### m1-l3.ts (string)

```
Mia borrowed her sister's headphones and broke them. What happened next?
```


#### m1-l3.ts (string)

```
Mia has no money to buy a new pair
```


#### m1-l3.ts (string)

```
Mia tries to fix them with sticky tape and now they're even worse
```


#### m1-l3.ts (string)

```
Haha, maybe. But let's try again
```


#### m1-l3.ts (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l3.ts (string)

```
- Mia has no money to buy a new pair
- Mia tries to fix them with sticky tape and now they're even worse
- the dog runs off with one of the pieces
```


#### m1-l3.ts (string)

```
Option 1 = correct.
Message if submitted correct: "Exactly! No money left = big sister drama."
If submitted incorrect answer: "Haha, maybe. But let's try again"
```


#### m1-l3.ts (string)

```
Mia had $40. Drag each purchase into Spent to see what's left for her sister's headphones.
```


#### m1-l3.ts (string)

```
Mia has no money left to pay for new headphones
```


#### m1-l3.ts (string)

```
Concept Introduction (Mechanism)
```


#### m1-l3.ts (string)

```
Triage Sorter (Standardized Engine Pattern)
```


#### m1-l3.ts (string)

```
Screen Layout:

Left Side (Inventory): Three distinct icons representing Mia's recent purchases:

A Squishy toy (+ icon) $25
A Slime (+ tub icon). $8
Snacks (chocolate bar/wrapper icon). $7

Right Side (The bucket/bin): A target area labeled [Spent].
Dynamic Counter (Bottom): A digital display: Total Spent: $0 / $40

Screen starts with '$40 available' and each time an item is dragged to 'spent' the 'amount available' drops by the value of that item.
```


#### m1-l3.ts (string)

```
When all items are dragged and the 'amount available' hits $0 a pop up shows the message: "Mia has no money left to pay for new headphones"
```


#### m1-l3.ts (string)

```
Mia spent everything on fun stuff. Tap each idea — Spare Cash thinking or Spend-Everything thinking?
```


#### m1-l3.ts (string)

```
Set $20 aside for headphones
```


#### m1-l3.ts (string)

```
Buy another squishy toy
```


#### m1-l3.ts (string)

```
Save before spending on fun
```


#### m1-l3.ts (string)

```
Spend every last dollar on snacks
```


#### m1-l3.ts (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l3.ts (string)

```
Active Processing (Triage/Application)
```


#### m1-l3.ts (string)

```
Buy the headphones to fix what she broke.
```


#### m1-l3.ts (string)

```
Buy the toy and save $10 more next week.
```


#### m1-l3.ts (string)

```
That's a trap! Stick to the plan to avoid stress later'
If #2:
```


#### m1-l3.ts (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l3.ts (string)

```
What should Mia do?

[Buy the toy and save $10 more next week.] (The Trap)
[Buy the headphones to fix what she broke.] (The Concept Truth)
[Buy the toy and hope the headphones don't cost $40.] (The Trap)
```


#### m1-l3.ts (string)

```
If #1 or #3: "That's a trap! Stick to the plan to avoid stress later'
If #2: "Smart move. Replacing the broken headphones should come first."
```


#### m1-l3.ts (string)

```
everything, I had Spare Cash to replace the headphones immediately.
```


#### m1-l3.ts (string)

```
Think about what Mia did — she didn't use all her money.
```


#### m1-l3.ts (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l3.ts (string)

```
Fill-in-the-Blanks (Drag & Drop)
```


#### m1-l3.ts (string)

```
"Because I didn't ['spend' = correct answer / save = wrong answer] everything, I had ['Spare Cash' = correct/ 'Borrowed money' = incorrect] to ['replace' = good / 'throw away' = bad] the headphones immediately."
```


#### m1-l3.ts (string)

```
Exactly! Keeping some money means you’re in charge, you don't have to beg for cash, and you can get the stuff that actually matters.
```


#### m1-l3.ts (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l3.ts (string)

```
Timeline Progression
```


#### m1-l3.ts (string)

```
Neurological Closure (Variable Reward System)
```



#### lib/academy/lessons/content/data/explorer/m1-l4.draft.json

#### m1-l4.draft.json (string)

```
Pause Under Pressure
```


#### m1-l4.draft.json (string)

```
Module 1 · Lesson 4 · Pause Under Pressure
```


#### m1-l4.draft.json (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l4.draft.json (string)

```
I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
Wanting something strongly in the moment does not mean it is a good decision - pausing helps improve the decision
```


#### m1-l4.draft.json (string)

```
From waiting but still making the same decision without thinking it through
 → To using the pause to actively think before deciding
```


#### m1-l4.draft.json (string)

```
When I pause before buying something I want, I ask:
 Do I still want this after thinking about it?
 Can this wait, or do I need it now?
 Is there a better way to buy this (e.g. cheaper or later)?
```


#### m1-l4.draft.json (string)

```
Apply Recognise Spending Triggers under pressure
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 1] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
The Fill-the-Blank Drop
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 2] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
The Sentence Finisher
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 3] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 4] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 5] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 6] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
[Draft L4 Screen 7] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.json (string)

```
Milestone Splash Page
```



#### lib/academy/lessons/content/data/explorer/m1-l4.draft.ts

#### m1-l4.draft.ts (string)

```
Pause Under Pressure
```


#### m1-l4.draft.ts (string)

```
Module 1 · Lesson 4 · Pause Under Pressure
```


#### m1-l4.draft.ts (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l4.draft.ts (string)

```
I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
Wanting something strongly in the moment does not mean it is a good decision - pausing helps improve the decision
```


#### m1-l4.draft.ts (string)

```
From waiting but still making the same decision without thinking it through
 → To using the pause to actively think before deciding
```


#### m1-l4.draft.ts (string)

```
When I pause before buying something I want, I ask:
 Do I still want this after thinking about it?
 Can this wait, or do I need it now?
 Is there a better way to buy this (e.g. cheaper or later)?
```


#### m1-l4.draft.ts (string)

```
Apply Recognise Spending Triggers under pressure
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 1] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
The Fill-the-Blank Drop
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 2] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
The Sentence Finisher
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 3] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 4] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 5] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 6] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
[Draft L4 Screen 7] Apply Recognise Spending Triggers under pressure — I can use recognise spending triggers in more realistic situations
```


#### m1-l4.draft.ts (string)

```
Milestone Splash Page
```



#### lib/academy/lessons/content/data/explorer/m1-l4.json

#### m1-l4.json (string)

```
Pause Under Pressure
```


#### m1-l4.json (string)

```
Module 1 · Lesson 4 · Pause Under Pressure
```


#### m1-l4.json (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l4.json (string)

```
I can use recognise spending triggers in more realistic situations
```


#### m1-l4.json (string)

```
Wanting something strongly in the moment does not mean it is a good decision - pausing helps improve the decision
```


#### m1-l4.json (string)

```
From waiting but still making the same decision without thinking it through
 → To using the pause to actively think before deciding
```


#### m1-l4.json (string)

```
When I pause before buying something I want, I ask:
 Do I still want this after thinking about it?
 Can this wait, or do I need it now?
 Is there a better way to buy this (e.g. cheaper or later)?
```


#### m1-l4.json (string)

```
Apply Recognise Spending Triggers under pressure
```


#### m1-l4.json (string)

```
Put Senna's pause steps in the right order.
```


#### m1-l4.json (string)

```
Drag each step into the order Senna should follow.
```


#### m1-l4.json (string)

```
Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.
```


#### m1-l4.json (string)

```
Senna sees the Limited Time offer.
```


#### m1-l4.json (string)

```
He stops and remembers the price might drop later.
```


#### m1-l4.json (string)

```
He waits two days to check the price again.
```


#### m1-l4.json (string)

```
Senna only buys it if the price is cheaper and he still wants it.
```


#### m1-l4.json (string)

```
Not quite! Senna checks the price before buying — that step comes later.
```


#### m1-l4.json (string)

```
Not quite! Remembering to pause comes before waiting.
```


#### m1-l4.json (string)

```
What skill is Senna practicing?
```


#### m1-l4.json (string)

```
Nah, running out of cash isn't a skill! We're looking for what Senna is choosing to do.
```


#### m1-l4.json (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l4.json (string)

```
Choose the correct answer.
```


#### m1-l4.json (string)

```
What skill is Senna practicing?
Option A: "Senna stops to think." (Correct)
Option B: "Senna has run out of money." (Wrong)
Option C: "Senna is just slow at clicking." (Wrong)
```


#### m1-l4.json (string)

```
A - That's right! Senna is hitting the brakes before his brain makes a quick mistake.
B - Nah, running out of cash isn't a skill! We're looking for what Senna is choosing to do.
C - Not quite! Senna is actually being smart by not rushing into a trap.
```


#### m1-l4.json (string)

```
Concept Introduction (Mechanism)
```


#### m1-l4.json (string)

```
Mechanism (Game Type): Step-by-Step Sequencer (Snap-in interaction: Each step locks into place only when placed in the correct chronological order).
```


#### m1-l4.json (string)

```
1. Senna sees the "Limited Time" offer.
2. He stops and remembers the price might drop later.
3. He waits two days to check the price again.
4. Senna only buys it if the price is cheaper and he still wants it.
```


#### m1-l4.json (string)

```
Success: Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.
```


#### m1-l4.json (string)

```
Sort each thought — is Senna rushing or thinking?
```


#### m1-l4.json (string)

```
It looks cool, I need it right now!
```


#### m1-l4.json (string)

```
I’ll ask around if it’s actually any good.
```


#### m1-l4.json (string)

```
Everyone has it, I don't want to be left out.
```


#### m1-l4.json (string)

```
I can wait and get it cheaper later.
```


#### m1-l4.json (string)

```
It’s a 'limited time' offer—I have to buy it!
```


#### m1-l4.json (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l4.json (string)

```
The Interaction: The user drags a thought bubble from the list to a bucket.

The "Success" State (Drop into correct bucket): - When the user releases the bubble over the correct bucket, it "snaps" cleanly into place, perhaps with a small click sound or a subtle highlight on the bucket. The item stays in that bucket.

The "Error" State (Drop into incorrect bucket): - If the user drops it into the wrong bucket, it returns to the pool of items to be sorted. The user is visually told "that's not right" without the game explicitly telling them "You are wrong."
```


#### m1-l4.json (string)

```
Option 1: Action-Oriented (Most Direct)
Bucket A: "I'm Rushing"
Bucket B: "I'm Thinking"

"It looks cool, I need it right now!" (Bucket A)
"I’ll ask around if it’s actually any good." (Bucket B)
"Everyone has it, I don't want to be left out." (Bucket A)
"I can wait and get it cheaper later." (Bucket B)
"It’s a 'limited time' offer—I have to buy it!" (Bucket A)
"I’ll sleep on it and decide tomorrow." (Bucket B)
```


#### m1-l4.json (string)

```
"Perfect! You’ve sorted the 'rush' from the 'think.' Lars and Mia are in control now!"
```


#### m1-l4.json (string)

```
Tap the parts of the sign that are making Lars rush.
```


#### m1-l4.json (string)

```
Tap on the parts of the sign that are making Lars rush.
```


#### m1-l4.json (string)

```
Active Processing (Triage/Application)
```


#### m1-l4.json (string)

```
The Interaction:

User taps each of the three lines.

As each line is tapped, it fades away.
```


#### m1-l4.json (string)

```
"Tap on the parts of the sign that are making Lars rush."

The Sign:

"DON'T MISS OUT!"
"ONLY 2 LEFT!"
"ENDS TOMORROW!"
```


#### m1-l4.json (string)

```
Good work. With the pressure removed, Lars has time to think and decides he doesn't need it.
```


#### m1-l4.json (string)

```
Which question helps Senna pause before buying?
```


#### m1-l4.json (string)

```
Do I have enough money left for my other goals?
```


#### m1-l4.json (string)

```
Caught you! That button is trying to do the thinking for you.
```


#### m1-l4.json (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l4.json (string)

```
Mechanism
A list of four clickable buttons. Tapping a "Correct" button highlights it green and locks it in. Tapping the "Dud" button triggers a gentle shake animation to indicate it is not the right tool for this decision.
```


#### m1-l4.json (string)

```
[Check] Do I really need this instead of using the money for something else?
[Check] "Do I really want this now, or is the timer making me rush to buy it?"
[Check] "Do I have enough money left for my other goals?"
[Dud] "CLICK HERE TO BUY NOW!"
```


#### m1-l4.json (string)

```
Caught you! That button is trying to do the thinking for you. Don't let it!
```


#### m1-l4.json (string)

```
Drag your coins into the piggy bank — saving beats rushing every time.
```


#### m1-l4.json (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l4.json (string)

```
Swipe and move object
```


#### m1-l4.json (string)

```
Stack of gold coins that can be moved around the screen by the user. The coins are dropped into a piggy bank when the user hovers the money over the piggy bank.
```


#### m1-l4.json (string)

```
Senna saved up for the Wheelie Workshop! "Snacks at school $5, " $5
```


#### m1-l4.json (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l4.json (string)

```
Timeline Progression
```


#### m1-l4.json (string)

```
The Meter: A progress bar at the top labeled "Savings for Workshop: $0 / $20."

The Action: As the user drags each item into the "Saved" box, the item vanishes, the "Saved" box glows, and the meter ticks up: $5... $15... $20!

The Finale: Once the meter hits $20, the "Wheelie Workshop" sign transforms from "Locked" to "Sign Up Now!" with a "Goal Achieved!" animation.
```


#### m1-l4.json (string)

```
"Snacks at school $5
"Extra Lives Bundle" $5 
Flashlight $10
```


#### m1-l4.json (string)

```
Once the meter hits $20, the "Wheelie Workshop" sign transforms from "Locked" to "Sign Up Now!" with a "Goal Achieved!" animation.
```


#### m1-l4.json (string)

```
Neurological Closure (Variable Reward System)
```



#### lib/academy/lessons/content/data/explorer/m1-l4.ts

#### m1-l4.ts (string)

```
Pause Under Pressure
```


#### m1-l4.ts (string)

```
Module 1 · Lesson 4 · Pause Under Pressure
```


#### m1-l4.ts (string)

```
Recognise and Pause Impulsive Spending
```


#### m1-l4.ts (string)

```
I can use recognise spending triggers in more realistic situations
```


#### m1-l4.ts (string)

```
Wanting something strongly in the moment does not mean it is a good decision - pausing helps improve the decision
```


#### m1-l4.ts (string)

```
From waiting but still making the same decision without thinking it through
 → To using the pause to actively think before deciding
```


#### m1-l4.ts (string)

```
When I pause before buying something I want, I ask:
 Do I still want this after thinking about it?
 Can this wait, or do I need it now?
 Is there a better way to buy this (e.g. cheaper or later)?
```


#### m1-l4.ts (string)

```
Apply Recognise Spending Triggers under pressure
```


#### m1-l4.ts (string)

```
Put Senna's pause steps in the right order.
```


#### m1-l4.ts (string)

```
Drag each step into the order Senna should follow.
```


#### m1-l4.ts (string)

```
Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.
```


#### m1-l4.ts (string)

```
Senna sees the Limited Time offer.
```


#### m1-l4.ts (string)

```
He stops and remembers the price might drop later.
```


#### m1-l4.ts (string)

```
He waits two days to check the price again.
```


#### m1-l4.ts (string)

```
Senna only buys it if the price is cheaper and he still wants it.
```


#### m1-l4.ts (string)

```
Not quite! Senna checks the price before buying — that step comes later.
```


#### m1-l4.ts (string)

```
Not quite! Remembering to pause comes before waiting.
```


#### m1-l4.ts (string)

```
What skill is Senna practicing?
```


#### m1-l4.ts (string)

```
Nah, running out of cash isn't a skill! We're looking for what Senna is choosing to do.
```


#### m1-l4.ts (string)

```
Activate Prior Knowledge (Relatability)
```


#### m1-l4.ts (string)

```
Choose the correct answer.
```


#### m1-l4.ts (string)

```
What skill is Senna practicing?
Option A: "Senna stops to think." (Correct)
Option B: "Senna has run out of money." (Wrong)
Option C: "Senna is just slow at clicking." (Wrong)
```


#### m1-l4.ts (string)

```
A - That's right! Senna is hitting the brakes before his brain makes a quick mistake.
B - Nah, running out of cash isn't a skill! We're looking for what Senna is choosing to do.
C - Not quite! Senna is actually being smart by not rushing into a trap.
```


#### m1-l4.ts (string)

```
Concept Introduction (Mechanism)
```


#### m1-l4.ts (string)

```
Mechanism (Game Type): Step-by-Step Sequencer (Snap-in interaction: Each step locks into place only when placed in the correct chronological order).
```


#### m1-l4.ts (string)

```
1. Senna sees the "Limited Time" offer.
2. He stops and remembers the price might drop later.
3. He waits two days to check the price again.
4. Senna only buys it if the price is cheaper and he still wants it.
```


#### m1-l4.ts (string)

```
Success: Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.
```


#### m1-l4.ts (string)

```
Sort each thought — is Senna rushing or thinking?
```


#### m1-l4.ts (string)

```
It looks cool, I need it right now!
```


#### m1-l4.ts (string)

```
I’ll ask around if it’s actually any good.
```


#### m1-l4.ts (string)

```
Everyone has it, I don't want to be left out.
```


#### m1-l4.ts (string)

```
I can wait and get it cheaper later.
```


#### m1-l4.ts (string)

```
It’s a 'limited time' offer—I have to buy it!
```


#### m1-l4.ts (string)

```
Contrast & Categorization (Discrimination)
```


#### m1-l4.ts (string)

```
The Interaction: The user drags a thought bubble from the list to a bucket.

The "Success" State (Drop into correct bucket): - When the user releases the bubble over the correct bucket, it "snaps" cleanly into place, perhaps with a small click sound or a subtle highlight on the bucket. The item stays in that bucket.

The "Error" State (Drop into incorrect bucket): - If the user drops it into the wrong bucket, it returns to the pool of items to be sorted. The user is visually told "that's not right" without the game explicitly telling them "You are wrong."
```


#### m1-l4.ts (string)

```
Option 1: Action-Oriented (Most Direct)
Bucket A: "I'm Rushing"
Bucket B: "I'm Thinking"

"It looks cool, I need it right now!" (Bucket A)
"I’ll ask around if it’s actually any good." (Bucket B)
"Everyone has it, I don't want to be left out." (Bucket A)
"I can wait and get it cheaper later." (Bucket B)
"It’s a 'limited time' offer—I have to buy it!" (Bucket A)
"I’ll sleep on it and decide tomorrow." (Bucket B)
```


#### m1-l4.ts (string)

```
"Perfect! You’ve sorted the 'rush' from the 'think.' Lars and Mia are in control now!"
```


#### m1-l4.ts (string)

```
Tap the parts of the sign that are making Lars rush.
```


#### m1-l4.ts (string)

```
Tap on the parts of the sign that are making Lars rush.
```


#### m1-l4.ts (string)

```
Active Processing (Triage/Application)
```


#### m1-l4.ts (string)

```
The Interaction:

User taps each of the three lines.

As each line is tapped, it fades away.
```


#### m1-l4.ts (string)

```
"Tap on the parts of the sign that are making Lars rush."

The Sign:

"DON'T MISS OUT!"
"ONLY 2 LEFT!"
"ENDS TOMORROW!"
```


#### m1-l4.ts (string)

```
Good work. With the pressure removed, Lars has time to think and decides he doesn't need it.
```


#### m1-l4.ts (string)

```
Which question helps Senna pause before buying?
```


#### m1-l4.ts (string)

```
Do I have enough money left for my other goals?
```


#### m1-l4.ts (string)

```
Caught you! That button is trying to do the thinking for you.
```


#### m1-l4.ts (string)

```
Cognitive Conflict (Deconstruction)
```


#### m1-l4.ts (string)

```
Mechanism
A list of four clickable buttons. Tapping a "Correct" button highlights it green and locks it in. Tapping the "Dud" button triggers a gentle shake animation to indicate it is not the right tool for this decision.
```


#### m1-l4.ts (string)

```
[Check] Do I really need this instead of using the money for something else?
[Check] "Do I really want this now, or is the timer making me rush to buy it?"
[Check] "Do I have enough money left for my other goals?"
[Dud] "CLICK HERE TO BUY NOW!"
```


#### m1-l4.ts (string)

```
Caught you! That button is trying to do the thinking for you. Don't let it!
```


#### m1-l4.ts (string)

```
Drag your coins into the piggy bank — saving beats rushing every time.
```


#### m1-l4.ts (string)

```
Situational Resolution (Procedural Memory)
```


#### m1-l4.ts (string)

```
Swipe and move object
```


#### m1-l4.ts (string)

```
Stack of gold coins that can be moved around the screen by the user. The coins are dropped into a piggy bank when the user hovers the money over the piggy bank.
```


#### m1-l4.ts (string)

```
Senna saved up for the Wheelie Workshop! "Snacks at school $5, " $5
```


#### m1-l4.ts (string)

```
[ COLLECT 50 XP BONUS ]
```


#### m1-l4.ts (string)

```
Timeline Progression
```


#### m1-l4.ts (string)

```
The Meter: A progress bar at the top labeled "Savings for Workshop: $0 / $20."

The Action: As the user drags each item into the "Saved" box, the item vanishes, the "Saved" box glows, and the meter ticks up: $5... $15... $20!

The Finale: Once the meter hits $20, the "Wheelie Workshop" sign transforms from "Locked" to "Sign Up Now!" with a "Goal Achieved!" animation.
```


#### m1-l4.ts (string)

```
"Snacks at school $5
"Extra Lives Bundle" $5 
Flashlight $10
```


#### m1-l4.ts (string)

```
Once the meter hits $20, the "Wheelie Workshop" sign transforms from "Locked" to "Sign Up Now!" with a "Goal Achieved!" animation.
```


#### m1-l4.ts (string)

```
Neurological Closure (Variable Reward System)
```



#### templates/lesson-authoring/Characters.csv

#### Characters.csv (string)

```
Impulse buys; spending birthday/chore money fast
```


#### Characters.csv (string)

```
Sticker price vs value; fear of being ripped off
```


#### Characters.csv (string)

```
Peer pressure; mall trends; social spending
```


#### Characters.csv (string)

```
Hoarding; saving for someone else; gift promises
```


#### Characters.csv (string)

```
Pro-gaming bets; all-in on gear or tournaments
```


#### Characters.csv (string)

```
Side hustles; marketplace; no emergency fund
```


#### Characters.csv (string)

```
Over-planning; uni/travel savings; analysis paralysis
```


#### Characters.csv (string)

```
Parents pay for everything; generosity without cost awareness
```


#### Characters.csv (string)

```
Parent voice; household budgeting; real-world money talk
```


#### Characters.csv (string)

```
Long-term growth; investing myths; mentor caution tales
```



#### templates/lesson-authoring/Game-Types.csv

No old-only strings.


#### templates/lesson-authoring/Generated-m1-l1.ts

#### Generated-m1-l1.ts (string)

```
Module 1 · Lesson 1 · Money In, Money Out
```


#### Generated-m1-l1.ts (string)

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Holly's friends are showing off - what's her brain pushing her to do with that $25?
```


#### Generated-m1-l1.ts (string)

```
Holly gets her eyelashes done right away with the $25 but ten minutes later...
```


#### Generated-m1-l1.ts (string)

```
...the initial excitement fades and her $25 is gone.
```


#### Generated-m1-l1.ts (string)

```
...her $25 magically reappears in her wallet.
```


#### Generated-m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### Generated-m1-l1.ts (string)

```
Holly's $25 is gone and she only had a few minutes of excitement. Tap each item to see whether it's short fun or longer fun!
```


#### Generated-m1-l1.ts (string)

```
Glow-in-the-dark slime kit
```


#### Generated-m1-l1.ts (string)

```
Your turn! Drag each item into the correct bucket.
```


#### Generated-m1-l1.ts (string)

```
Cheap glow sticks / LED toys
```


#### Generated-m1-l1.ts (string)

```
Wireless speaker for hangouts
```


#### Generated-m1-l1.ts (string)

```
Journal + good pen set
```


#### Generated-m1-l1.ts (string)

```
Holly's playing online and a game alert flashes: "Limited time - new skin 70% off! 15 MINUTES LEFT!" Why is the game rushing her?
```


#### Generated-m1-l1.ts (string)

```
To stop her from pausing to decide if she really needs it.
```


#### Generated-m1-l1.ts (string)

```
Because they want to make sure she gets a good deal.
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Holly so she won't stop to think if she really wants to spend her money on it. Try again!
```


#### Generated-m1-l1.ts (string)

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, by silencing the chat alerts.
```


#### Generated-m1-l1.ts (string)

```
Holly chooses to keep her money instead of giving in to the rush. She stays in control of spending.
```


#### Generated-m1-l1.ts (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### Generated-m1-l1.ts (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...
```


#### Generated-m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### Generated-m1-l1.ts (string)

```
...his $20 cash magically reappears.
```


#### Generated-m1-l1.ts (string)

```
Lars's money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```


#### Generated-m1-l1.ts (string)

```
Bubble tea with all the toppings
```


#### Generated-m1-l1.ts (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### Generated-m1-l1.ts (string)

```
Because the game creators love him.
```


#### Generated-m1-l1.ts (string)

```
Help Lars by giving him a 'buy freeze' so his brain has time to think.
```


#### Generated-m1-l1.ts (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin anymore. He kept his money safe to save for a new gaming headset. Congratulations for helping him avoid wasting his money.
```


#### Generated-m1-l1.ts (string)

```
Aiden just got $40 cash from a quick delivery gig. He opens the marketplace app and sees the exact wireless earbuds he's been tracking. His brain tricks him into thinking the cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Aiden spotted those earbuds - what's his brain pushing him to do with that $40?
```


#### Generated-m1-l1.ts (string)

```
Aiden buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first, but a few hours later...
```


#### Generated-m1-l1.ts (string)

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```


#### Generated-m1-l1.ts (string)

```
...the thrill starts to wear off and his $40 is spent.
```


#### Generated-m1-l1.ts (string)

```
...the seller gives him his money back because he bought them so quickly.
```


#### Generated-m1-l1.ts (string)

```
Aiden's $40 is gone after buying the earbuds and he only had a short burst of satisfaction. Tap these items to see the difference between things that give short fun and things that give more fun for longer!
```


#### Generated-m1-l1.ts (string)

```
Energy drink + snack
```


#### Generated-m1-l1.ts (string)

```
Scratch-it lottery ticket
```


#### Generated-m1-l1.ts (string)

```
Multi-tool / pocket knife
```


#### Generated-m1-l1.ts (string)

```
Food delivery with priority fee
```


#### Generated-m1-l1.ts (string)

```
Disposable concert merch
```


#### Generated-m1-l1.ts (string)

```
Second-hand quality guitar
```


#### Generated-m1-l1.ts (string)

```
High-quality piece of clothing
```


#### Generated-m1-l1.ts (string)

```
Later that day Aiden receives a text message: "Flash sale on premium bike lights - huge discount but ONLY 10 MINUTES LEFT!" Why is the offer rushing him?
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Aiden so he won't stop to think if he really wants to spend his money on it. Try again!
```


#### Generated-m1-l1.ts (string)

```
To trick his brain into buying fast without thinking.
```


#### Generated-m1-l1.ts (string)

```
Because the company genuinely cares about Aiden's safety.
```


#### Generated-m1-l1.ts (string)

```
If Aiden had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Aiden can think if he really needs the item right now.
```


#### Generated-m1-l1.ts (string)

```
Aiden walked away from the impulsive offer and kept his money exactly where it belongs: in his pocket.
```



#### templates/lesson-authoring/Generated-m1-l2.ts

#### Generated-m1-l2.ts (string)

```
Module 1 · Lesson 2 · Needs vs Wants Sort
```


#### Generated-m1-l2.ts (string)

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```


#### Generated-m1-l2.ts (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```


#### Generated-m1-l2.ts (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'
```


#### Generated-m1-l2.ts (string)

```
Phone Case Birthday Present
```


#### Generated-m1-l2.ts (string)

```
Replace broken phone cable
```


#### Generated-m1-l2.ts (string)

```
New skin for his favourite game
```


#### Generated-m1-l2.ts (string)

```
Which item is the one Lars 'Needs' to buy before he spends money on what he 'Wants' to buy?
```


#### Generated-m1-l2.ts (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### Generated-m1-l2.ts (string)

```
Don't buy anything - keep the $5.
```


#### Generated-m1-l2.ts (string)

```
Choose something cheaper for $5 to enjoy now.
```


#### Generated-m1-l2.ts (string)

```
Borrow $5 from dad to buy the $10 bottle.
```


#### Generated-m1-l2.ts (string)

```
Nope! That cash is already gone.
```


#### Generated-m1-l2.ts (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy.
```


#### Generated-m1-l2.ts (string)

```
Slide until $20 is locked for the gift.
```



#### templates/lesson-authoring/Generated-m1-l3.ts

#### Generated-m1-l3.ts (string)

```
Keep Some Money Aside
```


#### Generated-m1-l3.ts (string)

```
Module 1 · Lesson 3 · Keep Some Money Aside
```


#### Generated-m1-l3.ts (string)

```
Holly spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Holly's sister crashes out because:
```


#### Generated-m1-l3.ts (string)

```
Holly has no money to buy a new pair
```


#### Generated-m1-l3.ts (string)

```
Holly tries to fix them with sticky tape and now they're even worse
```


#### Generated-m1-l3.ts (string)

```
Haha, maybe. But let's try again.
```


#### Generated-m1-l3.ts (string)

```
Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.
```


#### Generated-m1-l3.ts (string)

```
Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.
```


#### Generated-m1-l3.ts (string)

```
Get your pocket money.
```


#### Generated-m1-l3.ts (string)

```
Move some of that money to your jar for 'Emergencies'.
```


#### Generated-m1-l3.ts (string)

```
Spend what is left on fun.
```


#### Generated-m1-l3.ts (string)

```
Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 toy she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Holly do?
```


#### Generated-m1-l3.ts (string)

```
Buy the toy and save $10 more next week.
```


#### Generated-m1-l3.ts (string)

```
Buy the headphones to fix what she broke first.
```


#### Generated-m1-l3.ts (string)

```
That's a trap! Stick to the plan to avoid stress later.
```


#### Generated-m1-l3.ts (string)

```
Not quite. Let's try again.
```


#### Generated-m1-l3.ts (string)

```
Holly could fix the problem because she had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:
```


#### Generated-m1-l3.ts (string)

```
If I lose something, I can replace it myself.
```


#### Generated-m1-l3.ts (string)

```
I won't have to ask my parents for money if I need something.
```


#### Generated-m1-l3.ts (string)

```
Yes, but take a look at the other options and see if there's a better answer.
```


#### Generated-m1-l3.ts (string)

```
Mia spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Mia's sister crashes out because:
```


#### Generated-m1-l3.ts (string)

```
Haha, maybe. Try again!
```


#### Generated-m1-l3.ts (string)

```
Mia has no money to buy a new pair
```


#### Generated-m1-l3.ts (string)

```
Mia tries to fix them with sticky tape and now they're even worse
```


#### Generated-m1-l3.ts (string)

```
Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.
```


#### Generated-m1-l3.ts (string)

```
Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.
```


#### Generated-m1-l3.ts (string)

```
Move a small amount to your Emergencies jar.
```


#### Generated-m1-l3.ts (string)

```
Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: "I'll spend this $10 now, and I'll just save more next week to buy the headphones." What should Mia do?
```


#### Generated-m1-l3.ts (string)

```
Trap! Fix the headphones first.
```


#### Generated-m1-l3.ts (string)

```
Not quite. Try another combo!
```


#### Generated-m1-l3.ts (string)

```
Mia could fix the problem because she had spare cash. What are the other benefits of not spending all of your money? Select the best answer:
```


#### Generated-m1-l3.ts (string)

```
Good try. One answer covers all of them.
```



#### templates/lesson-authoring/Generated-m1-l4.ts

#### Generated-m1-l4.ts (string)

```
Pause Under Pressure
```


#### Generated-m1-l4.ts (string)

```
Module 1 · Lesson 4 · Pause Under Pressure
```


#### Generated-m1-l4.ts (string)

```
All of Senna's friends are buying a limited-time game skin, but Lars notices that Senna decides to wait with getting one.

What skill is Senna practicing?
```


#### Generated-m1-l4.ts (string)

```
Not quite! Take another look at what Senna is choosing to do.
```


#### Generated-m1-l4.ts (string)

```
Senna explains why he waited: "Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed."

Drag the steps into order.
```


#### Generated-m1-l4.ts (string)

```
Senna sees the one-time offer.
```


#### Generated-m1-l4.ts (string)

```
Senna remembers the price could drop later.
```


#### Generated-m1-l4.ts (string)

```
Senna waits a day and checks again.
```


#### Generated-m1-l4.ts (string)

```
Senna is happy he waited - he can buy the same item for even less.
```


#### Generated-m1-l4.ts (string)

```
Help Lars and Mia sort their thoughts. Which ones are making them rush? And which ones help them pause and think?
```


#### Generated-m1-l4.ts (string)

```
It looks cool, I need it right now!
```


#### Generated-m1-l4.ts (string)

```
Everyone has it, I don't want to be left out.
```


#### Generated-m1-l4.ts (string)

```
It's a 'limited time' offer - I have to buy it now!
```


#### Generated-m1-l4.ts (string)

```
I'll ask my friends if it's actually any good.
```


#### Generated-m1-l4.ts (string)

```
I can wait and get it cheaper later.
```


#### Generated-m1-l4.ts (string)

```
Select which parts of the sign are making Lars rush.
```


#### Generated-m1-l4.ts (string)

```
Not quite - that's just info on the sign, not a pressure trick.
```


#### Generated-m1-l4.ts (string)

```
Lars is playing a game and he gets a limited-time offer to buy extra lives for a discount. Lars remembers Senna's advice. Before he decides whether to spend his money, he stops.

Which questions should Lars ask himself?
```


#### Generated-m1-l4.ts (string)

```
Do I really need this, instead of saving the money for something else?
```


#### Generated-m1-l4.ts (string)

```
Do I really want this right now, or is something trying to make me rush?
```


#### Generated-m1-l4.ts (string)

```
Not quite! That button is trying to do the thinking for you. Don't let it!
```


#### Generated-m1-l4.ts (string)

```
Look again at what Senna is choosing to do.
```


#### Generated-m1-l4.ts (string)

```
That button wants to think for you. Skip it!
```



#### templates/lesson-authoring/Generated-m1-l5.ts

#### Generated-m1-l5.ts (string)

```
The birthday discount
```


#### Generated-m1-l5.ts (string)

```
Module 1 · Lesson 5 · The birthday discount
```


#### Generated-m1-l5.ts (string)

```
It is Immi's birthday. The local gelato store offers a birthday discount. Immi wants Holly to come with her and get one too. Going along so she is not left out is a
```


#### Generated-m1-l5.ts (string)

```
A limited time offer does not make it a 'need'.
```


#### Generated-m1-l5.ts media (media)

```
Holly-happy.webp
```


#### Generated-m1-l5.ts (string)

```
The birthday discount is only on today. Holly is saving for an exchange trip overseas and can't really afford the gelato. What should she do?
```


#### Generated-m1-l5.ts (string)

```
Skip buying her own gelato and ask Immi to share hers.
```


#### Generated-m1-l5.ts (string)

```
Buy her own because the deal is only on today
```


#### Generated-m1-l5.ts (string)

```
The money for the exchange trip is the 'need'. The gelato is the 'want'.
```


#### Generated-m1-l5.ts (string)

```
The gelato is a 'need' because the deal is only available today.
```


#### Generated-m1-l5.ts (string)

```
A limited time offer does not turn a 'want' into a 'need'.
```


#### Generated-m1-l5.ts media (media)

```
Aiden-happy.webp
```


#### Generated-m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Holly right now?
```


#### Generated-m1-l5.ts (string)

```
Holly does not want to feel left out, but the birthday deal expires today. What now?
```


#### Generated-m1-l5.ts (string)

```
Share a gelato and keep at least half of what she would otherwise have spent.
```


#### Generated-m1-l5.ts (string)

```
Buy one so she isn't the odd one out
```


#### Generated-m1-l5.ts media (media)

```
Holly-thinking.webp
```


#### Generated-m1-l5.ts (string)

```
Put these in the order Holly should try. Best first.
```


#### Generated-m1-l5.ts (string)

```
Ask if this is a 'want' or a 'need'
```


#### Generated-m1-l5.ts (string)

```
Share a gelato with Immi
```


#### Generated-m1-l5.ts (string)

```
Buy her own because it is only today
```


#### Generated-m1-l5.ts (string)

```
Immi was happy to share the gelato without Holly having to pay for it. Holly stays on track with saving for her big trip.
```


#### Generated-m1-l5.ts (string)

```
It is Senna's birthday. The local gelato store offers a birthday discount. Senna wants Lars to come with him and get one too. Going along so he is not left out is a
```


#### Generated-m1-l5.ts media (media)

```
lars-happy.webp
```


#### Generated-m1-l5.ts (string)

```
The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?
```


#### Generated-m1-l5.ts (string)

```
The bike parts are the 'need'. The gelato is the 'want'.
```


#### Generated-m1-l5.ts (string)

```
Skip buying his own gelato and ask Senna to share his.
```


#### Generated-m1-l5.ts (string)

```
Buy his own because the deal is only on today
```


#### Generated-m1-l5.ts media (media)

```
lars-questioning.webp
```


#### Generated-m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Lars right now?
```


#### Generated-m1-l5.ts (string)

```
New helmet for the race
```


#### Generated-m1-l5.ts (string)

```
Race registration fee
```


#### Generated-m1-l5.ts (string)

```
Lars does not want to feel left out, but the birthday deal expires today. What now?
```


#### Generated-m1-l5.ts (string)

```
Share a gelato and keep at least half of what he would otherwise have spent.
```


#### Generated-m1-l5.ts (string)

```
Buy one so he isn't the odd one out
```


#### Generated-m1-l5.ts media (media)

```
lars-thinking.webp
```


#### Generated-m1-l5.ts (string)

```
Put these in the order Lars should try. Best first.
```


#### Generated-m1-l5.ts (string)

```
Share a gelato with Senna
```


#### Generated-m1-l5.ts (string)

```
Buy his own because it is only today
```


#### Generated-m1-l5.ts (string)

```
Senna was happy to share the gelato without Lars having to pay for it. Lars can buy what he needs for his race.
```


#### Generated-m1-l5.ts (string)

```
It is Immi's birthday. The local gelato store offers a birthday discount. She wants Aiden to come with her and get one too. Going along so he is not left out is a
```


#### Generated-m1-l5.ts (string)

```
The birthday discount is only on today. Aiden is saving for a gap year and doesn't really want to spend the money on gelato. What should he do?
```


#### Generated-m1-l5.ts (string)

```
The money for the gap year is the 'need'. The gelato is the 'want'.
```


#### Generated-m1-l5.ts (string)

```
Skip buying his own gelato and ask Immi to share hers.
```


#### Generated-m1-l5.ts media (media)

```
Aiden-questioning.webp
```


#### Generated-m1-l5.ts (string)

```
Sort the items in the correct bucket. Is it a 'want' or a 'need' for Aiden right now?
```


#### Generated-m1-l5.ts (string)

```
Aiden does not want to feel left out, but the birthday deal expires today. What now?
```


#### Generated-m1-l5.ts media (media)

```
Aiden-thinking.webp
```


#### Generated-m1-l5.ts (string)

```
Put these in the order Aiden should try. Best first.
```


#### Generated-m1-l5.ts (string)

```
Immi was happy to share the gelato without Aiden having to pay for it. Aiden stays on track with saving for his big trip.
```



#### templates/lesson-authoring/INSTRUCTIONS.md

#### INSTRUCTIONS.md (string)

```
Copy Into Game Settings
```


#### INSTRUCTIONS.md media (media)

```
lars-mia-walking.webp
```


#### INSTRUCTIONS.md (string)

```
text
OPTIONS: Spent | Saved | Hidden
CORRECT: Spent
[explorer]
BONUS: 0
[maverick]
BONUS: 50
```


#### INSTRUCTIONS.md (string)

```


---

## Step 3 — Game Settings cheat sheet

Open **
```


#### INSTRUCTIONS.md (string)

```
** — column **"Copy Into Game Settings"** has ready-to-paste blocks for every game.

**Built and ready today:** Word Drop, Two Choices, Multiple Choice, True False, Tap to Reveal, Drag Sort, Speed Choice, Scenario Fork, Pick One Rounds, Hold Button, Celebration, Budget Checkboxes, Budget Slider, Rank Choices, Gift Reveal.

**Coming soon** (import works; dev wires UI once): Tap Pairs, Pipeline Leak Monitor, Error Eliminator, Market Clock, Balance Scale, and others from Appendix B.

**Item lines** (Tap to Reveal, Drag Sort):
```


#### INSTRUCTIONS.md (string)

```
text
ITEMS:
SHORT: 🧪 Slime kit
LONG: 🧥 Hoodie
```


#### INSTRUCTIONS.md (string)

```


Use **WANT** / **NEED** instead of SHORT / LONG for needs-vs-wants lessons.

**Choices** (Two Choices, Speed Choice, Scenario Fork):
```


#### INSTRUCTIONS.md (string)

```
text
CHOICE A: Correct or first option
CHOICE B: Other option
CORRECT: A
STYLE: banner
```


#### INSTRUCTIONS.md (string)

```


**Multiple Choice** (any number of options; letters in CORRECT are all right answers):
```


#### INSTRUCTIONS.md (string)

```
text
CHOICE A: First option
CHOICE B: Second option
CHOICE C: Third option
CHOICE D: Fourth option
CORRECT: A, B, C
```


#### INSTRUCTIONS.md (string)

```


---

## Step 4 — Generate preview
```


#### INSTRUCTIONS.md (string)

```
bash
npm run lesson:import -- "path/to/your/lesson-folder"
```


#### INSTRUCTIONS.md (string)

```
** inside your folder — safe preview, does not change the live app.

Developers add
```


#### INSTRUCTIONS.md (string)

```
 to put the file in the app, then register it once.

**No command line?** Send your folder to dev or paste CSV content in Cursor:
> “Import this as Module 1 Lesson 3”

---

## Checklist before you send

- [ ] 8 rows in Screens.csv
- [ ] Pathfinder Character chosen
- [ ] Pathfinder Text on every story screen
- [ ] Explorer / Maverick text only where stories differ
- [ ] Game Settings filled on interactive screens (not Screen 8)
- [ ] Game Type names match
```


#### INSTRUCTIONS.md (string)

```
 exactly (copy-paste)
- [ ] Screen 8 =
```


#### INSTRUCTIONS.md (string)

```


---

## Example

See **
```


#### INSTRUCTIONS.md (string)

```
** — Module 1 Lesson 1 filled out with the new columns. Compare side-by-side while you write.

---

## Explorer workbook import (Module 1, Lars copy)

For the **Explorer Phase 1** spreadsheet (8 columns: Objective, Game Archetype, Simple Screen Text, The Action, Content for game, Error message):
```


#### INSTRUCTIONS.md (string)

```
bash
npm run lesson:import:explorer
```


#### INSTRUCTIONS.md (string)

```
 from Downloads (or bundled CSV in
```


#### INSTRUCTIONS.md (string)

```
).
- Writes declarative JSON + TS to
```


#### INSTRUCTIONS.md (string)

```
.
- Lessons 3–4 auto-mark
```


#### INSTRUCTIONS.md (string)

```
 until detailed rows replace placeholder game IDs.

Each imported screen includes
```


#### INSTRUCTIONS.md (string)

```
 (spreadsheet columns) and
```


#### INSTRUCTIONS.md (string)

```
 (when Next unlocks / validation rules).

---

## What you never touch

TypeScript, React, or files in
```


#### INSTRUCTIONS.md (string)

```
 — unless a developer runs
```



#### templates/lesson-authoring/Lesson-Details.csv

No old-only strings.


#### templates/lesson-authoring/Screens.csv

#### Screens.csv (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be ______ right away!
```


#### Screens.csv (string)

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be ______ right away!
```


#### Screens.csv (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...
```


#### Screens.csv (string)

```
Aiden buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first, but a few hours later...
```


#### Screens.csv (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### Screens.csv (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### Screens.csv (string)

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```


#### Screens.csv (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### Screens.csv (string)

```
Holly's playing online and a game alert flashes:
```


#### Screens.csv (string)

```
Limited time - new skin 70% off! 15 MINUTES LEFT!
```


#### Screens.csv (string)

```
Later that day Aiden receives a text message:
```


#### Screens.csv (string)

```
Flash sale on premium bike lights - huge discount but ONLY 10 MINUTES LEFT!
```


#### Screens.csv (string)

```
 Why is the offer rushing him?
```


#### Screens.csv (string)

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, by silencing the chat alerts.
```


#### Screens.csv (string)

```
If Aiden had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Aiden can think if he really needs the item right now.
```


#### Screens.csv (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin anymore. He kept his money safe to save for a new gaming headset. Congratulations for helping him avoid wasting his money.
```


#### Screens.csv (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```


#### Screens.csv (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy.
```


#### Screens.csv (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'
```


#### Screens.csv (string)

```
Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!
```


#### Screens.csv (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### Screens.csv (string)

```
Haha, maybe. Try again!
```


#### Screens.csv (string)

```
Haha, maybe. But let's try again.
```


#### Screens.csv (string)

```
Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.
```


#### Screens.csv (string)

```
Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.
```


#### Screens.csv (string)

```
Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks:
```


#### Screens.csv (string)

```
I'll spend this $10 now, and I'll just save more next week to buy the headphones.
```


#### Screens.csv (string)

```
Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 toy she wants and thinks:
```


#### Screens.csv (string)

```
Yes, but take a look at the other options and see if there's a better answer.
```


#### Screens.csv (string)

```
Senna explains why he waited:
```


#### Screens.csv (string)

```
Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed.
```


#### Screens.csv (string)

```
Not quite - that's just info on the sign, not a pressure trick.
```


#### Screens.csv (string)

```
Lars is at a local bike event, and he sees the sign he's been waiting for: 'Learn to Wheelie - 30 Minute Workshop: $20.' To afford the Wheelie Workshop, Lars had to say 'no' to a few things over the last two weeks. Drag the three items Lars didn't buy into the 'Things Lars didn't buy' box to reach his $20 goal.
```


#### Screens.csv (string)

```
The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?
```


#### Screens.csv (string)

```
Lars does not want to feel left out, but the birthday deal expires today. What now?
```


#### Screens.csv (string)

```
Holly does not want to feel left out, but the birthday deal expires today. What now?
```


#### Screens.csv (string)

```
Aiden does not want to feel left out, but the birthday deal expires today. What now?
```



#### templates/lesson-authoring/example-m1-l1/Generated-m1-l1.ts

#### Generated-m1-l1.ts (string)

```
Module 1 · Lesson 1 · Money In Money Out
```


#### Generated-m1-l1.ts (string)

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Holly's friends are showing off — what's her brain pushing her to do with that $25?
```


#### Generated-m1-l1.ts (string)

```
Holly gets her eyelashes done right away with the $25 but ten minutes later...
```


#### Generated-m1-l1.ts (string)

```
...the initial excitement fades and her $25 is gone.
```


#### Generated-m1-l1.ts (string)

```
...her $25 magically reappears in her wallet.
```


#### Generated-m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### Generated-m1-l1.ts (string)

```
Holly's $25 is gone and she only had a few minutes of excitement. Tap these items to see the difference between short fun and longer fun!
```


#### Generated-m1-l1.ts (string)

```
Glow-in-the-dark slime kit
```


#### Generated-m1-l1.ts (string)

```
Your turn! Sort these items into the correct bucket.
```


#### Generated-m1-l1.ts (string)

```
Holly's playing online and a game alert flashes: "Limited time - new skin 70% off! 15 MINUTES LEFT!" Why is the game rushing her?
```


#### Generated-m1-l1.ts (string)

```
To stop her from pausing to decide if she really needs it.
```


#### Generated-m1-l1.ts (string)

```
Because they want to make sure she gets a good deal.
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Holly so she won't stop to think if she really wants to spend her money on it. Try again!
```


#### Generated-m1-l1.ts (string)

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, but silencing the chat alerts.
```


#### Generated-m1-l1.ts (string)

```
Thank you! Holly's had time to think.
```


#### Generated-m1-l1.ts (string)

```
Holly chooses to keep her money instead of giving in to the rush. Tap to collect bonus 50 XP for successfully staying in control of spending.
```


#### Generated-m1-l1.ts (string)

```
[ COLLECT 50 XP BONUS ]
```


#### Generated-m1-l1.ts (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### Generated-m1-l1.ts (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy but ten minutes later...
```


#### Generated-m1-l1.ts (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### Generated-m1-l1.ts (string)

```
...his $20 cash magically reappears.
```


#### Generated-m1-l1.ts (string)

```
Lars's money is gone and he only had 10 minutes of fun. Tap these items to see the difference!
```


#### Generated-m1-l1.ts (string)

```
Cheap glow sticks / LED toys
```


#### Generated-m1-l1.ts (string)

```
Wireless speaker for hangouts
```


#### Generated-m1-l1.ts (string)

```
Journal + good pen set
```


#### Generated-m1-l1.ts (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### Generated-m1-l1.ts (string)

```
Because the game creators love him.
```


#### Generated-m1-l1.ts (string)

```
Don't tap buy! Stop the rush with a 24-Hour Buy Freeze. Give your brain time to cool down.
```


#### Generated-m1-l1.ts (string)

```
Success! Lars has to wait 24 hours.
```


#### Generated-m1-l1.ts (string)

```
The freeze worked! The next morning Lars realized he didn't even want that skin anymore. He kept his money safe to save for a new gaming headset.
```


#### Generated-m1-l1.ts (string)

```
Dash just got $40 cash from a quick delivery gig. He opens the marketplace app and sees the exact wireless earbuds he's been tracking. His brain tricks him into thinking the cash must be
```


#### Generated-m1-l1.ts (string)

```
Not quite! Dash spotted those earbuds — what's his brain pushing him to do with that $40?
```


#### Generated-m1-l1.ts (string)

```
Dash buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first but a few hours later...
```


#### Generated-m1-l1.ts (string)

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```


#### Generated-m1-l1.ts (string)

```
...the thrill starts to wear off and his $40 is spent.
```


#### Generated-m1-l1.ts (string)

```
...the seller gives him his money back because he bought them so quickly.
```


#### Generated-m1-l1.ts (string)

```
Dash's $40 is gone after buying the earbuds and he only had a short burst of satisfaction. Tap these items to see the difference between things that give short fun and things that give more fun for longer!
```


#### Generated-m1-l1.ts (string)

```
Energy drink + snack
```


#### Generated-m1-l1.ts (string)

```
Scratch-it lottery ticket
```


#### Generated-m1-l1.ts (string)

```
Multi-tool / pocket knife
```


#### Generated-m1-l1.ts (string)

```
Bubble tea with all the toppings
```


#### Generated-m1-l1.ts (string)

```
Later that day Dash receives a text message: "Flash sale on premium bike lights – huge discount but ONLY 10 MINUTES LEFT!" Why is the offer rushing him?
```


#### Generated-m1-l1.ts (string)

```
Don't fall for the countdown! They're rushing Dash so he won't stop to think if he really wants to spend his money on it. Try again!
```


#### Generated-m1-l1.ts (string)

```
To trick his brain into buying fast without thinking.
```


#### Generated-m1-l1.ts (string)

```
Because the company genuinely cares about Dash's safety.
```


#### Generated-m1-l1.ts (string)

```
If dash had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Dash can decide if he really needs the item right now.
```


#### Generated-m1-l1.ts (string)

```
Dash pauses and realizes: 'It's just a flash sale. I don't really need this right now and there will always be another deal.'
```


#### Generated-m1-l1.ts (string)

```
Dash walked away from the impulsive offer and kept his money exactly where it belongs: in his pocket.
```



#### templates/lesson-authoring/example-m1-l1/Lesson-Details.csv

No old-only strings.


#### templates/lesson-authoring/example-m1-l1/Screens.csv

#### Screens.csv (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be ______ right away!
```


#### Screens.csv (string)

```
Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be ______ right away!
```


#### Screens.csv (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### Screens.csv (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again!
```


#### Screens.csv (string)

```
If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!
```


#### Screens.csv (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### Screens.csv (string)

```
Holly's playing online and a game alert flashes:
```


#### Screens.csv (string)

```
Limited time - new skin 70% off! 15 MINUTES LEFT!
```


#### Screens.csv (string)

```
Later that day Dash receives a text message:
```


#### Screens.csv (string)

```
Flash sale on premium bike lights – huge discount but ONLY 10 MINUTES LEFT!
```


#### Screens.csv (string)

```
 Why is the offer rushing him?
```


#### Screens.csv (string)

```
Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, but silencing the chat alerts.
```


#### Screens.csv (string)

```
If dash had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Dash can decide if he really needs the item right now.
```



#### templates/lesson-authoring/explorer-m1/README.md

#### README.md (string)

```
Explorer M1 Lessons 1-4.xlsx
```


#### README.md (string)

```
explorer-phase-1.csv
```


#### README.md (string)

```
(older lesson scaffold workbook filename; the archived README has the original file name)
```



#### templates/lesson-authoring/explorer-m1/explorer-phase-1.csv

#### explorer-phase-1.csv (string)

```
Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be [ ______ ] right away!
```


#### explorer-phase-1.csv (string)

```
Not quite! Look how fast Lars is running - what is his brain telling him to do?
```


#### explorer-phase-1.csv (string)

```
Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...
```


#### explorer-phase-1.csv (string)

```
If only! In the real world, once you trade your cash, it's gone. Try again.
```


#### explorer-phase-1.csv (string)

```
Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
```


#### explorer-phase-1.csv (string)

```
Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.
```


#### explorer-phase-1.csv (string)

```
Release too soon! Hold the button to start the 24-hour freeze.
```


#### explorer-phase-1.csv (string)

```
The freeze worked! The next morning, Lars realized he didn't even want that skin anymore. He kept his money safe to save for a new gaming headset. Congratulations for helping him avoid wasting his money.
```


#### explorer-phase-1.csv (string)

```
Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.
```


#### explorer-phase-1.csv (string)

```
Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!
```


#### explorer-phase-1.csv (string)

```
Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'
```


#### explorer-phase-1.csv (string)

```
Uncheck the item you don't really 'need'.
```


#### explorer-phase-1.csv (string)

```
Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!
```


#### explorer-phase-1.csv (string)

```
Drag the choices in the correct order, starting with what would be best for Lars to do.
```


#### explorer-phase-1.csv (string)

```
Not quite! Borrowing money creates debt — put this option at the bottom.
```



#### templates/lesson-authoring/explorer-m1/lesson-scaffold.csv

No old-only strings.


#### templates/lesson-authoring/m1-l5/Lesson-Details.csv

No old-only strings.


#### templates/lesson-authoring/m1-l5/Screens.csv

#### Screens.csv (string)

```
The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?
```


#### Screens.csv (string)

```
Lars does not want to feel left out, but the birthday deal expires today. What now?
```


#### Screens.csv (string)

```
Holly does not want to feel left out, but the birthday deal expires today. What now?
```


#### Screens.csv (string)

```
Aiden does not want to feel left out, but the birthday deal expires today. What now?
```


#### Screens.csv (string)

```
Name it a 'want' or 'need', then share, then buy.
```



### Old-only catalog counts

- Lesson-Details.csv: 6 old-only fields or strings

- Screens1.csv: 539 old-only fields or strings

- intro.json: 2 old-only fields or strings

- lessons.json: 32 old-only fields or strings

- lib/academy/lessons/content/_template.ts: 42 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l1.json: 54 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l1.ts: 54 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l2.json: 81 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l2.ts: 81 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l3.draft.json: 18 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l3.draft.ts: 18 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l3.json: 51 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l3.ts: 51 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l4.draft.json: 18 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l4.draft.ts: 18 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l4.json: 61 old-only fields or strings

- lib/academy/lessons/content/data/explorer/m1-l4.ts: 61 old-only fields or strings

- lib/academy/lessons/content/m1-l1.ts: 57 old-only fields or strings

- lib/academy/lessons/content/m1-l2.ts: 53 old-only fields or strings

- lib/academy/lessons/content/m1-l3.ts: 60 old-only fields or strings

- lib/academy/lessons/content/m1-l4.ts: 54 old-only fields or strings

- lib/academy/lessons/content/m1-l5.ts: 50 old-only fields or strings

- narration.csv: 13 old-only fields or strings

- templates/lesson-authoring/Characters.csv: 10 old-only fields or strings

- templates/lesson-authoring/Generated-m1-l1.ts: 51 old-only fields or strings

- templates/lesson-authoring/Generated-m1-l2.ts: 15 old-only fields or strings

- templates/lesson-authoring/Generated-m1-l3.ts: 32 old-only fields or strings

- templates/lesson-authoring/Generated-m1-l4.ts: 23 old-only fields or strings

- templates/lesson-authoring/Generated-m1-l5.ts: 50 old-only fields or strings

- templates/lesson-authoring/INSTRUCTIONS.md: 25 old-only fields or strings

- templates/lesson-authoring/Screens.csv: 37 old-only fields or strings

- templates/lesson-authoring/example-m1-l1/Generated-m1-l1.ts: 51 old-only fields or strings

- templates/lesson-authoring/example-m1-l1/Screens.csv: 13 old-only fields or strings

- templates/lesson-authoring/explorer-m1/README.md: 3 old-only fields or strings

- templates/lesson-authoring/explorer-m1/explorer-phase-1.csv: 15 old-only fields or strings

- templates/lesson-authoring/m1-l5/Screens.csv: 5 old-only fields or strings

- workbook.xlsx M1: 20 old-only fields or strings

- Unique old-only values across sources: 909
