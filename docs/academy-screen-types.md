# Academy lesson screen types

**Single source of truth** for Academy lesson screens — layout, typography, feedback, illustrations, advance rules, and every registered `type` string.

When authoring a new lesson screen or reviewing UI work, say: **“Follow `docs/academy-screen-types.md`.”**  
The design shell (`/dashboard/academy/lesson/shell`, milestone `9001`) is the live QA reference for these locked rules.

**Related code**

| Area | Location |
|------|----------|
| Type definitions | `lib/academy/lessons/types/screens/` |
| Screen adapters | `components/academy/lesson/screens/` |
| Game engines | `components/academy/lesson/lesson-*-game.tsx` |
| Shared tokens & feedback | `components/academy/lesson/lesson-shared-styles.ts` |
| Shared UI | `components/academy/lesson/lesson-ui.tsx`, `lesson-design-system.ts` |
| Renderer registry | `components/academy/lesson/lesson-screen-renderer.tsx` |
| Design shell content | `lib/academy/lessons/content/design-shell.ts` |
| Pedagogical stage map | `lib/academy/lessons/spreadsheet-schema.ts` (`SCREEN_INDEX_TO_STAGE`) |

All screen configs extend `WithDeclarative` (`lib/academy/lessons/types/declarative.ts`) with optional `authoring`, `advance`, and `illustration`.

---

## Global locked rules

These rules apply to **every** lesson unless a type-specific section below says otherwise. They match the current design shell.

### Typography scale

Use the shared tokens in `lesson-shared-styles.ts`. **Never scale option text above the prompt.**

| Role | Tailwind / token | Used for |
|------|------------------|----------|
| **Prompt / instructional text** | `text-lg font-medium` — `lessonPromptClass`, `lessonInstructionClass`, `lessonIntroClass()` | Main question, intro copy, narrative |
| **Section / column titles** | `text-base font-semibold uppercase tracking-wide` — `LessonColumnLabel`, `lessonEyebrowClass` | “Round 1 of 3”, bucket labels, match columns, wallet label |
| **Option / answer text** | `text-base font-medium` — `lessonOptionTextClass`, interactive card classes | Choices, sort rows, match cells, budget item labels — **never larger than prompt** |
| **Feedback banners** | `text-base font-medium` — `lessonSuccessMessageClass`, `lessonErrorBannerClass` | Success strip, trap toast, inline errors |
| **Next / Submit / Claim** | `text-lg font-semibold` — `lessonNextButtonClass`, `lessonSubmitAnswerClass`, `lessonGoldClaimClass` | Footer actions |
| **Sort / tap icon emojis** | `lessonIconEmojiClass` (circles), `lessonSortItemEmojiClass` (inline cards) | Tap-reveal, bucket-sort, statement-sort — one locked size, no smaller variants |
| **Steps-row pool cards** | Text only in full-width cards; scene emoji in `LessonIllustrationSlot` | Vertical pool (top) + numbered slots (bottom); numbers outside slots |

### Illustrations

Illustrations are **optional** per screen via `illustration?: { emoji?, label?, alt? }` on the screen config. Rendered by `LessonIllustrationSlot` below lesson chrome, above prompt copy.

**Omit by default on dense screens** (preserve vertical space; avoid scrolling to reach Next):

- `bucket-sort` — `statement-sort`, `spent-total` ( **`steps-row` uses illustration for scene emoji** — pool cards are text-only)
- `rank-order`
- `link-match`
- `savings-goal`
- `budget-select`
- `spotlight-rounds`
- `allocation-slider`
- `completion`

**Allowed on lighter screens** (use when a scene helps the hook or narrative):

- `word-drop`
- `multiple-choice` (legacy alias: `binary-choice`)
- `true-false`
- `hold-to-fill`
- `drag-to-target`
- `narrative-bonus`

`tap-reveal` and other interaction-heavy types should also omit illustrations unless a scene is essential.

### Feedback (global)

Every incorrect user action must produce **clear red feedback**. Wrong answers **never** receive a success tick.

| Outcome | Visual treatment |
|---------|------------------|
| **Correct** | Green border + green ✓ (`LessonChoiceIndicator`, `resolveChoiceVariant(..., true)`) |
| **Incorrect** | Red border + red ✕ / red flash — `lessonWrongSelectionChipClass`, `signalLessonIncorrectAnswer()` screen ring flash |
| **Screen flash** | Lesson root gets `ring-4 ring-[#E11D48]/70` on error, `ring-[#22C55E]/70` on success (~450 ms) |

Applies to pills, radio lists, icon options, and persistent error toasts. Only the **chosen** option shows correct/wrong styling — unchosen options stay neutral.

### Lesson chrome & layout

- **Minimal chrome:** lives (3 hearts), slim progress bar, optional XP chip — `AcademyLessonShell`
- **No forced scrolling to reach Next:** dense screen types compress layout; content area may scroll internally but the footer Next button stays visible without scrolling the page
- **Next** is disabled until the screen is marked ready (`markScreenReady`) or an explicit advance override applies
- **Last screen:** footer shows **Cash In / Collect Points** (`lessonGoldClaimClass`), not Next

### Locked interaction behaviours

| Type | Locked behaviour |
|------|------------------|
| **`link-match`** (Tap-and-Pair) | Tap left event → solid cyan highlight persists. Tap matching right benefit → pair locks with a **distinct solid brand colour** (each pair a different colour). Wrong pair → clear both selections + red screen flash. No submit button. |
| **`rank-order`** | Rank numbers (`1`, `2`, …) sit **outside** the draggable cards in a dedicated column — not inside the pill. Submit validates full order. |
| **`drag-to-target`** | Emoji/icon stack is the **direct drag source** — no outer tile wrapper around the draggable coins/icons. |
| **`budget-select`** | Checkboxes sit **outside** item tiles. **Next only when** the selected set **exactly matches** `correctIds` **and** total spend ≤ `total`. Wrong or partial selection keeps Next disabled; unchecking after success clears ready state. Advance: `on-complete` (never `auto-ready`). |
| **`spotlight-rounds`** | Wrong pick gets red treatment only — **never a green tick**. After ~450 ms the round recovers (choice clears) so the user can retry; screen must not freeze. |
| **`narrative-bonus`** | When `bonusXp > 0`, the award/claim button **awards XP and advances in one tap** (`markScreenReady` + `handleNext`). |
| **`bucket-sort` / `statement-sort`** | Bucket headers use **neutral** surfaces — no rush/think red/green bucket tints on the header row. Statement pool shows **all cards without internal scroll**. |

---

## Registered type strings

Exact `type` values in `ScreenConfig`. There is **no** `"drag-and-sort"` or `"slider"` type — those map to the types below. `binary-choice` is a legacy alias of `multiple-choice`.

| # | `type` string | Adapter | Game engine |
|---|---------------|---------|-------------|
| 1 | `word-drop` | `WordDropScreen` | `LessonWordDropGame` |
| 2 | `multiple-choice` | `MultipleChoiceScreen` | — |
| 3 | `true-false` | `TrueFalseScreen` | — |
| 4 | `tap-reveal` | `TapRevealScreen` | — |
| 5 | `bucket-sort` | `BucketSortScreen` | `LessonBucketSortGame` or `LessonSequenceSortGame` |
| 6 | `link-match` | `LinkMatchScreen` | `LessonLinkMatchGame` |
| 7 | `rank-order` | `RankOrderScreen` | `LessonRankOrderGame` |
| 8 | `spotlight-rounds` | `SpotlightRoundsScreen` | — |
| 9 | `hold-to-fill` | `HoldToFillScreen` | — |
| 10 | `drag-to-target` | `DragToTargetScreen` | `LessonDragToTargetGame` |
| 11 | `savings-goal` | `SavingsGoalScreen` | `LessonSavingsGoalGame` |
| 12 | `allocation-slider` | `AllocationSliderScreen` | `LessonAllocationSliderGame` |
| 13 | `budget-select` | `BudgetSelectScreen` | `LessonBudgetSelectGame` |
| 14 | `narrative-bonus` | `NarrativeBonusScreen` | — |
| 15 | `completion` | `CompletionScreen` | — |
| 16 | `custom` | *(null in registry)* | Lesson-specific via `renderer` key |

Audit helper: `REGISTERED_LESSON_SCREEN_TYPES` in `lesson-screen-renderer.tsx`.

---

## Standard 8-screen pedagogical map

Default lesson scaffold (`lib/academy/lessons/content/_template.ts`):

| Screen | Stage | Workbook archetype | Default `type` |
|--------|-------|--------------------|----------------|
| 1 | Hook | Fill-the-Blank Drop | `word-drop` |
| 2 | Core | Sentence Finisher | `multiple-choice` |
| 3 | Core | Flash Tap | `tap-reveal` |
| 4 | Core | Sorting Game | `bucket-sort` |
| 5 | Apply | Quick Choice (trap) | `multiple-choice` |
| 6 | Apply | 24-Hour Freeze | `hold-to-fill` |
| 7 | Reward | Celebration | `narrative-bonus` |
| 8 | Close | Lesson Recap | `completion` |

Lessons may swap types by screen (e.g. L2 uses `true-false`, `budget-select`, `rank-order`; L3/L4 add `link-match`, `spent-total`, `drag-to-target`, `savings-goal`).

---

## Type reference

### `word-drop`

**Best for:** Hook — fill-in-the-blank concept drop.

**Illustration:** Allowed.

**Props** (`lib/academy/lessons/types/screens/word-drop.ts`):

| Prop | Purpose |
|------|---------|
| `narrativeBefore` / `narrativeAfter` | Single-blank sentence split around `______` |
| `options` | Word chips |
| `correctOption` | Correct answer (single-blank mode) |
| `wrongError` | Error copy |
| `promptLabel?` | Instruction (default: "Pick the word that fits") |
| `prompt?` + `blanks[]` | Multi-blank variant — `[blank]` tokens; each blank has `options` + `correctOption` |
| `successMessage?`, `choiceFeedback?` | Optional success + feedback style |

**Variants:** Single-blank vs multi-blank (`blanks[]`).

**Advance:** `on-complete`.

---

### `multiple-choice`

**Best for:** Core / Apply — sentence finisher, trap question, single- or multi-select checks.

**Illustration:** Allowed (`imagePlaceholder` for inline scene, or top-level `illustration`).

**Props** (`lib/academy/lessons/types/screens/multiple-choice.ts`):

| Prop | Purpose |
|------|---------|
| `prompt` | Main question |
| `options[]` | Canonical list of `{ label, isCorrect, feedback? }` — any length |
| `optionA`–`optionZ` | Legacy fields used when `options` is omitted |
| `wrongError`, `successMessage?` | Screen-level messages |
| `errorStyle?` | `"inline-red"` or `"banner"` (trap toast) |
| `optionLayout?` | `"buttons"` or `"radio-list"` |
| `lockCorrectSelections?` | Lock correct picks once chosen |
| `wrongInteraction?` | `"persist"` (toggle wrong off) or `"shake"` (transient dud) |
| `scenePrompt?`, `imagePlaceholder?` | Scene + illustration placeholder |
| `choiceFeedback?`, `emphasizeInstruction?` | Visual options |

Legacy type string: `binary-choice` (same template).

**Behaviour variants (same type, different props):**

- **Single choice** — one option has `isCorrect: true`; tap one answer, then Next
- **Multi-correct** — more than one option has `isCorrect: true`; user can select several before Next; Next when all correct are selected and none wrong
- **All of the above** — auto-detected when exactly one correct option’s label matches phrases like “All of the above”; other options show neutral selected state until the catch-all is chosen (no red on individual true statements)
- **Trap / Quick Choice** — `errorStyle: "banner"`
- **Scene + radio-list** — sign-reading layout

**Advance:** `on-complete`.

---

### `true-false`

**Best for:** Hook / early Core — fast fact check.

**Illustration:** Allowed.

**Props:** `prompt`, `correctAnswer: "true" | "false"`, `wrongError`, `promptLabel?`, `choiceFeedback?`, `emphasizeInstruction?`

**Advance:** `on-complete`.

---

### `tap-reveal`

**Best for:** Core — Flash Tap; explore items before sorting.

**Illustration:** Omit by default (dense grid).

**Props** (`lib/academy/lessons/types/screens/tap-reveal.ts`):

| Prop | Purpose |
|------|---------|
| `intro` | Instruction |
| `items[]` | `{ id, label, emoji?, bucket }` — shuffled on mount |
| `buckets[]` | `{ id, label, tone: "short" \| "long" \| "want" \| "need" }` |
| **Item display (locked)** | Emoji in circle + **label below** via `LessonIconOption` / `LessonIconReveal` — all cohorts |
| `selectionFeedback?` | `"neutral"` or `"colored"` |

**Advance:** `all-taps-revealed` or `auto-ready` when no items.

---

### `bucket-sort`

**Best for:** Core / Apply — sorting, triage, sequencing, spent tracking.

**Illustration:** Omit (all layouts).

**Props** (`lib/academy/lessons/types/screens/bucket-sort.ts`):

| Prop | Purpose |
|------|---------|
| `intro`, `title?` | Instruction + optional heading |
| `buckets[]` | `{ id, label, tone?, icon? }` |
| `items[]` | `{ id, label, emoji?, bucket, price?, wrongDropError? }` — **label always shown** (inline with emoji in statement/spent cards) |
| `layout?` | See layout variants below |
| `targetTotal?`, `poolColumnLabel?` | For `spent-total` layout |
| `successMessage?`, `emphasizeInstruction?` | |

**Layout variants (`layout`):**

| Layout | Engine | Use case |
|--------|--------|----------|
| **`statement-sort`** *(default)* | `LessonBucketSortGame` | Full visible pool (no scroll) + two neutral-header buckets |
| **`steps-row`** | `LessonSequenceSortGame` | Vertical stack: shuffled text pool (top) → numbered drop slots (bottom); pool collapses as items are placed |
| **`spent-total`** | `LessonBucketSortGame` | Purchases pool + spent bucket + horizontal priced cards (icon left, name/price right) |
| **`stable-grid`** / **`default`** | `LessonBucketSortGame` | Legacy aliases → `statement-sort` |

Omit `layout` for `statement-sort`. **Locked:** bucket column headers use neutral surfaces, not semantic red/green tints.

**Advance:** `all-items-sorted` or `on-complete`.

---

### `link-match`

**Best for:** Core / Apply — connect events to outcomes (Tap-and-Pair).

**Illustration:** Omit.

**Props:** `intro`, `pairs[]` (`{ id, event, benefit }`), `eventColumnLabel?`, `benefitColumnLabel?`, `wrongError?`, `successMessage?`, `emphasizeInstruction?`

**Locked behaviour:** See [Locked interaction behaviours](#locked-interaction-behaviours) — cyan left selection, distinct pair colours, mismatch flash.

**Advance:** `on-complete` when all pairs locked.

---

### `rank-order`

**Best for:** Apply — full-list drag reorder with Submit.

**Illustration:** Omit.

**Props** (`lib/academy/lessons/types/screens/rank-order.ts`):

| Prop | Purpose |
|------|---------|
| `intro`, `dragHint?`, `axisLabel?` | Instructions |
| `submitLabel?` | Default: "Submit Answer" |
| `items[]` | `{ id, label }` |
| `correctOrder` | Ordered item ids, top → bottom |
| `errors` | Keyed by wrong item id or rule key |
| `successMessage?` | |

**Locked behaviour:** Rank numbers outside cards; Submit validates order.

**Advance:** `on-complete`.

---

### `spotlight-rounds`

**Best for:** Core / Apply — multi-round Pick One challenge.

**Illustration:** Omit.

**Props:** `prompt`, `rounds[]` (`{ iconA, optionA, iconB, optionB, correct: "a"|"b", error }`), `choiceFeedback?`, `emphasizeInstruction?`

**Locked behaviour:** Wrong answer → red only, no tick; auto-recover after ~450 ms.

**Advance:** `spotlight-rounds-complete`.

---

### `hold-to-fill`

**Best for:** Apply — hold-to-freeze / impulse pause.

**Illustration:** Allowed.

**Props:** `narrative`, `holdLabel`, `frozenLabel`, `successMessage`, `holdDurationMs?`, `releaseHint?`

**Advance:** `on-complete` after hold completes.

---

### `drag-to-target`

**Best for:** Apply / Reward — drag from source zone to target (e.g. coins → piggy bank).

**Illustration:** Allowed.

**Props:** `intro`, `sourceLabel`, `targetLabel`, `itemEmoji?`, `coinCount?`, `successMessage`, `emphasizeInstruction?`

**Locked behaviour:** Icons are the direct drag source — no outer tiles.

**Advance:** `on-complete`.

---

### `savings-goal`

**Best for:** Reward — drag skipped purchases into savings; meter fills toward goal.

**Illustration:** Omit.

**Props:** `intro`, `meterLabel`, `targetAmount`, `poolColumnLabel`, `dropZoneLabel`, `items[]`, `workshopSignTitle`, `lockedLabel`, `unlockedLabel`, `goalAchievedLabel`, `successMessage?`, `imagePlaceholder?`, `emphasizeInstruction?`

**Advance:** `on-complete`.

---

### `allocation-slider`

**Best for:** Apply — reserve vs spend split on a continuous slider.

**Illustration:** Omit.

**Props** (`lib/academy/lessons/types/screens/allocation-slider.ts`):

| Prop | Purpose |
|------|---------|
| `intro`, `total`, `targetMin` | Budget cap and minimum reserve |
| `reserveGoals[]` | `{ id, label, amount, emoji? }` |
| `spendItems?` | Optional today-spend items |
| `sliderError`, `successMessage?` | |

**Advance:** `on-complete`.

---

### `budget-select`

**Best for:** Apply — multi-select under a budget cap (needs vs wants).

**Illustration:** Omit.

**Props** (`lib/academy/lessons/types/screens/budget-select.ts`):

| Prop | Purpose |
|------|---------|
| `intro`, `walletLabel?`, `total` | Wallet display + cap |
| `items[]` | `{ id, label, price, emoji? }` |
| `correctIds` | Exact set of ids that must be checked |
| `errors.overBudget`, `errors.wrongSelection`, `errors.itemHints?` | Feedback copy |
| `successMessage?` | |

**Locked behaviour:** Checkboxes outside tiles; exact-set + budget gate for Next. See [Locked interaction behaviours](#locked-interaction-behaviours).

**Advance:** **`on-complete` only** — never `auto-ready`.

---

### `narrative-bonus`

**Best for:** Reward — resolution + optional bonus XP.

**Illustration:** Allowed.

**Props:** `narrative`, `bonusXp`, `bonusTapLabel`, `successMessage?`, `autoReadyWhenNoBonus?`

**Locked behaviour:** When `bonusXp > 0`, claim button awards XP and advances in one tap.

**Advance:** `auto-ready` when `bonusXp === 0`; otherwise ready after claim.

---

### `completion`

**Best for:** Close — lesson recap / milestone splash.

**Illustration:** Omit.

**Props:** `skillLearnedLabel?`, `pointsLabel?`, `bodyCopy?`, `returnButtonLabel?`, `useStandardPane?`

**Helpers:** `explorerCompletionScreen()`, `teenCompletionScreen({ skillTitle, xpReward })` in `lib/academy/lessons/completion-screen.ts`.

**Footer:** Cash In / Collect Points — not Next.

---

### `custom`

**Best for:** One-off interactions not yet promoted to shared types.

**Props:** `renderer` (string key), `configRef?` (key into lesson `custom` bag)

**M1-L2 remaining custom renderer:**

| `renderer` | Interaction |
|------------|-------------|
| `m1-l2-gift-reveal` | Tap gift reveal (lesson close beat) |

Legacy custom renderers (`m1-l2-budget-wallet`, `m1-l2-reserve-slider`, `m1-l2-rank-stack`) are **superseded** by `budget-select`, `allocation-slider`, and `rank-order`.

Validated via `advance: { mode: "on-complete" }` when the screen marks itself ready.

---

## Advance policies

Common `advance.mode` values (`declarative.ts`):

| Mode | When Next enables |
|------|-------------------|
| `on-complete` | Screen calls `markScreenReady` after success |
| `auto-ready` | Auto on visit (`lesson-runner` effect) — **not for `budget-select`** |
| `manual-next` | Author-controlled |
| `all-taps-revealed` | All tap-reveal items opened |
| `all-items-sorted` | All bucket-sort / sequence items placed |
| `spotlight-rounds-complete` | All spotlight rounds answered correctly |

Screens that become incomplete after success (e.g. `budget-select` uncheck) must call `clearScreenReady`.

---

## Shipped usage (M1 L1–L4)

| `type` | L1 | L2 | L3 | L4 |
|--------|:--:|:--:|:--:|:--:|
| `word-drop` | ✓ | | ✓ | |
| `multiple-choice` | ✓ | | ✓ | ✓ |
| `true-false` | | ✓ | | |
| `tap-reveal` | ✓ | | | |
| `bucket-sort` | ✓ | ✓ | ✓ | ✓ |
| `spotlight-rounds` | | ✓ | | |
| `link-match` | | | ✓ | |
| `rank-order` | | ✓ | | |
| `budget-select` | | ✓ | | |
| `allocation-slider` | | ✓ | | |
| `hold-to-fill` | ✓ | | | |
| `drag-to-target` | | | | ✓ |
| `savings-goal` | | | | ✓ |
| `narrative-bonus` | ✓ | | | |
| `completion` | ✓ | ✓ | ✓ | ✓ |
| `custom` | | ✓ (gift) | | |

---

## Shared design system (not content types)

Reusable UI primitives — not separate `type` strings. Lesson adapters compose these; authors set screen `type` and data fields.

| Component / token | Role |
|-------------------|------|
| `LessonScreenLayout` | Prompt + game area + success banner shell |
| `LessonColumnLabel` | Section / column titles (`text-base font-semibold uppercase tracking-wide`) |
| `LessonChoiceButton` + `LessonChoiceIndicator` | Pill and radio-list answers with ✓/✕ |
| `LessonIconOption` | Circular emoji options (spotlight, tap-reveal) |
| `LessonSortPool`, `LessonSortStatementCard`, `LessonSortBucket` | Statement-sort pool + buckets |
| `LessonSequenceSortBoard` | Step-order (`steps-row`) UI |
| `LessonIllustrationSlot` | Optional scene slot |
| `lesson-shared-styles.ts` | Typography, feedback, choice, and layout tokens |
| `lesson-design-system.ts` | Barrel export |

Fix layout once in these components; future lessons need only content updates.

---

## Adding a new lesson screen

1. **Follow this doc** — typography, illustrations, feedback, and type-specific locked behaviours.
2. Pick the closest `type` from [Registered type strings](#registered-type-strings) (or `custom` if truly one-off).
3. Add a screen object to `lib/academy/lessons/content/m1-l*.ts`, or use spreadsheet import (`templates/lesson-authoring/`).
4. Set `advance.mode` appropriately (`budget-select` → always `on-complete`).
5. Omit `illustration` on dense types unless you have a strong reason.
6. For multi-answer checks, mark more than one option `isCorrect: true` on `multiple-choice` — do not create a new type.
7. For bucket-sort, set `layout` only when not using default `statement-sort`.
8. QA against the design shell (`/dashboard/academy/lesson/shell`) before shipping.
9. If an interaction repeats across lessons, promote a `custom` renderer to a registered type in `lesson-screen-renderer.tsx`.

**Do not add new types for:**

- Multi-select → `multiple-choice` with several `isCorrect: true` options
- Statement / category sort → `bucket-sort` + `statement-sort`
- Step ordering → `bucket-sort` + `steps-row`
- Priced triage → `bucket-sort` + `spent-total`
- Budget cap multi-select → `budget-select`
- Full-list reorder + Submit → `rank-order`
- Reserve slider → `allocation-slider`
- Swipe-to-save → `drag-to-target` or `savings-goal`
- Single / trap MCQ → `multiple-choice` variants
