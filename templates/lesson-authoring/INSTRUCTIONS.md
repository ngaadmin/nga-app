# Lesson Authoring — Start Here

You only edit **two files** in Google Sheets or Excel. No code.

| File | What it is |
|------|------------|
| `Lesson-Details.csv` | Lesson title, characters, XP, skill name |
| `Screens.csv` | 8 screens — game type, story text, game settings |

**Look up (do not edit):** `Characters.csv` · `Game-Types.csv` · `example-m1-l1/` (filled sample)

---

## Quick start (5 minutes)

1. **Copy** `Lesson-Details.csv` + `Screens.csv` into your own folder (e.g. `My Lesson M1-L3`).
2. **Open** both in Google Sheets (File → Import).
3. **Fill** Lesson-Details — pick characters from the table below.
4. **Fill** Screens — one row per screen. Copy game settings from `Game-Types.csv`.
5. **Preview:** `npm run lesson:import -- "path/to/your-folder"`  
   Or send the folder to a developer.

---

## Step 1 — Lesson-Details.csv

| Field | What to enter |
|-------|----------------|
| Module Number | Usually `1` |
| Lesson Number | e.g. `3` |
| Lesson Title | e.g. `Plugging Leaks` |
| Level | Academy level `1`–`6` |
| **Pathfinder Character** | Main teen story (ages 13–15): **Holly**, **Senna**, or **Lucas** |
| **Explorer Character** | Younger story (ages 10–12): **Lars** or **Mia** — default `Lars` |
| **Maverick Character** | Older teen (ages 17+): **Dash**, **Saskia**, or **Immi** — default `Dash` |
| **Support Character** | Optional — **Eva**, **Tom**, or a peer. Use `{support}` in story text. |
| Skill Name | Bronze skill on Screen 8, e.g. `Stop & Think` |
| Skill ID | Ask dev once — e.g. `stop-and-think` |
| Explorer XP | Usually `150` |
| Teen XP | Usually `50` |
| Explorer Perfect Bonus | Usually `50` |

### Character picker

| Name | Age tier | Best for lessons about… |
|------|----------|-------------------------|
| **Lars** | Explorer | Impulse buys, spending fast |
| **Mia** | Explorer | Fair prices, value vs cheap |
| **Holly** | Pathfinder | Peer pressure, social spending |
| **Senna** | Pathfinder | Saving, gifts, scarcity anxiety |
| **Lucas** | Pathfinder | Gaming bets, big risky spends |
| **Dash** | Maverick | Side hustles, marketplace |
| **Saskia** | Maverick | Over-planning, big savings goals |
| **Immi** | Maverick | Parents pay — cost blindness |
| **Eva** | Mentor | Parent / household budgeting voice |
| **Tom** | Mentor | Long-term investing myths |

Full notes: open `Characters.csv`.

**Text shortcuts:** `{character}` = Pathfinder Character · `{support}` = Support Character

---

## Step 2 — Screens.csv

**8 rows. One row = one screen.** Screen 8 is always `Lesson Complete`.

### Columns (left → right)

| Column | Fill when… |
|--------|------------|
| **Screen** | Always — `1` through `8` |
| **Game Type** | Always — copy name from `Game-Types.csv` |
| **Pathfinder Text** | Story / prompt for your Pathfinder character |
| **Explorer Text** | Only if Explorer story differs — else leave blank |
| **Maverick Text** | Only if Maverick story differs — else leave blank |
| **Extra Text** | Screen 1 only — words after the blank (e.g. `right away!`) |
| **Game Settings** | Interactive screens — copy block from `Game-Types.csv` |
| **Explorer Settings** | Only if Explorer needs different items/choices/bonus |
| **Maverick Settings** | Only if Maverick needs different items/choices/bonus |
| **Error Pathfinder** | Wrong-answer message (if screen has wrong answers) |
| **Error Explorer** | Explorer wrong-answer — only if different |
| **Error Maverick** | Maverick wrong-answer — only if different |
| **Notes** | Optional reminders for yourself — ignored by import |

### Rules of thumb

- **Any game on any screen** — you are not locked to Word Drop → Drag Sort → etc. Pick what fits the lesson.
- **Leave blank = same as Pathfinder** for Explorer/Maverick text columns.
- **Game Settings** = one cell, multiple lines (Google Sheets: **Alt+Enter** for new line).
- **Screen 8** — Game Type = `Lesson Complete`, leave everything else blank.

### Optional: tier blocks inside Game Settings

Instead of separate Explorer/Maverick Settings columns, you can use tags in one cell:

```text
OPTIONS: Spent | Saved | Hidden
CORRECT: Spent
[explorer]
BONUS: 0
[maverick]
BONUS: 50
```

---

## Step 3 — Game Settings cheat sheet

Open **`Game-Types.csv`** — column **"Copy Into Game Settings"** has ready-to-paste blocks for every game.

**Built and ready today:** Word Drop, Two Choices, True False, Tap to Reveal, Drag Sort, Speed Choice, Scenario Fork, Pick One Rounds, Hold Button, Celebration, Budget Checkboxes, Budget Slider, Rank Choices, Gift Reveal.

**Coming soon** (import works; dev wires UI once): Tap Pairs, Pipeline Leak Monitor, Error Eliminator, Market Clock, Balance Scale, and others from Appendix B.

**Item lines** (Tap to Reveal, Drag Sort):

```text
ITEMS:
SHORT: 🧪 Slime kit
LONG: 🧥 Hoodie
```

Use **WANT** / **NEED** instead of SHORT / LONG for needs-vs-wants lessons.

**Choices** (Two Choices, Speed Choice, Scenario Fork):

```text
CHOICE A: Correct or first option
CHOICE B: Other option
CORRECT: A
STYLE: banner
```

---

## Step 4 — Generate preview

```bash
npm run lesson:import -- "path/to/your/lesson-folder"
```

Creates **`Generated-m1-l3.ts`** inside your folder — safe preview, does not change the live app.

Developers add `--install` to put the file in the app, then register it once.

**No command line?** Send your folder to dev or paste CSV content in Cursor:
> “Import this as Module 1 Lesson 3”

---

## Checklist before you send

- [ ] 8 rows in Screens.csv
- [ ] Pathfinder Character chosen
- [ ] Pathfinder Text on every story screen
- [ ] Explorer / Maverick text only where stories differ
- [ ] Game Settings filled on interactive screens (not Screen 8)
- [ ] Game Type names match `Game-Types.csv` exactly (copy-paste)
- [ ] Screen 8 = `Lesson Complete`

---

## Example

See **`example-m1-l1/`** — Module 1 Lesson 1 filled out with the new columns. Compare side-by-side while you write.

---

## Explorer workbook import (Module 1, Lars copy)

For the **Explorer Phase 1** spreadsheet (8 columns: Objective, Game Archetype, Simple Screen Text, The Action, Content for game, Error message):

```bash
npm run lesson:import:explorer
```

- Reads `Explorer M1 Lessons 1-4.xlsx` from Downloads (or bundled CSV in `explorer-m1/`).
- Writes declarative JSON + TS to `lib/academy/lessons/content/data/explorer/`.
- Lessons 3–4 auto-mark `_draft: true` until detailed rows replace placeholder game IDs.

Each imported screen includes `authoring` (spreadsheet columns) and `advance` (when Next unlocks / validation rules).

---

## What you never touch

TypeScript, React, or files in `lib/` — unless a developer runs `--install` for you.
