# NextGenAchievers — Architectural Decisions Log

> Living record of finalized design and implementation choices. Update this file when a decision is made, reversed, or superseded. For delivery status, see `SPRINTS.md`. For non-negotiable stack and compliance rules, see `CLAUDE.md`.

---

## Decision Principles

These principles govern how we build and extend the codebase:

1. **Pillar Hub Architecture** — The product is organised around distinct youth-facing hubs (**Academy**, **Engine**, **Vault**) plus cross-cutting **Achievements** and **Settings**. Each hub owns a clear user job; shared state (wallet, XP, jars) flows through a single dashboard context rather than duplicating logic per page.

2. **Levels-Up Progression** — Learning and skill mastery are modelled **Level-first** (6 Levels × 3 Skills = 18 universal achievements), not module-phase buckets. Academy lesson milestones (54 nodes = 6 Levels × 9 Lessons) and the skills registry both derive level identity from the same 1–6 progression spine.

3. **Separation of Concerns** — UI lives in `components/`; domain state, storage, and pure logic live in `lib/` (`lib/dashboard/`, `lib/skills/`, `lib/academy/`, `lib/onboarding/`). Route files in `app/` stay thin: metadata, layout composition, and data hand-off only. Copy strings centralise in `constants/copyMatrix.ts`.

4. **Lean Architecture (Ghost-First)** — Ship high-fidelity UI and local `sessionStorage` persistence before Supabase Auth wiring. Ghost Access lets users explore the full shell without passwords or VPC blockers upfront; retrospective gates (Milestone 4) layer persistence and compliance later.

5. **The Drafting Table Rule** — Non-agentic by design. The app provides tools and dashboards; the user supplies intent. No automated trading, scraping, gig placement, or AI-driven financial actions.

6. **Dual Cohort Model** — **Compliance tiers** (Explorer / Titan, COPPA-driven, age 10–13 vs 14–17+) are separate from **Mastery cohorts** (Explorer / Pathfinder / Maverick, ages 10–12 / 13–15 / 16–18). Skill gating and UI counts use mastery cohorts; parental consent and privacy rules use compliance tiers.

7. **TypeScript Source of Truth, Database Mirror** — Canonical skill definitions live in `lib/skills/skills-registry.ts` and are mirrored to Supabase via migrations. Runtime reads use the in-memory registry until live PostgREST queries are wired; cohort filters are defined once in `skills-registry-query.ts`.

8. **Token Stewardship** — Prefer local math and static scaffolds over API calls. Do not invoke Grok (or any LLM) for deterministic dashboard calculations, compounding projections, or static copy resolution.

9. **Duolingo-for-Finance UX** — Borderless white canvas, floating `shadow-md` tiles, zigzag journey maps, curved dotted SVG path connectors, high visual density, low prose. Shared primitives (`DashboardSectionHeading`, `JourneyPathBridge`, lesson slide shell) enforce consistency.

10. **Finn as Sole Mentor Persona** — All youth-facing mentor voice, Vault activity logs, and hub copy reference **Finn** only. No competing AI personas in product UI.

11. **Hardware Isolation** — PWA-only interaction model. No camera, Bluetooth, or native push notification dependencies in the current build.

12. **Compliance by Design** — No specific financial advice, no gambling/crypto/get-rich-quick mechanics. High ROI projections in Vault trigger a compliance warning at ≥ 12%. Virtual-money disclaimers on point conversion flows.

13. **Declarative Lesson Pipeline** — Shipped lesson copy, screen configs, and cohort variants live in `lib/academy/lessons/content/` and resolve through `LESSON_REGISTRY` → `AcademyLessonPlayer` + `LessonScreenRenderer`. Route files and monolithic per-lesson TSX components are not the authoring surface.

14. **Spreadsheet-First Authoring** — Non-developers author lessons via `templates/lesson-authoring/` CSVs (`Lesson-Details.csv` + `Screens.csv`) and import scripts (`npm run lesson:import`). TypeScript content files are generated or hand-finished by developers; `.ts` is not the primary author entry point.

15. **Semantic UI Layering** — Stacking uses named tokens (`z-base` … `z-dev`) in `@theme`, portal roots (`#overlay-root`, `#modal-root`, `#toast-root`), and shared shells (`ModalShell`, `OverlayPortal`). Raw numeric z-index values are forbidden in components; ESLint enforces this.

16. **Lesson Side-Effect Safety** — Interactive lesson games must not synchronously trigger parent flow state (`flashScreen`, `markScreenReady`, `incrementMistake`) from inside child `setState` updaters. Cross-component effects are deferred (`setTimeout(0)` queue or effect flush). Only the active lesson screen mounts live interactive content.

17. **Navigation Independence** — Dashboard pillar nav (sidebar + bottom nav) uses explicit `router.push()` and must remain functional during any in-lesson interaction. Lesson pointer capture, overlays, and touch suppression must never block global navigation.

---

## Decisions Table

| Date | Topic | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-06-07 | Core stack | Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Vercel deployment target, Supabase for future auth/DB | Aligns with `CLAUDE.md` non-negotiables; App Router supports layout-level providers and server redirects; minimal dependency surface (`package.json` has no UI framework beyond React/Next) |
| 2026-06-07 | AI provider | xAI Grok only; absolute exclusion of OpenAI / ChatGPT SDKs | Brand and compliance constraint in `CLAUDE.md`; avoids dual-vendor cost and policy drift |
| 2026-06-07 | Native hardware | Zero reliance on device hardware (camera, Bluetooth, native push) | Keeps PWA portable across school/shared devices and simplifies minor-compliance review |
| 2026-06 (Early) | Brand tokens | Corporate HEX palette codified in `tailwind.config.ts` + `globals.css`: Primary `#031F82`, Panel `#BDE9FB`, Secondary `#0CC1E0`, CTA `#FFA503`, Accent `#DCB766` | Single source for Duolingo-style brand consistency; verified via `/design-system` gate |
| 2026-06 (Early) | Typography | Poppins (`font-heading`) for interactive headings; Inter (`font-sans`) for body — loaded via `next/font/google` in root layout | Matches brand guidelines; avoids layout shift and external font CDN dependency |
| 2026-06 (Early) | Copy architecture | Centralise user-facing strings in `constants/copyMatrix.ts` with `[Username]` token substitution via `resolve-greeting.ts` | Separates content from components; enables tone audits and future localisation without refactors |
| 2026-06 (Early) | Onboarding Phase A | 5-second Personalization Gate collects **Birth Year + Username** only at `/onboarding/start` | Minimises friction for first-run; birth year feeds cohort logic later without a heavy signup form |
| 2026-06 (Early) | Ghost Access | Instant route to dashboard after onboarding; session persisted in `sessionStorage` (`nga_ghost_session`); no password or VPC upfront | Validates full product shell before Milestone 4 retrospective gates; supports demo and user testing |
| 2026-06 (Early) | Compliance tier (onboarding) | Binary **Explorer** (< 14) vs **Titan** (14+) stored on ghost session (`ComplianceTier`) | Maps to COPPA/GDPR-K parental consent thresholds; distinct from mastery cohort tranche |
| 2026-06-11 | Academy journey model | Phase 1 = **54 lesson milestones** (6 Levels × 9 Lessons); level derived via `levelGroupForMilestoneId()` | Duolingo-style long vertical map; boss nodes every 9th milestone; supports level signposts and roll-up progress |
| 2026-06-11 | Academy state layer | Pure milestone scaffold + roll-ups in `lib/dashboard/academy-state.ts`; progress persisted in `academy-progress-storage.ts` | Separates render logic from hydration; ready for Supabase sync without rewriting UI |
| 2026-06-11 | Journey connectors | Replace straight vertical lines with **curved dotted SVG cubic-bezier paths** (`JourneyPathBridge`); walked segments solid grey, future segments faded | Visual parity with Duolingo maps; reused on Academy and Engine journey canvases |
| 2026-06-14 | Navigation model | **Five-pillar** dashboard nav: Academy, Engine, Vault, Achievements, Settings — defined in `lib/dashboard/navigation.ts` | Each pillar maps to a distinct user job; sidebar (desktop) + bottom nav (mobile) share one config |
| 2026-06-14 | Default landing | `/dashboard` → `/dashboard/academy`; onboarding ghost route lands on Academy | Academy is the primary learning entry point; reduces dead-end home hub |
| 2026-06-14 | Settings consolidation | Account, Parent Mode, and point conversion moved to `/dashboard/settings`; legacy `/dashboard/home` redirects to Settings | Collapses account/parent tooling into one hub; frees nav slots for Achievements |
| 2026-06-14 | Dashboard shell | `DashboardShell` guards routes via ghost session check; `DashboardProviders` → `DashboardWalletProvider` at dashboard layout root | Single auth gate for all hubs; wallet state available without prop drilling |
| 2026-06-14 | Shared wallet context | XP, lifetime XP, AUD conversion slider, jar balances, and unallocated Vault pool live in `DashboardWalletProvider` with `sessionStorage` persistence | Cross-hub consistency (Settings cash-out → Vault Save Jar); survives navigation without server round-trips in ghost phase |
| 2026-06-14 | Vault jars | Foundational **Spend / Save / Give** jars plus **Money to Allocate** holding pool; bidirectional ADD/RECALL; Save Jar fed by point conversion, protected from pool Reset | Teaches allocation mechanics safely; Save Jar bridge connects gamification (XP) to sandbox savings |
| 2026-06-14 | Vault compounding | Client-side compound projection in Vault (`projectCompoundSavings`); sliders for years, weekly top-up, ROI; **≥ 12% ROI compliance warning** | Token-free local math; warning satisfies high-risk exclusion without blocking exploration |
| 2026-06-14 | Parent PIN gate | 4-digit PIN (`parent-pin.ts`) secures Parent Mode toggle in Settings; stored in `sessionStorage` | Shared-device safety without full auth; recovery PIN + simulated email for ghost testing |
| 2026-06-14 | Achievements hub | Dedicated `/dashboard/achievements` with Skills, Streaks, Money Milestones, Monthly Challenges, Social Friends sections | Skill medals decoupled from Vault; achievements become a first-class pillar |
| 2026-06-14 | UI section headers | All hub titles use shared `DashboardSectionHeading` (centered Poppins, `text-nga-primary`) | One component enforces typography parity across five hubs |
| 2026-06-14 | Visual layout | Borderless white canvas, floating tiles (`shadow-md`), no rigid grid boxes on hub pages | "Duolingo for Finance" spatial layout; reduces visual noise for youth users |
| 2026-06-15 | Lesson shell | Interactive lessons use **8-screen horizontal slide shell** (`academy-lesson-shell.tsx`) with shared **Screen 8 completion pane** | Consistent lesson UX; completion screen standardised (`[ CASH IN YOUR POINTS ]` pattern) |
| 2026-06-15 | Lesson registry | Shipped lessons tracked in `lib/academy/lessons/registry.ts` (`SHIPPED_ACADEMY_LESSON_IDS`); milestone route at `/dashboard/academy/lesson/[milestoneId]` | Explicit allow-list prevents routing to unfinished lessons; XP/skill constants co-located per lesson |
| 2026-06-15 | Lesson replay | Completed shipped nodes remain tappable; replay awards XP on claim (testing-friendly) | Supports review and QA without duplicate progress corruption |
| 2026-06-15 | M1-L1 / M1-L2 mapping | M1-L1 → Skill 1 **Stop & Think**; M1-L2 → Skill 2 **Put Needs First**; bronze unlock on completion via `vault-skill-progress-storage.ts` | Ties first two lessons to level-based registry slugs; achievements reflect theory mastery tier |
| 2026-06-22 | Skills registry shape | **18 skills** in **6 Levels × 3 Skills** hierarchy; fields: `level_id`, `skill_number`, `skill_slug`, `is_advanced_cohort_only` | Replaced incorrect module-phase and 24-skill drafts; level_id = CEIL(skill_number / 3) enforced in DB CHECK constraints |
| 2026-06-22 | Skills source of truth | TypeScript registry in `lib/skills/skills-registry.ts`; Supabase `skills_registry` table seeded via migrations `20250611000000`–`000003` | App works offline/ghost without Supabase client; migrations keep DB aligned with TS mirror |
| 2026-06-22 | Advanced skill gating | Skills **1–12** universal (`is_advanced_cohort_only = false`); Skills **13–18** Maverick-only (`true`); DB boundary CHECK constraint | Explicit cohort boundary; indexed filter for payload optimisation on Explorer/Pathfinder queries |
| 2026-06-22 | Mastery cohorts | **Explorer** (10–12), **Pathfinder** (13–15), **Maverick** (16–18) in `mastery-cohort.ts`; separate from compliance Explorer/Titan split | Three-band gamification track; only Mavericks see Levels 5–6 skills and Academy signposts |
| 2026-06-22 | Cohort fetch pattern | `skillsRegistryForMasteryCohort()` + `skillsRegistryPostgrestFilter()` filter advanced skills at slice/query layer | Avoids loading 18 skills for 12-skill profiles; single pattern for in-memory and future Supabase reads |
| 2026-06-22 | Trophy scaffold | `VAULT_SKILL_TROPHIES` generated from registry; tiers Bronze/Silver/Gold/Locked; cohort resolver in `skill-trophies.ts` | UI derives from registry — no duplicate skill metadata; Achievements carousel uses stable `skillNumber` keys |
| 2026-06-22 | Legacy slug compatibility | Registry entries include optional `legacySlugs` + `resolveCanonicalSkillSlug()` for sessionStorage migration | Pre-registry lesson/vault keys normalise without breaking existing ghost sessions |
| 2026-06-22 | Skill UI relocation | Removed Vault trophy shelf; skill medals live exclusively in Achievements hub | Vault focuses on allocation/compounding; achievements own mastery display |
| 2026-06-22 | Point conversion | Child-initiated **Cash In Your Points** in Settings: $0.50–$5.00 AUD per 100 XP slider, virtual-money disclaimer, `claimPointsForVault()` credits Save Jar | Child controls timing of conversion; parent sets rate in Parent Mode; AUD formatting via `Intl` en-AU |
| 2026-06-22 | Engine hub scope | Engine ships venture carousels, launch drawers, and 4-node venture journey map (demo Step 3 anchor) — operational templates remain scaffold | Horizontal slice prioritises Academy + Vault; Engine proves dual-carousel + journey map pattern |
| 2026-06-22 | Database RLS readiness | `skills_registry` enables RLS with permissive read policy for `authenticated, anon`; writes deferred until auth | Schema ready for production; ghost/demo reads work; user progress tables not yet added |
| 2026-06-22 | Pending integration | Supabase client **not wired** for runtime skill/user queries; all progression uses `sessionStorage` + in-memory registry | Documented in `SPRINTS.md` Sprint 5; avoids half-connected auth blocking ghost demo |
| 2026-07-08 | Lesson orchestration | Shared `useLessonFlow` hook owns screen index, readiness gates, mistake counting, flash states, XP/milestone side effects | Removes duplicated orchestration from monolithic lesson components; scales to ~54 lessons × 3 cohorts |
| 2026-07-08 | Lesson content model | **Registry-driven declarative pipeline**: `content/mX-lY.ts` → `LESSON_REGISTRY` → generic `AcademyLessonPlayer` + `LessonScreenRenderer` | Strict UI/content separation; `/dashboard/academy/lesson/[milestoneId]` resolves from static registry |
| 2026-07-08 | Cohort overrides | Base `baseScreens` + per-cohort `screenOverrides` via `mergeScreenConfig` / `applyCohortScreenOverrides`; `_replace: true` for full screen swaps (e.g. Screen 8) | Same 8-screen structure with different narratives/items per Explorer / Pathfinder / Maverick without full duplication |
| 2026-07-08 | Generic DataDrivenLesson | **Deferred** — prove pipeline with working lessons before a single mega-component | User-approved; current player + renderer switch is sufficient for Phase 1 |
| 2026-07-08 | Screen 8 completion helpers | `explorerCompletionScreen()` / `teenCompletionScreen()` in `completion-screen.ts`; Explorer uses `useStandardPane: true`, teens use fixed copy + `returnButtonLabel` | Consistent bronze unlock + XP flow; cohort completion UI via overrides |
| 2026-07-08 | Active-screen mounting | Only `flow.screenIndex` mounts `LessonScreenRenderer`; inactive carousel panes use `inert` + `aria-hidden` | Cuts DOM weight; prevents hidden bucket-sort instances from firing parent callbacks |
| 2026-07-08 | Bucket-sort layout variant | `layout: "spent-total"` + `SortItem.price` + `targetTotal` for two-column drag with live running total header | L3 Screen 2: purchasable items left, Spent bucket + `Total Amount Spent: $N` right (target $40) |
| 2026-07-08 | Link-match screen type | New `link-match` archetype + `LessonLinkMatchGame` — tap event → tap benefit; columns jumbled on load | L3 Screen 3 replaces static success state with real matching interaction |
| 2026-07-08 | Dashboard nav reliability | `DashboardNavLink` uses explicit `router.push()`; sidebar/bottom nav at `z-chrome` | Restores routing during lesson interactions; decoupled from lesson state |
| 2026-07-08 | Pointer capture hygiene | Bucket-sort releases `setPointerCapture` on up/cancel/unmount/`lostpointercapture` | Stuck capture was hijacking pointer events and killing sidebar clicks after drags |
| 2026-07-08 | Touch scope | Remove global `touchAction: "none"` from lesson carousel viewport; keep only on drag chips | Prevents viewport-level touch/click interference |
| 2026-07-08 | Academy content loading | No Supabase/database in nav or lesson content path — `useLessonDefinition` reads in-memory registry | Future DB mirror must not block shell routing; `content/` is runtime source of truth (not import fixtures) |
| 2026-07-08 | Z-index architecture | Semantic `@theme` tokens + portal roots + `ModalShell`/`OverlayPortal` + ESLint ban on raw `z-[N]` | Predictable stacking: chrome (40) → overlay (50) → modal (60) → toast (70) |
| 2026-07-08 | Layer isolation | `layer-island` (`isolation: isolate`) on lesson/journey containers | Local stacking stays contained; does not fight global chrome |
| 2026-07-08 | Ghost session QA reset | `/onboarding/start?reset=1` clears app session state via `clear-app-session-state.ts` | Enables birth-year re-entry and fresh-user testing without manual storage wipes |
| 2026-07-08 | M1-L3 shipment | Milestone 3 registered in `LESSON_REGISTRY`; skill mapping follows existing Level 1 spine | Third shipped lesson validates declarative pipeline at scale |
| 2026-07-20 | Large file refactoring for Cursor performance | Split `lesson-screen-renderer.tsx` into per-screen components under `components/academy/lesson/screens/`; split monolithic `types.ts` into `lib/academy/lessons/types/`; slim `academy-state.ts` and extract static content to `lib/dashboard/academy-content.ts`; extract Engine and Vault route bodies into `engine-dashboard.tsx` and `vault-dashboard.tsx` following the Academy thin-route pattern; add `.cursorignore` for import pipeline artifacts; resolve four pre-existing ESLint warnings (ref cleanup, hook deps, unused type, destructure lint) | Significantly reduces AI coding context bloat while preserving Separation of Concerns, declarative data-driven lessons, backward-compatible imports, and build integrity (`lint`, `tsc`, `build` all pass) |
| 2026-06-26 | Academy design shell | Milestone `9001` at `/dashboard/academy/lesson/shell` � dev/QA-only route (404 in production); exercises every registered lesson screen type; skips XP/milestone writes on Cash In | Single place to lock layout, spacing, and interaction before shipping real lessons; never appears on the Academy journey map |
| 2026-06-26 | Lesson screen standards SSOT | **`docs/academy-screen-types.md`** is the authoritative spec for all Academy lesson screens: typography scale, illustration omit/allow lists, global correct/incorrect feedback, minimal lesson chrome, and per-type locked behaviours | Any future lesson prompt or UI work references one doc instead of scattered shell notes |
| 2026-06-26 | Global lesson typography | Prompt/instruction `text-base font-medium`; section/column titles `text-sm font-semibold uppercase tracking-wide`; option/answer text `text-base font-medium` (never larger than prompt); feedback banners `text-sm font-medium`; Next/Submit `text-base font-semibold` � tokens in `lesson-shared-styles.ts` | Uniform readable scale across all 16 screen types; design shell QA verified on mobile viewports |
| 2026-06-26 | Lesson illustrations | Optional `illustration` field per screen; **omit by default** on dense types (bucket-sort all layouts, rank-order, link-match, savings-goal, budget-select, spotlight-rounds, allocation-slider, completion); **allowed** on lighter types (word-drop, binary-choice, true-false, hold-to-fill, drag-to-target, narrative-bonus) | Preserves vertical space so Next stays reachable without forced page scroll |
| 2026-06-26 | Global lesson feedback | Correct ? green border + green check; incorrect ? red border + red X / screen flash; wrong answers never receive a success tick; every mistake triggers visible red feedback via `LessonChoiceIndicator`, `signalLessonIncorrectAnswer`, and persistent error toasts | Consistent mistake signalling across choice, icon, match, and sort interactions |
| 2026-06-26 | Locked game behaviours | **Link-match:** tap-and-pair with persistent cyan left selection, distinct solid pair colours, mismatch clears + red flash. **Rank-order:** numbers outside cards. **Drag-to-target:** icons as direct drag source. **Budget-select:** Next only when exact `correctIds` + within budget (`on-complete` only). **Spotlight-rounds:** wrong pick never ticked; ~450 ms recovery. **Narrative-bonus:** claim awards XP and advances in one tap | Interaction contracts frozen in design shell and documented per type |
| 2026-06-26 | Minimal lesson chrome | Lives (3 hearts) + slim progress bar + optional XP chip; footer Next disabled until screen ready; last screen uses Cash In / Collect Points | Duolingo-style focus; no dashboard stats or heavy chrome inside lesson routes |
| 2026-06-26 | Promoted standard screen types | M1-L2 custom renderers replaced by registered types: `budget-select`, `allocation-slider`, `rank-order`; only `m1-l2-gift-reveal` remains custom | Removes duplicate one-off implementations; shared game engines in `lesson-*-game.tsx` |
| 2026-06-26 | Shipped lesson migration | M1 L1�L4 content updated to the locked standards (typography tokens, feedback, layout compression, neutral bucket-sort headers, link-match tap-and-pair, spent-total vertical cards, tap-reveal shuffle, spotlight recovery, budget-select gating) | All production lessons match design shell behaviour; future lessons must follow `docs/academy-screen-types.md` |
| 2026-06-26 | Removed superseded lesson code | Dropped unused `validate-on-next` / `ValidationRule` pipeline (never wired at runtime); dead link-match connector/row components and unused match CSS tokens; unused `clearOnSuccess` hold-to-fill prop; spreadsheet archetype map updated to standard types | Keeps lesson codebase aligned with promoted screen types only |

---

## Deferred / Open Decisions

| Topic | Status | Notes |
|-------|--------|-------|
| Supabase Auth + multi-device sessions | Open | Sprint 5; ghost session remains interim |
| Adaptive placement quiz | Open | Task 3.4; will write skill tiers to DB |
| Silver / Gold achievement graduation | Partial | Bronze unlocks from lessons; cross-hub Silver/Gold logic pending Task 4.6 |
| VPC magic-link flow | Stub only | `/onboarding/parent-consent` route exists; flow not implemented |
| Grok API integration surface | Not started | Stack constraint locked; no LLM calls in current codebase |
| PWA push notifications | Explicitly excluded | Hardware isolation decision; revisit only if policy changes |
| Generic DataDrivenLesson component | Deferred | Revisit after 4–6 lessons stable in registry pipeline |
| Spreadsheet → lesson import at scale | Partial | Templates + import scripts ship; L4+ content fill in progress |
| Lesson side-effect ESLint rule | Open | Consider custom rule banning parent callbacks inside `setState` updaters in `components/academy/lesson/` |
| Academy lesson Supabase mirror | Open | Registry remains TS source of truth; no runtime DB fetch for lesson content yet |

---

*Last updated: 2026-06-26*
