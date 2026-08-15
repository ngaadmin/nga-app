# NextGenAchievers ? Architectural Decisions Log

> Living record of finalized design and implementation choices. Update this file when a decision is made, reversed, or superseded. For delivery status, see `SPRINTS.md`. For non-negotiable stack and compliance rules, see `CLAUDE.md`.

---

## Decision Principles

These principles govern how we build and extend the codebase:

1. **Pillar Hub Architecture** ? The product is organised around distinct youth-facing hubs (**Academy**, **Launchpad**, **Vault**) plus cross-cutting **Achievements** and **Settings**. Nav may also surface **Advanced Money** as an extension item (not a core pillar id). XP/conversion lives in `DashboardWalletProvider`; Vault jar/profile state is owned by `VaultProfileProvider` (`nga_vault_*` keys). Legacy **Engine** and **Vault-v2** routes permanently redirect.

2. **Levels-Up Progression** ? Learning and skill mastery are modelled **Level-first** (6 Levels � 3 Skills = 18 universal achievements), not module-phase buckets. Academy lesson milestones (54 nodes = 6 Levels � 9 Lessons) and the skills registry both derive level identity from the same 1?6 progression spine.

3. **Separation of Concerns** ? UI lives in `components/`; domain state, storage, and pure logic live in `lib/` (`lib/dashboard/`, `lib/skills/`, `lib/academy/`, `lib/onboarding/`, `lib/launchpad/`). Route files in `app/` stay thin: metadata, layout composition, and data hand-off only. Copy strings centralise in `constants/copyMatrix.ts`.

4. **Lean Architecture (Ghost-First)** ? Ship high-fidelity UI and local `sessionStorage` persistence before Supabase Auth wiring. Ghost Access lets users explore the full shell without passwords or VPC blockers upfront; retrospective gates (Milestone 4) layer persistence and compliance later.

5. **The Drafting Table Rule** ? Non-agentic by design. The app provides tools and dashboards; the user supplies intent. No automated trading, scraping, gig placement, or AI-driven financial actions.

6. **Dual Cohort Model** ? **Compliance tiers** (Explorer / Titan, COPPA-driven, age 10?13 vs 14?17+) are separate from **Mastery cohorts** (Explorer / Pathfinder / Maverick, ages 10?12 / 13?15 / 16?18). Skill gating and UI counts use mastery cohorts; parental consent and privacy rules use compliance tiers.

7. **TypeScript Source of Truth, Database Mirror** ? Canonical skill definitions live in `lib/skills/skills-registry.ts` and are mirrored to Supabase via migrations. Runtime reads use the in-memory registry until live PostgREST queries are wired; cohort filters are defined once in `skills-registry-query.ts`.

8. **Token Stewardship** ? Prefer local math and static scaffolds over API calls. Do not invoke Grok (or any LLM) for deterministic dashboard calculations, compounding projections, or static copy resolution.

9. **Duolingo-for-Finance UX** ? Borderless white canvas, floating `shadow-md` tiles, zigzag journey maps, curved dotted SVG path connectors, high visual density, low prose. Shared primitives (`DashboardSectionHeading`, `JourneyPathBridge`, lesson slide shell) enforce consistency. Hub titles use **Academy / Launchpad / Vault** with no "The " prefix.

10. **Finn as Sole Mentor Persona** ? All youth-facing mentor voice, Vault activity logs, and hub copy reference **Finn** only. No competing AI personas in product UI.

11. **Hardware Isolation** ? PWA-only interaction model. No camera, Bluetooth, or native push notification dependencies in the current build.

12. **Compliance by Design** ? No specific financial advice, no gambling/crypto/get-rich-quick mechanics. High ROI projections in **Advanced Money ? Growth Potential** trigger a compliance warning at ? 12%. Virtual-money disclaimers on Vault income entry and point conversion flows.

13. **Declarative Lesson Pipeline** ? Shipped lesson copy, screen configs, and cohort variants live in `lib/academy/lessons/content/` and resolve through `LESSON_DEFINITIONS` ? `AcademyLessonPlayer` + `LessonScreenRenderer`. Route files and monolithic per-lesson TSX components are not the authoring surface. Per-lesson `shippedCohorts` gates which mastery cohorts can launch a milestone.

14. **Spreadsheet-First Authoring** ? Non-developers author lessons via `templates/lesson-authoring/` CSVs (`Lesson-Details.csv` + `Screens.csv`) and import scripts (`npm run lesson:import`). TypeScript content files are generated or hand-finished by developers; `.ts` is not the primary author entry point.

15. **Semantic UI Layering** ? Stacking uses named tokens (`z-base` ? `z-dev`) in `@theme`, portal roots (`#overlay-root`, `#modal-root`, `#toast-root`), and shared shells (`ModalShell`, `OverlayPortal`). Raw numeric z-index values are forbidden in components; ESLint enforces this.

16. **Lesson Side-Effect Safety** ? Interactive lesson games must not synchronously trigger parent flow state (`flashScreen`, `markScreenReady`, `incrementMistake`) from inside child `setState` updaters. Cross-component effects are deferred (`setTimeout(0)` queue or effect flush). Only the active lesson screen mounts live interactive content.

17. **Navigation Independence** ? Dashboard pillar nav (sidebar + bottom nav) uses explicit `router.push()` and must remain functional during any in-lesson interaction. Lesson pointer capture, overlays, and touch suppression must never block global navigation.

18. **Academy Screen Standards SSOT** ? `docs/academy-screen-types.md` is the authoritative spec for lesson screen layout, typography, feedback, illustrations, and locked interaction behaviours. The design shell (`/dashboard/academy/lesson/shell`, milestone `9001`) is the live QA reference (404 in production).

---

## Decisions Table

| Date | Topic | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-06-07 | Core stack | Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Vercel deployment target, Supabase for future auth/DB | Aligns with `CLAUDE.md` non-negotiables; App Router supports layout-level providers and server redirects; minimal dependency surface (`package.json` has no UI framework beyond React/Next) |
| 2026-06-07 | AI provider | xAI Grok only; absolute exclusion of OpenAI / ChatGPT SDKs | Brand and compliance constraint in `CLAUDE.md`; avoids dual-vendor cost and policy drift |
| 2026-06-07 | Native hardware | Zero reliance on device hardware (camera, Bluetooth, native push) | Keeps PWA portable across school/shared devices and simplifies minor-compliance review |
| 2026-06 (Early) | Brand tokens | Corporate HEX palette codified in `tailwind.config.ts` + `globals.css`: Primary `#031F82`, Panel `#BDE9FB`, Secondary `#0CC1E0`, CTA `#FFA503`, Accent `#DCB766` | Single source for Duolingo-style brand consistency; verified via `/design-system` gate |
| 2026-06 (Early) | Typography | Poppins (`font-heading`) for interactive headings; Inter (`font-sans`) for body ? loaded via `next/font/google` in root layout | Matches brand guidelines; avoids layout shift and external font CDN dependency |
| 2026-06 (Early) | Copy architecture | Centralise user-facing strings in `constants/copyMatrix.ts` with `[Username]` token substitution via `resolve-greeting.ts` | Separates content from components; enables tone audits and future localisation without refactors |
| 2026-06 (Early) | Onboarding Phase A | 5-second Personalization Gate collects **Birth Year + Username** only at `/onboarding/start` | Minimises friction for first-run; birth year feeds cohort logic later without a heavy signup form |
| 2026-06 (Early) | Ghost Access | Instant route to dashboard after onboarding; session persisted in `sessionStorage` (`nga_ghost_session`); no password or VPC upfront | Validates full product shell before Milestone 4 retrospective gates; supports demo and user testing |
| 2026-06 (Early) | Compliance tier (onboarding) | Binary **Explorer** (< 14) vs **Titan** (14+) stored on ghost session (`ComplianceTier`) | Maps to COPPA/GDPR-K parental consent thresholds; distinct from mastery cohort tranche |
| 2026-06-11 | Academy journey model | Phase 1 = **54 lesson milestones** (6 Levels � 9 Lessons); level derived via `levelGroupForMilestoneId()` | Duolingo-style long vertical map; boss nodes every 9th milestone; supports level signposts and roll-up progress |
| 2026-06-11 | Academy state layer | Pure milestone scaffold + roll-ups in `lib/dashboard/academy-state.ts`; progress persisted in `academy-progress-storage.ts` | Separates render logic from hydration; ready for Supabase sync without rewriting UI |
| 2026-06-11 | Journey connectors | Replace straight vertical lines with **curved dotted SVG cubic-bezier paths** (`JourneyPathBridge`); walked segments solid grey, future segments faded | Visual parity with Duolingo maps; reused on Academy and Launchpad journey canvases |
| 2026-06-14 | Navigation model | **Five-pillar** dashboard nav: Academy, Engine, Vault, Achievements, Settings ? defined in `lib/dashboard/navigation.ts` | Each pillar maps to a distinct user job; sidebar (desktop) + bottom nav (mobile) share one config. **Superseded 2026-07-31:** Engine ? Launchpad |
| 2026-06-14 | Default landing | `/dashboard` ? `/dashboard/academy`; onboarding ghost route lands on Academy | Academy is the primary learning entry point; reduces dead-end home hub |
| 2026-06-14 | Settings consolidation | Account, Parent Mode, and point conversion moved to `/dashboard/settings`; legacy `/dashboard/home` redirects to Settings | Collapses account/parent tooling into one hub; frees nav slots for Achievements |
| 2026-06-14 | Dashboard shell | `DashboardShell` guards routes via ghost session check; `DashboardProviders` ? `DashboardWalletProvider` at dashboard layout root | Single auth gate for all hubs; wallet state available without prop drilling |
| 2026-06-14 | Shared wallet context | XP, lifetime XP, AUD conversion slider, jar balances, and unallocated Vault pool live in `DashboardWalletProvider` with `sessionStorage` persistence | Cross-hub consistency (Settings cash-out ? Vault Save Jar); survives navigation without server round-trips in ghost phase. **Partially superseded 2026-07-30:** jar/profile state moved to `VaultProfileProvider` |
| 2026-06-14 | Vault jars | Foundational **Spend / Save / Give** jars plus **Money to Allocate** holding pool; bidirectional ADD/RECALL; Save Jar fed by point conversion, protected from pool Reset | Teaches allocation mechanics safely; Save Jar bridge connects gamification (XP) to sandbox savings |
| 2026-06-14 | Vault compounding | Client-side compound projection in Vault (`projectCompoundSavings`); sliders for years, weekly top-up, ROI; **? 12% ROI compliance warning** | Token-free local math; warning satisfies high-risk exclusion without blocking exploration. **Superseded 2026-07-30:** compounding lives under Advanced Money Tools |
| 2026-06-14 | Parent PIN gate | 4-digit PIN (`parent-pin.ts`) secures Parent Mode toggle in Settings; stored in `sessionStorage` | Shared-device safety without full auth; recovery PIN + simulated email for ghost testing |
| 2026-06-14 | Achievements hub | Dedicated `/dashboard/achievements` with Skills, Streaks, Money Milestones, Monthly Challenges, Social Friends sections | Skill medals decoupled from Vault; achievements become a first-class pillar |
| 2026-06-14 | UI section headers | All hub titles use shared `DashboardSectionHeading` (centered Poppins, `text-nga-primary`) | One component enforces typography parity across five hubs |
| 2026-06-14 | Visual layout | Borderless white canvas, floating tiles (`shadow-md`), no rigid grid boxes on hub pages | "Duolingo for Finance" spatial layout; reduces visual noise for youth users |
| 2026-06-15 | Lesson shell | Interactive lessons use **8-screen horizontal slide shell** (`academy-lesson-shell.tsx`) with shared **Screen 8 completion pane** | Consistent lesson UX; completion screen standardised (`[ CASH IN YOUR POINTS ]` pattern) |
| 2026-06-15 | Lesson registry | Shipped lessons tracked in `lib/academy/lessons/registry.ts` (`SHIPPED_ACADEMY_LESSON_IDS` / `LESSON_DEFINITIONS`); milestone route at `/dashboard/academy/lesson/[milestoneId]` | Explicit allow-list prevents routing to unfinished lessons; XP/skill constants co-located per lesson |
| 2026-06-15 | Lesson replay | Completed shipped nodes remain tappable; replay awards XP on claim (testing-friendly) | Supports review and QA without duplicate progress corruption |
| 2026-06-15 | M1-L1 / M1-L2 mapping | M1-L1 ? Skill 1 **Stop & Think**; M1-L2 ? Skill 2 **Put Needs First**; bronze unlock on completion via `vault-skill-progress-storage.ts` | Ties first two lessons to level-based registry slugs; achievements reflect theory mastery tier |
| 2026-06-22 | Skills registry shape | **18 skills** in **6 Levels � 3 Skills** hierarchy; fields: `level_id`, `skill_number`, `skill_slug`, `is_advanced_cohort_only` | Replaced incorrect module-phase and 24-skill drafts; level_id = CEIL(skill_number / 3) enforced in DB CHECK constraints |
| 2026-06-22 | Skills source of truth | TypeScript registry in `lib/skills/skills-registry.ts`; Supabase `skills_registry` table seeded via migrations `20250611000000`?`000003` | App works offline/ghost without Supabase client; migrations keep DB aligned with TS mirror |
| 2026-06-22 | Advanced skill gating | Skills **1?12** universal (`is_advanced_cohort_only = false`); Skills **13?18** Maverick-only (`true`); DB boundary CHECK constraint | Explicit cohort boundary; indexed filter for payload optimisation on Explorer/Pathfinder queries |
| 2026-06-22 | Mastery cohorts | **Explorer** (10?12), **Pathfinder** (13?15), **Maverick** (16?18) in `mastery-cohort.ts`; separate from compliance Explorer/Titan split | Three-band gamification track; only Mavericks see Levels 5?6 skills and Academy signposts |
| 2026-06-22 | Cohort fetch pattern | `skillsRegistryForMasteryCohort()` + `skillsRegistryPostgrestFilter()` filter advanced skills at slice/query layer | Avoids loading 18 skills for 12-skill profiles; single pattern for in-memory and future Supabase reads |
| 2026-06-22 | Trophy scaffold | `VAULT_SKILL_TROPHIES` generated from registry; tiers Bronze/Silver/Gold/Locked; cohort resolver in `skill-trophies.ts` | UI derives from registry ? no duplicate skill metadata; Achievements carousel uses stable `skillNumber` keys |
| 2026-06-22 | Legacy slug compatibility | Registry entries include optional `legacySlugs` + `resolveCanonicalSkillSlug()` for sessionStorage migration | Pre-registry lesson/vault keys normalise without breaking existing ghost sessions |
| 2026-06-22 | Skill UI relocation | Removed Vault trophy shelf; skill medals live exclusively in Achievements hub | Vault focuses on allocation/compounding; achievements own mastery display |
| 2026-06-22 | Point conversion | Child-initiated **Cash In Your Points** in Settings: $0.50?$5.00 AUD per 100 XP slider, virtual-money disclaimer, `claimPointsForVault()` credits Save Jar | Child controls timing of conversion; parent sets rate in Parent Mode; AUD formatting via `Intl` en-AU |
| 2026-06-22 | Engine hub scope | Engine ships venture carousels, launch drawers, and 4-node venture journey map (demo Step 3 anchor) ? operational templates remain scaffold | Horizontal slice prioritises Academy + Vault; Engine proves dual-carousel + journey map pattern. **Superseded 2026-07-31:** hub renamed Launchpad |
| 2026-06-22 | Database RLS readiness | `skills_registry` enables RLS with permissive read policy for `authenticated, anon`; writes deferred until auth | Schema ready for production; ghost/demo reads work; user progress tables not yet added |
| 2026-06-22 | Pending integration | Supabase client **not wired** for runtime skill/user queries; all progression uses `sessionStorage` + in-memory registry | Documented in `SPRINTS.md` Sprint 5; avoids half-connected auth blocking ghost demo |
| 2026-07-08 | Lesson orchestration | Shared `useLessonFlow` hook owns screen index, readiness gates, mistake counting, flash states, XP/milestone side effects | Removes duplicated orchestration from monolithic lesson components; scales to ~54 lessons � 3 cohorts |
| 2026-07-08 | Lesson content model | **Registry-driven declarative pipeline**: `content/mX-lY.ts` ? `LESSON_DEFINITIONS` ? generic `AcademyLessonPlayer` + `LessonScreenRenderer` | Strict UI/content separation; `/dashboard/academy/lesson/[milestoneId]` resolves from static registry |
| 2026-07-08 | Cohort overrides | Base `baseScreens` + per-cohort `screenOverrides` via `mergeScreenConfig` / `applyCohortScreenOverrides`; `_replace: true` for full screen swaps (e.g. Screen 8) | Same 8-screen structure with different narratives/items per Explorer / Pathfinder / Maverick without full duplication |
| 2026-07-08 | Generic DataDrivenLesson | **Deferred** ? prove pipeline with working lessons before a single mega-component | User-approved; current player + renderer switch is sufficient for Phase 1 |
| 2026-07-08 | Screen 8 completion helpers | `explorerCompletionScreen()` / `teenCompletionScreen()` in `completion-screen.ts`; Explorer uses `useStandardPane: true`, teens use fixed copy + `returnButtonLabel` | Consistent bronze unlock + XP flow; cohort completion UI via overrides |
| 2026-07-08 | Active-screen mounting | Only `flow.screenIndex` mounts `LessonScreenRenderer`; inactive carousel panes use `inert` + `aria-hidden` | Cuts DOM weight; prevents hidden bucket-sort instances from firing parent callbacks |
| 2026-07-08 | Bucket-sort layout variant | `layout: "spent-total"` + `SortItem.price` + `targetTotal` for two-column drag with live running total header | L3 Screen 2: purchasable items left, Spent bucket + `Total Amount Spent: $N` right (target $40) |
| 2026-07-08 | Link-match screen type | New `link-match` archetype + `LessonLinkMatchGame` ? tap event ? tap benefit; columns jumbled on load | L3 Screen 3 replaces static success state with real matching interaction |
| 2026-07-08 | Dashboard nav reliability | `DashboardNavLink` uses explicit `router.push()`; sidebar/bottom nav at `z-chrome` | Restores routing during lesson interactions; decoupled from lesson state |
| 2026-07-08 | Pointer capture hygiene | Bucket-sort releases `setPointerCapture` on up/cancel/unmount/`lostpointercapture` | Stuck capture was hijacking pointer events and killing sidebar clicks after drags |
| 2026-07-08 | Touch scope | Remove global `touchAction: "none"` from lesson carousel viewport; keep only on drag chips | Prevents viewport-level touch/click interference |
| 2026-07-08 | Academy content loading | No Supabase/database in nav or lesson content path ? `useLessonDefinition` reads in-memory registry | Future DB mirror must not block shell routing; `content/` is runtime source of truth (not import fixtures) |
| 2026-07-08 | Z-index architecture | Semantic `@theme` tokens + portal roots + `ModalShell`/`OverlayPortal` + ESLint ban on raw `z-[N]` | Predictable stacking: chrome (40) ? overlay (50) ? modal (60) ? toast (70) |
| 2026-07-08 | Layer isolation | `layer-island` (`isolation: isolate`) on lesson/journey containers | Local stacking stays contained; does not fight global chrome |
| 2026-07-08 | Ghost session QA reset | `/onboarding/start?reset=1` clears app session state via `clear-app-session-state.ts` | Enables birth-year re-entry and fresh-user testing without manual storage wipes |
| 2026-07-08 | M1-L3 shipment | Milestone 3 registered in `LESSON_DEFINITIONS`; skill mapping follows existing Level 1 spine | Third shipped lesson validates declarative pipeline at scale |
| 2026-07-20 | Large file refactoring for Cursor performance | Split `lesson-screen-renderer.tsx` into per-screen components under `components/academy/lesson/screens/`; split monolithic `types.ts` into `lib/academy/lessons/types/`; slim `academy-state.ts` and extract static content to `lib/dashboard/academy-content.ts`; extract Engine and Vault route bodies into dedicated dashboard components following the Academy thin-route pattern; add `.cursorignore` for import pipeline artifacts; resolve pre-existing ESLint warnings | Significantly reduces AI coding context bloat while preserving Separation of Concerns, declarative data-driven lessons, backward-compatible imports, and build integrity |
| 2026-07-26 | Academy design shell | Milestone `9001` at `/dashboard/academy/lesson/shell` ? dev/QA-only route (`notFound()` in production); exercises every registered lesson screen type; skips XP/milestone writes on Cash In | Single place to lock layout, spacing, and interaction before shipping real lessons; never appears on the Academy journey map |
| 2026-07-26 | Lesson screen standards SSOT | **`docs/academy-screen-types.md`** is the authoritative spec for all Academy lesson screens: typography scale, illustration omit/allow lists, global correct/incorrect feedback, minimal lesson chrome, and per-type locked behaviours | Any future lesson prompt or UI work references one doc instead of scattered shell notes |
| 2026-07-26 | Global lesson typography | Prompt/instruction `text-lg font-medium`; section/column titles `text-base font-semibold uppercase tracking-wide`; option/answer text `text-base font-medium` (never larger than prompt); feedback banners `text-base font-medium`; Next/Submit `text-lg font-semibold` ? tokens in `lesson-shared-styles.ts` | Uniform readable scale across all registered screen types; raised to match mobile readability after design-shell QA |
| 2026-07-26 | Lesson illustrations (omit/allow) | Optional illustration per screen; **omit by default** on dense types enforced by `DENSE_LESSON_SCREEN_TYPES` in `resolve-lesson-screen-illustration.ts` (`bucket-sort`, `tap-reveal`, `rank-order`, `link-match`, `savings-goal`, `budget-select`, `spotlight-rounds`, `allocation-slider`, `completion`); **allowed** on lighter types (`word-drop`, `binary-choice`, `true-false`, `hold-to-fill`, `drag-to-target`, `narrative-bonus`) | Preserves vertical space so Next stays reachable without forced page scroll |
| 2026-07-26 | Global lesson feedback | Correct ? green border + green check; incorrect ? red border + red X / screen flash; wrong answers never receive a success tick; every mistake triggers visible red feedback via `LessonChoiceIndicator`, `signalLessonIncorrectAnswer`, and persistent error toasts | Consistent mistake signalling across choice, icon, match, and sort interactions |
| 2026-07-26 | Locked game behaviours | **Link-match:** tap-and-pair with persistent cyan left selection, distinct solid pair colours, mismatch clears + red flash. **Rank-order:** numbers outside cards. **Drag-to-target:** icons as direct drag source. **Budget-select:** Next only when exact `correctIds` + within budget (`on-complete` only). **Spotlight-rounds:** wrong pick never ticked; ~450 ms recovery. **Narrative-bonus:** claim awards XP and advances in one tap | Interaction contracts frozen in design shell and documented per type |
| 2026-07-26 | Minimal lesson chrome | Lives (3 hearts) + slim progress bar + optional XP chip; footer Next disabled until screen ready; last screen uses Cash In / Collect Points | Duolingo-style focus; no dashboard stats or heavy chrome inside lesson routes |
| 2026-07-26 | Promoted standard screen types | M1-L2 custom renderers replaced by registered types: `budget-select`, `allocation-slider`, `rank-order`; `m1-l2-gift-reveal` later removed (see 2026-07-29) | Removes duplicate one-off implementations; shared game engines in `lesson-*-game.tsx` |
| 2026-07-26 | Shipped lesson migration | M1 L1?L4 content updated to the locked standards (typography tokens, feedback, layout compression, neutral bucket-sort headers, link-match tap-and-pair, spent-total vertical cards, tap-reveal shuffle, spotlight recovery, budget-select gating) | Production lessons match design shell behaviour; future lessons must follow `docs/academy-screen-types.md` |
| 2026-07-26 | Removed superseded lesson code | Dropped unused `validate-on-next` / `ValidationRule` pipeline; dead link-match connector/row components and unused match CSS tokens; unused `clearOnSuccess` hold-to-fill prop; spreadsheet archetype map updated to standard types | Keeps lesson codebase aligned with promoted screen types only |
| 2026-07-18 | M1-L4 shipment | Milestone 4 (**Pause Under Pressure**) registered in `LESSON_DEFINITIONS`; `shippedCohorts: ["explorer"]` only; rewards map to Skill 1 **Stop & Think** (bronze medal path) | Extends Level 1 fill; cohort-gated shipment avoids unfinished Pathfinder/Maverick copy |
| 2026-07-22 | Cohort-gated lesson shipment | Lesson meta may declare `shippedCohorts`; `canLaunchAcademyLesson()` / `isLessonShippedForCohort()` enforce launch. Current: L1?L2 all cohorts; L3 explorer+pathfinder; L4 explorer only | Lets a lesson ship for one mastery track without blocking the map for others |
| 2026-07-22 | Vault first-person copy | Vault youth-facing labels use first-person **My** framing (My Money, etc.) via `copyMatrix.dashboard.vault` | Matches peer voice; keeps Vault personal rather than bank-admin tone |
| 2026-07-22 | Parent Hub learning track (early) | PIN-protected birth-year / learning-track controls land in Settings Parent Hub | Parents can correct age-track without leaving Settings; PIN keeps child from self-changing cohort |
| 2026-07-28 | Parent Hub learning-track reset | `changeUserLearningTrack()` updates ghost-session birth year; on mastery-cohort change, `resetLearningProgress()` clears Academy milestones + Vault skill trophy overrides and dispatches `LEARNING_PROGRESS_RESET_EVENT` | Prevents progress from a prior age band leaking into a newly selected track |
| 2026-07-28 | Academy journey map chrome | Remove rendered **Mission Map** heading; widen module-to-lesson spacing; raise journey-map typography to lesson content scale | Reduces redundant chrome; map reads as one composition with module signposts as the primary labels |
| 2026-07-29 | Academy module preview | Module signpost tiles are tappable; `AcademyModulePreviewModal` shows full module title, description, and **Skills you'll learn** list from `skillsForLevel()` | Gives orientation before entering lessons without leaving the journey map |
| 2026-07-29 | Gift-reveal retirement | M1-L2 close beat replaces custom `m1-l2-gift-reveal` with registered `drag-to-target` (`gift-delivery`) + `explorerCompletionScreen()`; `custom` screen type remains in the union but has no live renderer registry | Eliminates the last one-off lesson renderer; all shipped screens use standard types |
| 2026-07-29 | Multi-select choice evaluation | Shared choice evaluation avoids false penalties / error flashes on multi-select screens until the selection set is wrong in a committed way | Stops premature red feedback that punished incomplete-but-valid multi-select states |
| 2026-07-29 | Allocation-slider lesson UX | Non-punitive slider flow, thumb alignment, and layout stability locked for `allocation-slider` screens | Matches Vault teaching metaphor without draining lives on exploratory slider motion |
| 2026-07-30 | Vault 2.0 becomes Vault | Legacy Vault UI removed; former Vault 2.0 is the sole `/dashboard/vault` experience (My Money carousel, modal allocation, jar + savings-goal management) | One Vault surface; beta naming retired once the rebuild replaced the original |
| 2026-07-30 | Vault independent storage | `VaultProfileProvider` + `nga_vault_session_v1` / `nga_vault_profile_v1` (with legacy `nga_vault_v2_*` migration). Wallet context retains XP/conversion only | Isolates sandbox money state from XP wallet; supports guest?registered promotion without rewriting lesson code |
| 2026-07-30 | Advanced Money Tools route | Compounding (**Growth Potential**) and categorized ledger move to `/dashboard/advanced-money-tools`; inserted in nav after Achievements via `withAdvancedMoneyToolsNavItem()`; tool cards **collapsed by default** | Keeps Vault focused on allocation/jars; advanced calculators are opt-in expanders |
| 2026-07-30 | Global status header scope | Sticky global header shows **Ghost Mode badge only** (hidden on lesson routes; suppressed on Academy). XP / streak / streak-freeze pills removed from global chrome | Reduces header clutter; Academy momentum chrome is not wired in the current shell |
| 2026-07-31 | Launchpad + Vault rebrand | User-facing **Engine ? Launchpad** (`/dashboard/launchpad`, `lib/launchpad/`, rocket nav icon). **Vault-v2 ? Vault**. Permanent redirects in `next.config.ts`. Titles omit "The " prefix (`CLAUDE.md` invariant) | Clearer youth language (launch businesses); ends dual Vault naming; preserves old URLs |
| 2026-07-31 | Launchpad venture directory | Full business-ideas carousel with freemium / premium-locked / age-locked slots, discovery brief drawers, and cohort unavailable + paywall modals (`venture-blueprints.ts`) | Makes Launchpad a real directory rather than a thin demo strip while keeping premium/age gates explicit |
| 2026-07-31 | Illustration asset registry | Master registry `lib/academy/illustrations/illustration-registry.ts` maps `illustrationId` ? `/assets/illustrations/...`; medal registry in `medal-registry.ts`; screens prefer `illustrationId` with legacy emoji `illustration` fallback via `resolveLessonScreenIllustration()` | Typed asset IDs replace ad-hoc emoji scenes; medals/concepts share one public asset tree |
| 2026-07-31 | Vault savings goals management | Dedicated manage + allocate modals for Save Jar savings goals (`VaultManageSavingsGoalsModal`, `VaultSavingsGoalAllocationModal`) | Treats goals as first-class Vault objects, not inline-only controls |
| 2026-08-01 | Borderless lesson illustrations | `LessonIllustrationSlot` renders registry images / emoji **without bordered frames** | Illustration reads as scene art, not a card chrome element |
| 2026-08-01 | Screen 8 completion composition | Standard Explorer pane (`LessonCompletionPane`) and teen completion path share confetti (`LessonCompletionConfetti`), hero medal (`LessonSkillMedal` + `medalId`), and rewards summary (`LessonCompletionRewardsCard`). `explorerCompletionScreen(..., medalId)` wires medal assets | One celebratory completion language across cohorts while keeping Explorer `useStandardPane` vs teen fixed-copy split |

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
| Generic DataDrivenLesson component | Deferred | Revisit after 4?6 lessons stable in registry pipeline |
| Spreadsheet ? lesson import at scale | Partial | Templates + import scripts ship; L5?L9 content fill in progress; L4 Explorer shipped |
| Lesson side-effect ESLint rule | Open | Consider custom rule banning parent callbacks inside `setState` updaters in `components/academy/lesson/` |
| Academy lesson Supabase mirror | Open | Registry remains TS source of truth; no runtime DB fetch for lesson content yet |
| `docs/academy-screen-types.md` gift-reveal stale note | Open | Doc still mentions retired `m1-l2-gift-reveal`; code uses `drag-to-target` ? doc sync pending |
| Achievements copy "Engine" string | Open | `copyMatrix` achievements blurb still says Engine; should say Launchpad |
| Academy momentum header wiring | Open | `AcademyMomentumHeader` exists but is not mounted; global header intentionally minimal |

---

*Last updated: 2026-08-03*
