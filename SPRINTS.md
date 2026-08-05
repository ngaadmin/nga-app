# NextGenAchievers V2.0 Master Roadmap



> **Stack compliance:** All work follows `CLAUDE.md` - Next.js (App Router), TypeScript (strict), Tailwind CSS, Supabase, Vercel, xAI Grok only (no OpenAI). Mobile-responsive PWA; no native hardware dependencies.

> **App avatar guide:** All in-app mentor voice, activity logs, and youth-facing copy reference **Finn** as the sole guide persona across Academy, Launchpad, and Vault hubs.

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

- Task 3.1 is complete: the dashboard shell ships with a desktop left sidebar, mobile bottom navigation, ghost-session route protection via `DashboardShell`, and app-wide providers via `DashboardProviders` at the dashboard layout root (`DashboardWalletProvider` for XP/conversion; `VaultProfileProvider` for Vault jars/profile). Global sticky header shows **Ghost Mode badge only** (no XP/streak pills); lesson routes hide the header.

- `/dashboard` server-redirects to `/dashboard/academy`, making **Academy** the default application landing page. Five-pillar navigation (Academy, Launchpad, Vault, Achievements, Settings) is wired in `lib/dashboard/navigation.ts`. **Advanced Money** is inserted after Achievements via `withAdvancedMoneyToolsNavItem()`. Legacy `/dashboard/home` → Settings; `/dashboard/engine` → Launchpad; `/dashboard/vault-v2` → Vault (permanent redirects in `next.config.ts`).

- **Visual alignment sprint (complete):** The entire application shell uses a borderless, minimalist, floating Duolingo-style spatial layout. Heavy grid boxes, rigid panel borders, and straight connector lines have been removed in favor of open white canvas spacing and soft `shadow-md` floating tiles. Hub titles omit the "The " prefix.

- **Global typography & header standardization (complete):** Hub section titles route through shared heading patterns (Poppins / `font-heading`, primary brand blue) for visual parity across hubs.

- **Journey path connectors (complete):** Linear vertical connector lines on Academy and Launchpad journey maps have been replaced by curved, progress-faded **dotted SVG cubic-bezier paths** (`JourneyPathBridge`).

- **Child-initiated points cash-out engine & Save Jar bridge (complete):** Settings Child Mode ships the **Cash In Your Points** panel — conversion rate slider ($0.50–$5.00 AUD per 100 XP), unified numeric XP input, live AUD readout, virtual-money disclaimer, and claim success modal. Converted funds credit the Vault **Save Jar** via shared wallet ↔ vault profile flows.

- **Settings** (`/dashboard/settings`) hosts Account & Settings links, Shared Device Parent Mode toggle (4-digit PIN via `parent-pin.ts`), point-conversion workspace, and **Parent Hub** features including **learning-track controls** (`ParentLearningTrackPanel` → `changeUserLearningTrack()` with progress reset on cohort change).

- **Academy** (`/dashboard/academy`) ships a Duolingo-inspired vertical lesson roadmap — 54 Phase 1 milestone nodes (6 Levels × 9 Lessons) with module signposts, dotted path progression, Maverick age-gating on Levels 5–6, and cohort-aware state from `academy-state.ts` + `academy-progress-storage.ts`. Module tiles open a preview modal with skill list. Mission Map heading removed. **Four interactive lessons are shipped via `LESSON_DEFINITIONS`:** M1-L1, M1-L2, M1-L3 (explorer+pathfinder), M1-L4 (explorer only) — each an 8-screen flow via `AcademyLessonPlayer` + `LessonScreenRenderer` + `useLessonFlow`. Content lives in `lib/academy/lessons/content/`. Design shell at `/dashboard/academy/lesson/shell` (dev/QA only; 404 in production). Screen standards SSOT: `docs/academy-screen-types.md`.

- **Academy lesson pipeline (complete — foundation + standards):** Declarative `ScreenConfig` union (16 types), cohort override merge, shared completion helpers, locked interaction behaviours, illustration omit/allow rules, and `illustrationId` registry (`lib/academy/illustrations/`). Custom `m1-l2-gift-reveal` retired in favor of `drag-to-target`. Screen 8 uses confetti + medal + rewards card composition. Only the active lesson screen mounts live interactive content.

- **Semantic UI layering (complete):** Centralized `@theme` z-index tokens, portal roots, shared `ModalShell` / `OverlayPortal`, and ESLint guard against ad-hoc z-index values. Dashboard nav remains usable during lesson interactions.

- **Launchpad** (`/dashboard/launchpad`, formerly Engine) ships dual horizontal carousels (In Progress + All Business Ideas), freemium / premium / age-track locks, discovery-brief launch drawers, close-shop confirmation, and a dynamic bottom venture journey map synced to the selected active venture. Finn voice copy drives mentor prompts. Blueprints in `lib/launchpad/venture-blueprints.ts`.

- **Vault** (`/dashboard/vault`) is the former Vault 2.0 experience — My Money tile/carousel, modal allocation, jar management, savings goals management, income deposit with virtual-money disclaimer, and independent `nga_vault_*` session/profile storage. Legacy Vault UI removed. Compounding and categorized ledger live under **Advanced Money Tools**.

- **Advanced Money** (`/dashboard/advanced-money-tools`) ships Growth Potential (compounding + ≥12% ROI warning) and Ledger panels as collapsed-by-default tool cards.

- **Achievements** (`/dashboard/achievements`) ships a five-section dashboard: **Your Skills** (18-skill medal carousel with cohort-scoped counts), Learning Streaks, Money Milestones, Monthly Challenges, and Social Friends leaderboard — local state scaffolds pending Supabase wiring.

- **18-Skill Level Registry (complete — schema + app layer):** Universal progression is **Levels-up** (6 Levels × 3 Skills = 18 achievements). TypeScript source of truth in `lib/skills/skills-registry.ts`. Supabase migrations ship `skills_registry` with cohort flags. Runtime reads still use the in-memory mirror (Sprint 5).

- **Active technical backlog (remaining within Milestone 3):** Task 3.4 (gamified adaptive placement quiz), Task 3.7 (Parent Incentive Engine interface), and Task 3.18 (Level 1 lesson content fill L5–L9 + remaining cohort variants). Downstream Milestone 4, Milestone 5, Sprint 4, Sprint 5, and Sprint 6 items are catalogued below.



- [x] Task 3.1: Core Shell - build the main application dashboard structure that replaces the onboarding screen permanently post-entry. **(COMPLETE - Desktop sidebar + mobile bottom nav, Ghost Mode badge, ghost-session guard, layout-root providers for wallet XP + Vault profile persistence across hub navigation.)**

- [x] Task 3.2: The Three Front Doors - scaffold main landing hubs for Academy, Launchpad, and Vault. **(COMPLETE - All primary hubs (Academy + Launchpad + Vault + Achievements + Settings) plus Advanced Money Tools are built with premium, mobile-first, high-fidelity responsive layouts.)** *(Visual sub-note: entire application shell refactored to borderless, minimalist, floating Duolingo-style spatial layout - no heavy grid boxes or rigid containment lines.)*

- [x] Task 3.3: 18-Skill Level Registry Schema - build the Supabase database schema and application registry for the universal 18-Skill library organised by 6 progression Levels (3 skills each), with `level_id`, `skill_number`, and `is_advanced_cohort_only` cohort flags. **(COMPLETE - Migrations `20250611000000` through `20250611000003`; TypeScript mirror in `lib/skills/`; RLS read policy; cohort boundary CHECK constraint. User progress tier tracking in Supabase remains pending placement quiz + auth wiring.)**

- [ ] Task 3.4: Gamified Adaptive Placement Quiz - build the interactive, Duolingo-style placement flow that updates skill tiers in the database upon completion.

- [x] Task 3.5: The Vault Allocator (Bidirectional Jars) - Build the sandbox management bank layout supporting manual logging of real-world income, foundational Spend, Save, and Give jars, fluidly adjustable custom jars, and bidirectional Money Allocation mechanics with ADD/RECALL ledger actions. **(COMPLETE - Vault 2.0 My Money / modal allocation / jar management experience is now the sole Vault. Save Jar + savings goals, shared point-conversion credit path, independent vault profile storage, Finn-narrated ledger activity under Advanced Money.)**

- [x] Task 3.6: The Savings Time-Machine Widget - Build an interactive sandbox compounding widget that pulls live Save Jar balances by default, features interactive sliders for "Years Saved" and "Weekly Top-Up", and accepts text input for manual principal overrides. **(COMPLETE - Relocated to Advanced Money → Growth Potential. Still plumbing-linked to live savings totals. Includes years / weekly top-up / ROI sliders and ≥12% ROI compliance warning.)**

- [ ] Task 3.7: Parent Incentive Engine Interface - Build a parent-facing configuration settings view to establish custom financial cash payouts tied to app metrics (e.g., streaks, XP). Must support triggering a celebration card and writing a "Pending Parent Payout" line-item directly to the child's Vault feed.

- [x] Task 3.8: Global Typography & Header Standardization - unify hub section titles via shared heading components using centered Poppins tokens across all dashboard hubs.

- [x] Task 3.9: Navigation Pivot - migrate from the original 3-tab layout to a multi-pillar navigation model with `/dashboard/academy` as the default landing node. Settings hub consolidates account, Parent Mode, and point conversion (legacy `/dashboard/home` redirects to Settings). **Engine → Launchpad and Vault-v2 → Vault redirects complete (2026-07-31).**

- [x] Task 3.10: Curved Dotted Journey Lines - replace linear vertical connectors with smooth SVG cubic-bezier dotted path bridges (`JourneyPathBridge`) connecting milestone nodes center-to-center on Academy and Launchpad journey maps, with progress-faded walked vs. future segments.

- [x] Task 3.11: Child-Initiated Point Conversion Interface - ship Settings Child Mode **Cash In Your Points** panel with flipped conversion rate slider ($0.50–$5.00 AUD per 100 XP), virtual-money disclaimer, full-balance input auto-population, live AUD readout, Claim Cash Reward success modal, and direct routing of converted funds into the Vault **Save Jar** balance.

- [x] Task 3.12: Mastery Cohort Skill Gating - map birth year to Explorer (10–12), Pathfinder (13–15), and Maverick (16–18) cohorts; enforce Skills 1–12 as universal and Skills 13–18 as Maverick-only across registry queries, trophy UI, and Academy Level 5–6 signpost locks (`lib/dashboard/mastery-cohort.ts`, `lib/skills/skills-registry-query.ts`). **Parent Hub learning-track change + progress reset shipped.**

- [x] Task 3.13: Academy Phase 1 Milestone Scaffold - build the 54-node lesson journey (6 Levels × 9 Lessons) with module signposts + preview modals, boss-node checkpoints, sessionStorage progress persistence, and cohort-gated advanced levels (`academy-state.ts`, `academy-progress-storage.ts`, `academy-skill-track.tsx`).

- [x] Task 3.14: Interactive Academy Lessons (Slice One) - ship M1-L1 (*Money In, Money Out* → Skill: Stop & Think), M1-L2 (*Needs vs Wants Sort* → Skill: Put Needs First), M1-L3 (*Keep Some Money Aside* → Skill 3; explorer+pathfinder), and M1-L4 (*Pause Under Pressure* → Stop & Think bronze path; explorer only) as full 8-screen interactive lesson flows via the registry-driven generic player, with mistake tracking, XP awards, bronze skill unlock on completion, and replay-safe routing (`lib/academy/lessons/registry.ts`, `lib/academy/lessons/content/`).

- [x] Task 3.15: Achievements Hub - build `/dashboard/achievements` with tiered skill medal carousel (Bronze / Silver / Gold / Locked scaffolds), learning streak milestones, money milestones, monthly challenges, and social friends leaderboard sections (`components/achievements/`, `lib/dashboard/achievements-state.ts`, `lib/dashboard/skill-trophies.ts`).

- [x] Task 3.16: Parent PIN Gate (Local) - implement 4-digit PIN setup, verification, and recovery flow securing the Parent Mode toggle in Settings (`lib/dashboard/parent-pin.ts`, `home-dashboard.tsx`). *(SessionStorage-only; no Supabase auth binding yet.)*

- [x] Task 3.17: Semantic UI Layering System - centralize stacking contexts with `@theme` z-index tokens, portal roots in root layout, shared modal/overlay portal components, migration of hub modals and lesson overlays, `layer-island` isolation on lesson/journey containers, and ESLint rule banning raw numeric z-index. **(COMPLETE)**

- [ ] Task 3.18: Academy Lesson Authoring Pipeline (Scale) - non-developer spreadsheet workflow (`templates/lesson-authoring/`), import scripts, cohort override pattern, and Level 1 lesson fill (L5–L9) plus remaining Pathfinder/Maverick variants for L3–L4. **(IN PROGRESS — L1–L4 shipped with cohort gates; L5–L9 not shipped; author self-service docs in `INSTRUCTIONS.md`.)**

- [x] Task 3.19: Lesson Runtime Stability - fix React cross-component update errors in bucket-sort flow via deferred action queues; mount only the active lesson screen; restore dashboard nav during lesson interactions (explicit `router.push`, pointer-capture cleanup, scoped touch handling). **(COMPLETE)**

- [x] Task 3.20: Academy Lesson Screen Standards Lock - design shell + `docs/academy-screen-types.md` SSOT; shared typography/feedback tokens; illustration omit/allow rules; promoted standard screen types; gift-reveal retirement; illustration registry + borderless slots; Screen 8 confetti/medal/rewards composition. **(COMPLETE — follow-up: sync stale gift-reveal notes in the screen-types doc.)**

- [x] Task 3.21: Launchpad + Vault Rebrand - rename Engine → Launchpad and Vault-v2 → Vault across routes, modules, copy, and redirects; Launchpad rocket icon; Advanced Money Tools extracted to its own route. **(COMPLETE)**



---



### 🔐 Milestone 4: Retrospective Progress Gates

- [ ] Task 4.1: Titan Progress Saver (14+) - prompt for a password to save progress and lock in streaks when the user needs persistence.

- [ ] Task 4.2: Explorer Parent Consent (<14) - prompt for a Parent's Email to trigger an asynchronous Magic Link consent flow, placing the app in a data-restricted Sandbox Mode until approved. *(Route stub exists at `/onboarding/parent-consent`; magic-link flow not implemented.)*

- [ ] Task 4.5: The Retrospective Shortcut Engine - Build the cross-progression highway tracking real-world checklist completions in Launchpad to auto-resolve parallel theoretical modules in Academy, triggering a "Shortcut Unlocked" visual notification and bonus XP.

- [ ] Task 4.6: Tiered Achievements Cabinet - Build a gamified master skills matrix that dynamically graduates user achievement badges from Bronze (Theory mastered) → Silver (Vault/Action completed) → Gold (True cross-progression breakthrough). *(Partial: Achievements hub ships local Bronze tier unlocks from lessons + `vault-skill-progress-storage.ts`; Silver/Gold graduation and cross-progression logic not wired.)*



---



### 🚪 Milestone 5: Freemium Horizontal Slice

- [ ] Task 5.1: Paywall Layer - lock premium dashboards behind high-energy CTA orange (#FFA503) prompts. *(Design-system preview label only; Vault custom-jar and Launchpad premium locks are local placeholders / modals.)*

- [ ] Task 5.2: Slice One Content - ship the horizontal slice (1 active foundational learning mission, 1 operational entry-level Venture Pack template, 1 basic Vault tool layout). *(Partial: 4 Academy lessons + declarative lesson pipeline + full Vault allocator + Launchpad venture directory ship; Launchpad venture operations remain demo/scaffold state.)*



---



### 🎮 Sprint 4: Gamification, Profile & Security *(Local State & UI)*

- [ ] **Gamified Utility Points Allocation:** Map static lesson activity parameters (10 XP standard milestones, 20 XP hard action items, Double XP finishes) into our local state configuration. *(Partial: M1-L1–L4 ship fixed XP + perfect-streak bonus via `awardLessonXp()`; global XP constants not yet standardised across all lesson types.)*

- [ ] **Parent Rewards Marketplace (Vault Section):** Create a visual card component layout at the base of the Vault for exchanging point balances for custom parent-fulfilled rewards (screen time, movie nights, etc.).

- [ ] **The Gamified Store Engine (Streak Freezes):** Build an interactive profile shop interface allowing kids to spend earned XP to buy out or renew Daily Streak Freezes dynamically.

- [x] **Parental Gate Security Layer:** Evaluate and implement a 4-digit PIN lock or app-wide parent access PIN to secure the "Switch to Parent Mode" navigation toggle from child access. *(COMPLETE locally via `parent-pin.ts` + Settings Parent Mode / Parent Hub flow; recovery PIN + simulated email dispatch only.)*



---



### ☁️ Sprint 5: Database & Infrastructure Integration *(Supabase & External Services)*

- [ ] **Supabase Skills Registry Runtime Wiring:** Connect the app to live `skills_registry` queries using cohort-scoped PostgREST filters (`skillsRegistryPostgrestFilter`) instead of the in-memory TypeScript mirror.

- [ ] **Multi-Device Session Auth Architecture:** Configure Supabase Auth logic to smoothly handle concurrent, distinct parent and child login sessions across completely separate physical devices.

- [ ] **Asynchronous Parent Payout Alerts:** Integrate background transactional communication workers (via Resend email templates or Twilio SMS) to automatically notify parents when a child triggers a points cash-out simulation.

- [ ] **Device Native Push Notifications:** Set up progressive web app (PWA) push notification service workers to fire alerts to a user's device when a daily streak is at risk of breaking.



---



### 📚 Sprint 6: Academy Content & Authoring *(Spreadsheet → Registry → Ship)*

**Goal:** Enable non-developer lesson authoring and fill Level 1 (L5–L9) without new monolithic lesson components.

- [x] **Declarative lesson architecture** - registry-driven generic player, `ScreenConfig` union, `useLessonFlow`, cohort override merge, shared completion helpers. **(COMPLETE)**

- [x] **Spreadsheet authoring templates** - `templates/lesson-authoring/` (`Lesson-Details.csv`, `Screens.csv`, lookup sheets, `INSTRUCTIONS.md`, example M1-L1 folder). **(COMPLETE)**

- [x] **Import tooling** - `npm run lesson:import` and `npm run lesson:import:explorer` via `tools/import-lesson-from-sheet.mjs` and `tools/import-explorer-workbook.mjs`. **(COMPLETE)**

- [x] **Lesson screen standards lock** - design shell, `docs/academy-screen-types.md`, shared tokens, locked game behaviours, illustration registry. **(COMPLETE)**

- [x] **M1-L4 Explorer shipment** - Pause Under Pressure registered with `shippedCohorts: ["explorer"]`. **(COMPLETE)**

- [ ] **Level 1 lessons L5–L9** - author via spreadsheet pipeline, import, register in `LESSON_DEFINITIONS`, browser QA per cohort.

- [ ] **M1-L3 Maverick cohort overrides** - Maverick narrative variants via `screenOverrides` once copy is ready. *(L3 currently ships explorer + pathfinder only.)*

- [ ] **M1-L4 Pathfinder / Maverick variants** - expand `shippedCohorts` beyond explorer when teen copy is finalized.

- [ ] **M1-L2 Pathfinder variant polish** - teen copy overrides when Pathfinder content is finalized. *(Lower priority; Pathfinder already in shippedCohorts.)*

- [ ] **Game-Types catalog sync** - document current standard types (including `drag-to-target`, `budget-select`, `allocation-slider`, `rank-order`, `savings-goal`) in `Game-Types.csv` for content authors; remove retired gift-reveal references.

- [ ] **Screen-types doc sync** - remove stale `m1-l2-gift-reveal` notes from `docs/academy-screen-types.md`.

- [ ] **Achievements copy Launchpad rename** - replace remaining "Engine" string in achievements blurb.

- [ ] **Lesson side-effect lint guard** - optional ESLint rule banning parent callbacks inside `setState` updaters in `components/academy/lesson/`.

- [ ] **Generic DataDrivenLesson component** - deferred until 4–6 lessons are stable in the current pipeline. *(See `DECISIONS_LOG.md`.)*



---

*Last updated: 2026-08-03*
