# NextGenAchievers V2.0 Master Roadmap



> **Stack compliance:** All work follows `CLAUDE.md` - Next.js (App Router), TypeScript (strict), Tailwind CSS, Supabase, Vercel, xAI Grok only (no OpenAI). Mobile-responsive PWA; no native hardware dependencies.

> **App avatar guide:** All in-app mentor voice, activity logs, and youth-facing copy reference **Finn** as the sole guide persona across Academy, Engine, and Vault hubs.

> **Decision log:** Finalized architecture choices live in `DECISIONS_LOG.md`. Invariant agent rules live in `CLAUDE.md`.



---



### 🎨 Milestone 1: Brand Asset & Style Validation

- [x] Task 1.1: Map official corporate HEX colors in configuration (Primary Base: #031F82, Background/Panels: #BDE9FB, Secondary Blue: #0CC1E0, CTA Accent: #FFA503, Design Accent: #DCB766).

- [x] Task 1.2: Configure brand typography via Next.js Google Fonts (Poppins for bold interactive headings, Inter for clean body text).

- [x] Task 1.3: Style Verification Gate: Create a dedicated test page at `/design-system` displaying these exact HEX colors, typography weights, and button components to visually verify the palette looks perfect.



---



### 🛡️ Milestone 2: Frictionless Onboarding Phase A

- [x] Task 2.1: Build the 5-Second Personalization Gate - collect Birth Year and Username only (`/onboarding/start`).

- [x] Task 2.2: Instant Ghost Routing - route users straight into the app dashboard with temporary Ghost Access (no password or parental stage-gate upfront). Ghost sessions persist in `sessionStorage`; onboarding routes to `/dashboard/academy`.

- [x] Task 2.3: Ghost Session QA Reset - visit `/onboarding/start?reset=1` to wipe ghost session data and re-enter the birth-year personalization gate as a new user (`clear-app-session-state.ts`, `OnboardingFreshStartReset`). **(COMPLETE — dev/QA helper only.)**



---



### 📊 Milestone 3: Core App Shell & Skeletons *(SUBSTANTIALLY COMPLETE)*



**Current execution notes:**

- Task 3.1 is complete: the dashboard shell ships with a desktop left sidebar, mobile bottom navigation, sticky compact status header (XP + streak + streak-freeze pills + Ghost Mode badge), ghost-session route protection via `DashboardShell`, and app-wide wallet state via `DashboardProviders` → `DashboardWalletProvider` at the dashboard layout root (persists XP balance, parent conversion rate, jar balances, and Vault unallocated AUD pool to `sessionStorage` via `dashboard-wallet-storage.ts`).

- `/dashboard` server-redirects to `/dashboard/academy`, making **The Academy** the default application landing page. Five-pillar navigation (Academy, Engine, Vault, Achievements, Settings) is wired in `lib/dashboard/navigation.ts` for both sidebar and bottom nav. Legacy `/dashboard/home` redirects to Settings.

- **Visual alignment sprint (complete):** The entire application shell - Academy, Engine, Vault, Achievements, and Settings - uses a borderless, minimalist, floating Duolingo-style spatial layout. Heavy grid boxes, rigid panel borders, and straight connector lines have been removed in favor of open white canvas spacing and soft `shadow-md` floating tiles.

- **Global typography & header standardization (complete):** All hub section titles route through the shared `DashboardSectionHeading` component - centered Poppins (`font-heading`) tokens at `text-lg font-extrabold text-nga-primary sm:text-xl` - ensuring visual parity across all hubs.

- **Journey path connectors (complete):** Linear vertical connector lines on Academy and Engine journey maps have been replaced by curved, progress-faded **dotted SVG cubic-bezier paths** (`JourneyPathBridge`) that bridge center-to-center between zigzag milestone nodes. Walked path segments render in solid medium grey (`#6B7280`); future path segments fade at `opacity-35`.

- **Child-initiated points cash-out engine & Save Jar bridge (complete):** Settings Child Mode ships the **Cash In Your Points** panel - flipped conversion rate slider logic ($0.50–$5.00 AUD per 100 XP), unified numeric XP input (editable; **Convert Full Points Balance** auto-populates max available balance), live AUD readout, virtual-money disclaimer, and **Claim Cash Reward** success modal. `claimPointsForVault()` deducts XP and credits the shared **Save Jar** balance directly (protected from Money to Allocate Reset wipes). Jar balances persist via `sessionStorage` with zero state drop between hub navigation; children can still recall funds from Save into Spend or Give via Vault allocation mechanics.

- **Settings** (`/dashboard/settings`) hosts Account & Settings links, Shared Device Parent Mode toggle (4-digit PIN gate via `parent-pin.ts`), and the point-conversion workspace. In Parent Mode, parents set the AUD-per-100-XP conversion rate slider with no child payout triggers. Global XP in the status header reads from the same wallet context.

- **The Academy** (`/dashboard/academy`) ships a high-engagement, scrollable, Duolingo-inspired vertical lesson roadmap - sticky context banner (`AcademyContextBanner`), 54 Phase 1 milestone nodes (6 Levels × 9 Lessons) with level signposts, dotted path progression, Maverick age-gating on Levels 5–6, and cohort-aware state from `academy-state.ts` + `academy-progress-storage.ts`. **Three interactive lessons are shipped:** M1-L1 (Stop & Think), M1-L2 (Put Needs First), and M1-L3 (Spare Cash) — each an 8-screen flow via the **registry-driven generic player** (`AcademyLessonPlayer`, `LessonScreenRenderer`, `useLessonFlow`). Content lives in `lib/academy/lessons/content/` with cohort overrides; spreadsheet import tooling lives in `templates/lesson-authoring/` + `tools/import-lesson-from-sheet.mjs`.

- **Academy lesson pipeline (complete — foundation):** Monolithic per-lesson TSX removed; declarative `ScreenConfig` union, cohort override merge, shared completion helpers, and new interaction archetypes (`link-match`, `bucket-sort` with `spent-total` layout) ship in the generic renderer. Only the active lesson screen mounts live interactive content.

- **Semantic UI layering (complete):** Centralized `@theme` z-index tokens, portal roots (`#overlay-root`, `#modal-root`, `#toast-root`), shared `ModalShell` / `OverlayPortal`, and ESLint guard against ad-hoc z-index values. Dashboard nav restored during lesson interactions (explicit routing, pointer-capture cleanup, scoped touch handling).

- **The Engine** (`/dashboard/engine`) ships a premium, mobile-first operating layout: dual horizontal carousels (In Progress ventures + All Business Ideas deck), discovery-brief launch drawers, safe close-shop confirmation flows, and a dynamic bottom canvas consuming 50% viewport height with a 4-node zigzag venture journey map (dotted path connectors + Step 3 demo state) synced to the selected active venture. Finn voice copy drives all mentor prompts.

- **The Vault** (`/dashboard/vault`) ships a Money Allocation workspace - savings motivation scoreboard (live-linked to Save Jar balance), **Allocate Your Income** deposit funnel, **Money to Allocate** holding pool (manual deposits only; AUD-formatted) with typo-safe Reset, foundational **Spend, Save, Give** jars (Save Jar fed by Settings point conversions) plus a premium custom-jar teaser, Finn's Activity Log accordion, and full bidirectional allocator + time-machine compounding plumbing. Skill medals moved to the Achievements hub.

- **Achievements** (`/dashboard/achievements`) ships a five-section dashboard: **Your Skills** (18-skill medal carousel with cohort-scoped counts for Explorer / Pathfinder / Maverick), Learning Streaks, Money Milestones, Monthly Challenges, and Social Friends leaderboard - all driven from local state scaffolds pending Supabase wiring.

- **18-Skill Level Registry (complete — schema + app layer):** Universal progression is built **Levels-up** (6 Levels × 3 Skills = 18 achievements). TypeScript source of truth lives in `lib/skills/skills-registry.ts` (`SKILLS_LEVELS`, `SKILLS_REGISTRY`). Supabase migrations ship `skills_registry` with `level_id`, `skill_number`, `is_advanced_cohort_only`, cohort boundary CHECK constraint, and indexed cohort filters. Cohort-aware fetch helpers live in `lib/skills/skills-registry-query.ts`; trophy UI scaffolds in `lib/dashboard/skill-trophies.ts`. Skills 1–12 are universal; Skills 13–18 are Maverick-only (ages 16–18). **Supabase client runtime queries are not yet wired** - all reads use the in-memory registry mirror.

- **Active technical backlog (remaining within Milestone 3):** Task 3.4 (gamified adaptive placement quiz), Task 3.7 (Parent Incentive Engine interface), and Task 3.18 (Level 1 lesson content fill via spreadsheet pipeline). Downstream Milestone 4, Milestone 5, Sprint 4, Sprint 5, and Sprint 6 items are catalogued below.



- [x] Task 3.1: Core Shell - build the main application dashboard structure that replaces the onboarding screen permanently post-entry. **(COMPLETE - Desktop sidebar + mobile bottom nav, sticky compact status pills for XP / streak / streak freezes, Ghost Mode badge, ghost-session guard, and layout-root `DashboardProviders` / `DashboardWalletProvider` with `sessionStorage` wallet + jar persistence across hub navigation.)**

- [x] Task 3.2: The Three Front Doors - scaffold main landing hubs for The Academy, The Engine, and The Vault. **(COMPLETE - All primary hubs (Academy + Engine + Vault + Achievements + Settings) are built with premium, mobile-first, high-fidelity responsive layouts.)** *(Visual sub-note: entire application shell refactored to borderless, minimalist, floating Duolingo-style spatial layout - no heavy grid boxes or rigid containment lines.)*

- [x] Task 3.3: 18-Skill Level Registry Schema - build the Supabase database schema and application registry for the universal 18-Skill library organised by 6 progression Levels (3 skills each), with `level_id`, `skill_number`, and `is_advanced_cohort_only` cohort flags. **(COMPLETE - Migrations `20250611000000` through `20250611000003`; TypeScript mirror in `lib/skills/`; RLS read policy; cohort boundary CHECK constraint. User progress tier tracking in Supabase remains pending placement quiz + auth wiring.)**

- [ ] Task 3.4: Gamified Adaptive Placement Quiz - build the interactive, Duolingo-style placement flow that updates skill tiers in the database upon completion.

- [x] Task 3.5: The Vault Allocator (Bidirectional Jars) - Build the sandbox management bank layout supporting manual logging of real-world income, foundational Spend, Save, and Give jars, fluidly adjustable custom jars, and bidirectional Money Allocation mechanics with ADD/RECALL ledger actions. **(COMPLETE - Intuitive tile-tapping interaction physics, clear ADD/RECALL modifiers, custom jar premium paywall placeholders, foundational Spend / Save / Give jars, unallocated-pool Reset for deposit typos, coin-flying micro-animations, shared jar balances in wallet context, and Settings→Vault Save Jar direct deposit via `claimPointsForVault()`. Finn narrates all ledger activity.)** *(Visual sub-note: Vault refactored to match Academy and Engine borderless floating Duolingo-style panels - white canvas, soft shadows, no heavy grid boxes.)*

- [x] Task 3.6: The Savings Time-Machine Widget - Build an interactive sandbox compounding widget inside The Vault that pulls live Save Jar balances by default, features interactive sliders for "Years Saved" and "Weekly Top-Up", and accepts text input for manual principal overrides. **(COMPLETE - Fully plumbing-linked to the live Total Savings scoreboard and Save Jar state. Includes interactive sliders for years, weekly top-ups, a dynamic expected return ROI slider, and a compliance safety trigger warning card that activates at 12%+ ROI to caution users about high-risk volatility.)**

- [ ] Task 3.7: Parent Incentive Engine Interface - Build a parent-facing configuration settings view to establish custom financial cash payouts tied to app metrics (e.g., streaks, XP). Must support triggering a celebration card and writing a "Pending Parent Payout" line-item directly to the child's Vault feed.

- [x] Task 3.8: Global Typography & Header Standardization - unify hub section titles via shared `DashboardSectionHeading` component using centered Poppins tokens (`font-heading text-lg font-extrabold text-nga-primary sm:text-xl`) across all dashboard hubs.

- [x] Task 3.9: Navigation Pivot - migrate from the original 3-tab layout to a multi-pillar navigation model with `/dashboard/academy` as the default landing node (`/dashboard` server-redirect, onboarding ghost route, sidebar + bottom nav wired in `lib/dashboard/navigation.ts`). Settings hub consolidates account, Parent Mode, and point conversion (legacy `/dashboard/home` redirects to Settings).

- [x] Task 3.10: Curved Dotted Journey Lines - replace linear vertical connectors with smooth SVG cubic-bezier dotted path bridges (`JourneyPathBridge`) connecting milestone nodes center-to-center on Academy and Engine journey maps, with progress-faded walked vs. future segments.

- [x] Task 3.11: Child-Initiated Point Conversion Interface - ship Settings Child Mode **Cash In Your Points** panel with flipped conversion rate slider ($0.50–$5.00 AUD per 100 XP), virtual-money disclaimer, full-balance input auto-population, live AUD readout, Claim Cash Reward success modal, and direct routing of converted funds into the Vault **Save Jar** balance via shared wallet context + `sessionStorage` persistence.

- [x] Task 3.12: Mastery Cohort Skill Gating - map birth year to Explorer (10–12), Pathfinder (13–15), and Maverick (16–18) cohorts; enforce Skills 1–12 as universal and Skills 13–18 as Maverick-only across registry queries, trophy UI, and Academy Level 5–6 signpost locks (`lib/dashboard/mastery-cohort.ts`, `lib/skills/skills-registry-query.ts`).

- [x] Task 3.13: Academy Phase 1 Milestone Scaffold - build the 54-node lesson journey (6 Levels × 9 Lessons) with level signposts, boss-node checkpoints, context banner, sessionStorage progress persistence, and cohort-gated advanced levels (`academy-state.ts`, `academy-progress-storage.ts`, `academy-skill-track.tsx`).

- [x] Task 3.14: Interactive Academy Lessons (Slice One) - ship M1-L1 (*Money In, Money Out* → Skill: Stop & Think), M1-L2 (*Needs vs Wants Sort* → Skill: Put Needs First), and M1-L3 (*Spare Cash* → Skill 3) as full 8-screen interactive lesson flows via the registry-driven generic player, with mistake tracking, XP awards, bronze skill unlock on completion, and replay-safe routing (`lib/academy/lessons/registry.ts`, `lib/academy/lessons/content/`). *(Expanded from original 2-lesson slice; monolithic `m1-l1-lesson.tsx` / `m1-l2-lesson.tsx` removed.)*

- [x] Task 3.15: Achievements Hub - build `/dashboard/achievements` with tiered skill medal carousel (Bronze / Silver / Gold / Locked scaffolds), learning streak milestones, money milestones, monthly challenges, and social friends leaderboard sections (`components/achievements/`, `lib/dashboard/achievements-state.ts`, `lib/dashboard/skill-trophies.ts`).

- [x] Task 3.16: Parent PIN Gate (Local) - implement 4-digit PIN setup, verification, and recovery flow securing the Parent Mode toggle in Settings (`lib/dashboard/parent-pin.ts`, `home-dashboard.tsx`). *(SessionStorage-only; no Supabase auth binding yet.)*

- [x] Task 3.17: Semantic UI Layering System - centralize stacking contexts with `@theme` z-index tokens, portal roots in root layout, shared modal/overlay portal components, migration of hub modals and lesson overlays, `layer-island` isolation on lesson/journey containers, and ESLint rule banning raw numeric z-index. **(COMPLETE)**

- [ ] Task 3.18: Academy Lesson Authoring Pipeline (Scale) - non-developer spreadsheet workflow (`templates/lesson-authoring/`), import scripts, cohort override pattern, and Level 1 lesson fill (L4–L9). **(IN PROGRESS — L1–L3 shipped; L4 import fixtures exist; author self-service docs in `INSTRUCTIONS.md`.)**

- [x] Task 3.19: Lesson Runtime Stability - fix React cross-component update errors in bucket-sort flow via deferred action queues; mount only the active lesson screen; restore dashboard nav during lesson interactions (explicit `router.push`, pointer-capture cleanup, scoped touch handling). **(COMPLETE)**



---



### 🔐 Milestone 4: Retrospective Progress Gates

- [ ] Task 4.1: Titan Progress Saver (14+) - prompt for a password to save progress and lock in streaks when the user needs persistence.

- [ ] Task 4.2: Explorer Parent Consent (<14) - prompt for a Parent's Email to trigger an asynchronous Magic Link consent flow, placing the app in a data-restricted Sandbox Mode until approved. *(Route stub exists at `/onboarding/parent-consent`; magic-link flow not implemented.)*

- [ ] Task 4.5: The Retrospective Shortcut Engine - Build the cross-progression highway tracking real-world checklist completions in The Engine to auto-resolve parallel theoretical modules in The Academy, triggering a "Shortcut Unlocked" visual notification and bonus XP.

- [ ] Task 4.6: Tiered Achievements Cabinet - Build a gamified master skills matrix that dynamically graduates user achievement badges from Bronze (Theory mastered) → Silver (Vault/Action completed) → Gold (True cross-progression breakthrough). *(Partial: Achievements hub ships local Bronze tier unlocks from lessons + `vault-skill-progress-storage.ts`; Silver/Gold graduation and cross-progression logic not wired.)*



---



### 🚪 Milestone 5: Freemium Horizontal Slice

- [ ] Task 5.1: Paywall Layer - lock premium dashboards behind high-energy CTA orange (#FFA503) prompts. *(Design-system preview label only; Vault custom-jar premium modal is a local placeholder.)*

- [ ] Task 5.2: Slice One Content - ship the horizontal slice (1 active foundational learning mission, 1 operational entry-level Venture Pack template, 1 basic Vault tool layout). *(Partial: 3 Academy lessons + declarative lesson pipeline + full Vault allocator ship; Engine venture template remains demo/scaffold state.)*



---



### 🎮 Sprint 4: Gamification, Profile & Security *(Local State & UI)*

- [ ] **Gamified Utility Points Allocation:** Map static lesson activity parameters (10 XP standard milestones, 20 XP hard action items, Double XP finishes) into our local state configuration. *(Partial: M1-L1/M1-L2/M1-L3 ship fixed XP + perfect-streak bonus via `awardLessonXp()`; global XP constants not yet standardised across all lesson types.)*

- [ ] **Parent Rewards Marketplace (Vault Section):** Create a visual card component layout at the base of the Vault for exchanging point balances for custom parent-fulfilled rewards (screen time, movie nights, etc.).

- [ ] **The Gamified Store Engine (Streak Freezes):** Build an interactive profile shop interface allowing kids to spend earned XP to buy out or renew Daily Streak Freezes dynamically.

- [x] **Parental Gate Security Layer:** Evaluate and implement a 4-digit PIN lock or app-wide parent access PIN to secure the "Switch to Parent Mode" navigation toggle from child access. *(COMPLETE locally via `parent-pin.ts` + Settings Parent Mode flow; recovery PIN + simulated email dispatch only.)*



---



### ☁️ Sprint 5: Database & Infrastructure Integration *(Supabase & External Services)*

- [ ] **Supabase Skills Registry Runtime Wiring:** Connect the app to live `skills_registry` queries using cohort-scoped PostgREST filters (`skillsRegistryPostgrestFilter`) instead of the in-memory TypeScript mirror.

- [ ] **Multi-Device Session Auth Architecture:** Configure Supabase Auth logic to smoothly handle concurrent, distinct parent and child login sessions across completely separate physical devices.

- [ ] **Asynchronous Parent Payout Alerts:** Integrate background transactional communication workers (via Resend email templates or Twilio SMS) to automatically notify parents when a child triggers a points cash-out simulation.

- [ ] **Device Native Push Notifications:** Set up progressive web app (PWA) push notification service workers to fire alerts to a user's device when a daily streak is at risk of breaking.



---



### 📚 Sprint 6: Academy Content & Authoring *(Spreadsheet → Registry → Ship)*

**Goal:** Enable non-developer lesson authoring and fill Level 1 (L4–L9) without new monolithic lesson components.

- [x] **Declarative lesson architecture** - registry-driven generic player, `ScreenConfig` union, `useLessonFlow`, cohort override merge, shared completion helpers. **(COMPLETE)**

- [x] **Spreadsheet authoring templates** - `templates/lesson-authoring/` (`Lesson-Details.csv`, `Screens.csv`, lookup sheets, `INSTRUCTIONS.md`, example M1-L1 folder). **(COMPLETE)**

- [x] **Import tooling** - `npm run lesson:import` and `npm run lesson:import:explorer` via `tools/import-lesson-from-sheet.mjs` and `tools/import-explorer-workbook.mjs`. **(COMPLETE)**

- [ ] **Level 1 lessons L4–L9** - author via spreadsheet pipeline, import, register in `LESSON_REGISTRY`, browser QA per cohort. *(L4 fixtures exist under `content/data/explorer/`; not yet shipped.)*

- [ ] **M1-L3 cohort overrides** - Explorer and Maverick narrative variants via `screenOverrides` once copy is ready.

- [ ] **M1-L2 Pathfinder variant** - teen copy overrides when Pathfinder content is finalized. *(Lower priority.)*

- [ ] **Game-Types catalog sync** - document `link-match` and `spent-total` bucket-sort layout in `Game-Types.csv` for content authors.

- [ ] **Import fixture cleanup** - resolve TypeScript errors in `content/data/explorer/` generated files (staging output only; runtime content in `content/mX-lY.ts`).

- [ ] **Lesson side-effect lint guard** - optional ESLint rule banning parent callbacks inside `setState` updaters in `components/academy/lesson/`.

- [ ] **Generic DataDrivenLesson component** - deferred until 4–6 lessons are stable in the current pipeline. *(See `DECISIONS_LOG.md`.)*



---

*Last updated: 2026-07-08*
