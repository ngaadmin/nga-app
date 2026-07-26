# Academy lesson screen types

Living inventory of standardized screen types in the Academy lesson system. Content authors set the `type` field in lesson screen configs (`lib/academy/lessons/content/*.ts` or spreadsheet import). Renderers are registered in `components/academy/lesson/lesson-screen-renderer.tsx`.

**Related code**

- Type definitions: `lib/academy/lessons/types/screens/`
- Screen adapters: `components/academy/lesson/screens/`
- Shared UI / design system: `components/academy/lesson/lesson-ui.tsx`, `lesson-design-system.ts`
- Pedagogical stage map: `lib/academy/lessons/spreadsheet-schema.ts` (`SCREEN_INDEX_TO_STAGE`)
- Workbook archetype → type map: `GAME_ARCHETYPE_TO_TYPE` in the same file

All screen configs extend `WithDeclarative` (`lib/academy/lessons/types/declarative.ts`) with optional `authoring` metadata and `advance` policy.

---

## Registered type strings

These are the exact `type` values in `ScreenConfig`. There is **no** `"multiple-choice"`, `"drag-and-sort"`, or `"slider"` type — those interactions map to the types below.

| # | `type` string | Adapter component | Game engine (if any) |
|---|---------------|-----------------|----------------------|
| 1 | `word-drop` | `WordDropScreen` | `LessonWordDropGame` |
| 2 | `binary-choice` | `BinaryChoiceScreen` | — |
| 3 | `true-false` | `TrueFalseScreen` | — |
| 4 | `tap-reveal` | `TapRevealScreen` | — |
| 5 | `bucket-sort` | `BucketSortScreen` | `LessonBucketSortGame` or `LessonSequenceSortGame` |
| 6 | `link-match` | `LinkMatchScreen` | `LessonLinkMatchGame` |
| 7 | `rank-order` | `RankOrderScreen` | `LessonRankOrderGame` |
| 8 | `spotlight-rounds` | `SpotlightRoundsScreen` | — |
| 9 | `hold-to-fill` | `HoldToFillScreen` | — |
| 10 | `drag-to-target` | `DragToTargetScreen` | `LessonDragToTargetGame` |
| 11 | `savings-goal` | `SavingsGoalScreen` | — |
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
| 2 | Core | Sentence Finisher | `binary-choice` |
| 3 | Core | Flash Tap | `tap-reveal` |
| 4 | Core | Sorting Game | `bucket-sort` |
| 5 | Apply | Quick Choice (trap) | `binary-choice` |
| 6 | Apply | 24-Hour Freeze | `hold-to-fill` |
| 7 | Reward | Celebration | `narrative-bonus` |
| 8 | Close | Lesson Recap | `completion` |

Lessons may swap types by screen (e.g. L2 uses `true-false` and `custom`; L3/L4 add `link-match`, `spent-total`, `steps-row`, `drag-to-target`, `savings-goal`).

---

## Type reference

### `word-drop`

**Best for:** Screen 1 (Hook) — fill-in-the-blank concept drop.

**Props** (`lib/academy/lessons/types/screens/word-drop.ts`):

| Prop | Purpose |
|------|---------|
| `narrativeBefore` / `narrativeAfter` | Single-blank sentence split around `______` |
| `options` | Word chips |
| `correctOption` | Correct answer (single-blank mode) |
| `wrongError` | Error copy |
| `promptLabel?` | Instruction (default: "Pick the word that fits") |
| `prompt?` + `blanks[]` | **Multi-blank variant** — `[blank]` tokens; each blank has `options` + `correctOption` |
| `successMessage?`, `choiceFeedback?` | Optional success + feedback style |

**Variants:** Single-blank (L1 hook) vs multi-blank (L3 reflection).

---

### `binary-choice`

**Best for:** Screens 2, 5, 6 (Core / Apply) — sentence finisher, trap question, multi-select checks.

**Props** (`lib/academy/lessons/types/screens/binary-choice.ts`):

| Prop | Purpose |
|------|---------|
| `prompt` | Main question |
| `optionA`–`optionE` | `{ label, isCorrect, feedback? }` |
| `wrongError`, `successMessage?` | Screen-level messages |
| `errorStyle?` | `"inline-red"` or `"banner"` (trap toast) |
| `selectionMode?` | `"single"` (default) or `"multi-correct"` |
| `optionLayout?` | `"buttons"` or `"radio-list"` |
| `lockCorrectSelections?` | Lock correct picks once chosen |
| `wrongInteraction?` | `"persist"` (toggle wrong off) or `"shake"` (transient dud) |
| `scenePrompt?`, `imagePlaceholder?` | Scene + illustration placeholder |
| `choiceFeedback?`, `emphasizeInstruction?` | Visual options |

**Behavior variants (same type, different props):**

- **Single choice** — default
- **Multi-correct** — select all correct answers (`selectionMode: "multi-correct"`)
- **Trap / Quick Choice** — `errorStyle: "banner"`
- **Scene + radio-list** — sign-reading with `imagePlaceholder` + `optionLayout: "radio-list"`

Multi-select completion re-evaluates from the **current** selection only (all correct selected, no wrong selected).

---

### `true-false`

**Best for:** Screen 1–2 (Hook / early Core) — fast fact check.

**Props:** `prompt`, `correctAnswer: "true" | "false"`, `wrongError`, `promptLabel?`, `choiceFeedback?`, `emphasizeInstruction?`

---

### `tap-reveal`

**Best for:** Screen 3 (Core) — Flash Tap; explore items before sorting.

**Props** (`lib/academy/lessons/types/screens/tap-reveal.ts`):

| Prop | Purpose |
|------|---------|
| `intro` | Instruction |
| `items[]` | `{ id, label, emoji?, bucket }` |
| `buckets[]` | `{ id, label, tone: "short" \| "long" \| "want" \| "need" }` |
| `tapDisplay?` / `revealDisplay?` | `"emoji-only"`, `"emoji-label"`, `"label"` |
| `tapLayout?` | `"default"` or `"icon-grid"` |
| `selectionFeedback?` | `"neutral"` or `"colored"` |

**Advance:** typically `all-taps-revealed`.

---

### `bucket-sort`

**Best for:** Screen 4 (Core) and apply-phase sorting / triage / sequencing.

**Props** (`lib/academy/lessons/types/screens/bucket-sort.ts`):

| Prop | Purpose |
|------|---------|
| `intro`, `title?` | Instruction + optional heading |
| `buckets[]` | `{ id, label, tone?, icon? }` — see `SortBucket` in `shared-blocks.ts` |
| `items[]` | `{ id, label, emoji?, bucket, price?, wrongDropError? }` |
| `layout?` | See layout variants below |
| `targetTotal?`, `poolColumnLabel?` | For `spent-total` layout |
| `successMessage?`, `emphasizeInstruction?` | |

**Layout variants (`layout`):**

| Layout | Engine | Use case | Shipped in |
|--------|--------|----------|------------|
| **`statement-sort`** *(default)* | `LessonBucketSortGame` | Scrollable pool + two tinted buckets; statement/emoji cards | L1 short/long, L2 want/need, L4 rush/think |
| **`steps-row`** | `LessonSequenceSortGame` | Shuffled pills left → numbered ordered slots right | L3 spare-cash steps, L4 pause-sequence |
| **`spent-total`** | `LessonBucketSortGame` | Purchases pool + single spent bucket + running total bar | L3 spent triage |
| **`stable-grid`** / **`default`** | `LessonBucketSortGame` | Legacy aliases; same rendering as `statement-sort` | Not used in current content |

Omit `layout` to get `statement-sort`. Set `layout: "steps-row"` explicitly for sequence ordering.

**Bucket tones** (optional on `buckets`): `rush`, `think`, `want`, `need`, `short`, `long` — inferred from bucket id when omitted.

---

### `link-match`

**Best for:** Screen 4–5 (Core / Apply) — connect events to outcomes.

**Props:** `intro`, `pairs[]` (`{ id, event, benefit }`), `eventColumnLabel?`, `benefitColumnLabel?`, `wrongError?`, `submitLabel?`, `successMessage?`, `emphasizeInstruction?`

---

### `spotlight-rounds`

**Best for:** Screen 3–5 (Core / Apply) — 3-round Pick One / Spotlight challenge.

**Props:** `prompt`, `rounds[]` (`{ iconA, optionA, iconB, optionB, correct: "a"|"b", error }`), `choiceFeedback?`, `emphasizeInstruction?`

**Advance:** `spotlight-rounds-complete`.

---

### `hold-to-fill`

**Best for:** Screen 6 (Apply) — hold-to-freeze / hold-to-silence impulse pause.

**Props:** `narrative`, `holdLabel`, `frozenLabel`, `successMessage`, `clearOnSuccess?`, `holdDurationMs?`, `releaseHint?`

---

### `drag-to-target`

**Best for:** Screen 6–7 (Apply / Reward) — swipe/drag from source zone to target (e.g. coins → piggy bank).

**Props:** `intro`, `sourceLabel`, `targetLabel`, `itemEmoji?`, `coinCount?`, `successMessage`, `emphasizeInstruction?`

---

### `savings-goal`

**Best for:** Screen 7 (Reward) — drag skipped purchases into savings; meter fills toward goal.

**Props:** `intro`, `meterLabel`, `targetAmount`, `poolColumnLabel`, `dropZoneLabel`, `items[]`, `workshopSignTitle`, `lockedLabel`, `unlockedLabel`, `goalAchievedLabel`, `successMessage?`, `imagePlaceholder?`, `emphasizeInstruction?`

---

### `narrative-bonus`

**Best for:** Screen 7 (Reward / Celebration) — resolution + optional bonus XP tap.

**Props:** `narrative`, `bonusXp`, `bonusTapLabel`, `successMessage?`, `autoReadyWhenNoBonus?`

---

### `completion`

**Best for:** Screen 8 (Close) — lesson recap / milestone splash.

**Props:** `skillLearnedLabel?`, `pointsLabel?`, `bodyCopy?`, `returnButtonLabel?`, `useStandardPane?`

**Helpers:** `explorerCompletionScreen()`, `teenCompletionScreen({ skillTitle, xpReward })` in `lib/academy/lessons/completion-screen.ts`.

---

### `custom`

**Best for:** One-off interactions not yet promoted to shared types. Renderer returns `null`; lesson hooks render bespoke UI.

**Props:** `renderer` (string key), `configRef?` (key into lesson `custom` bag)

**M1-L2 renderers** (`components/academy/lesson/m1-l2-custom-screens.tsx`):

| `renderer` | Interaction | Workbook archetype |
|------------|-------------|-------------------|
| `m1-l2-budget-wallet` | Checkbox items with budget cap | The Budget Balance |
| `m1-l2-reserve-slider` | Allocation range slider | The Allocation Slider |
| `m1-l2-rank-stack` | Full vertical list drag-reorder + Submit | The Sequence Stack |
| `m1-l2-gift-reveal` | Tap gift reveal | The Reveal Tap |

Validated on Next via `advance: { mode: "validate-on-next", rules: [...] }`.

---

## Advance policies

Common `advance.mode` values (`declarative.ts`):

| Mode | When Next enables |
|------|-------------------|
| `on-complete` | Screen calls `markScreenReady` after success |
| `auto-ready` | Auto on visit (`lesson-runner` effect) |
| `manual-next` | Author-controlled |
| `all-taps-revealed` | All tap-reveal items opened |
| `all-items-sorted` | All bucket-sort / sequence items placed |
| `spotlight-rounds-complete` | All spotlight rounds answered |
| `validate-on-next` | Custom validation rules on Next (custom screens) |

---

## Shipped usage (M1 L1–L4)

| `type` | L1 | L2 | L3 | L4 |
|--------|:--:|:--:|:--:|:--:|
| `word-drop` | ✓ | | ✓ | |
| `binary-choice` | ✓ | | ✓ | ✓ |
| `true-false` | | ✓ | | |
| `tap-reveal` | ✓ | | | |
| `bucket-sort` | ✓ | ✓ | ✓ | ✓ |
| `spotlight-rounds` | | ✓ | | |
| `link-match` | | | ✓ | |
| `hold-to-fill` | ✓ | | | |
| `drag-to-target` | | | | ✓ |
| `savings-goal` | | | | ✓ |
| `narrative-bonus` | ✓ | | | |
| `completion` | ✓ | ✓ | ✓ | ✓ |
| `custom` | | ✓ (×4) | | |

---

## Shared design system (not content types)

Reusable UI primitives — not separate `type` strings. Lesson adapters compose these; content authors usually only set screen `type` and data fields.

| Component / module | Role |
|--------------------|------|
| `LessonScreenLayout` | Standard intro / prompt / success / error shell |
| `LessonChoiceButton` + `LessonChoiceIndicator` | Pill and radio-list answers |
| `LessonSortPool`, `LessonSortStatementCard`, `LessonSortBucket` | Statement-sort pool + buckets |
| `LessonSequenceSortBoard`, `LessonSequenceStepCard`, `LessonSequenceSlot` | Step-order (`steps-row`) UI |
| `lesson-design-system.ts` | Barrel export for tokens + primitives |

Fix layout once in these components; future lessons need only content updates in `m1-l*.ts`.

---

## Candidates for future standardization

Only list types that solve a **repeated** interaction need not cleanly covered by existing types:

| Candidate | Why | Current workaround |
|-----------|-----|-------------------|
| **`slider` / `allocation-slider`** | Continuous split/threshold | L2 `custom:m1-l2-reserve-slider` — promote after a second lesson needs it |
| **`rank-order`** | Reorder **all** items in one column with Submit | L2 `custom:m1-l2-rank-stack` — differs from `steps-row` (pool → fixed slots) |
| **`budget-select`** | Multi-select under a budget cap | L2 `custom:m1-l2-budget-wallet` |

**Do not add new types for:**

- Multi-select → `binary-choice` + `selectionMode: "multi-correct"`
- Statement / category sort → `bucket-sort` + `statement-sort` (default)
- Step ordering → `bucket-sort` + `steps-row`
- Priced triage → `bucket-sort` + `spent-total`
- Swipe-to-save → `drag-to-target` or `savings-goal`
- Single / trap MCQ → `binary-choice` variants

---

## Adding a new lesson screen

1. Pick the closest `type` from this doc (or `custom` if truly one-off).
2. Add a screen object to the lesson's `baseScreens` in `lib/academy/lessons/content/m1-l*.ts`, or use spreadsheet import (`templates/lesson-authoring/`).
3. For bucket-sort, set `layout` only when not using default `statement-sort`.
4. For multi-answer checks, use `binary-choice` with `selectionMode: "multi-correct"` — do not create a new type.
5. If the interaction repeats across lessons, promote the `custom` renderer to a registered type and adapter in `lesson-screen-renderer.tsx`.
