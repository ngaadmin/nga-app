# NextGenAchievers V2.0 Master Roadmap



> **Stack compliance:** All work follows `CLAUDE.md` - Next.js (App Router), TypeScript (strict), Tailwind CSS, Supabase, Vercel, xAI Grok only (no OpenAI). Mobile-responsive PWA; no native hardware dependencies.

> **App avatar guide:** All in-app mentor voice, activity logs, and youth-facing copy reference **Finn** as the sole guide persona across Academy, Engine, and Vault hubs.



---



### 🎨 Milestone 1: Brand Asset & Style Validation

- [x] Task 1.1: Map official corporate HEX colors in configuration (Primary Base: #031F82, Background/Panels: #BDE9FB, Secondary Blue: #0CC1E0, CTA Accent: #FFA503, Design Accent: #DCB766).

- [x] Task 1.2: Configure brand typography via Next.js Google Fonts (Poppins for bold interactive headings, Inter for clean body text).

- [x] Task 1.3: Style Verification Gate: Create a dedicated test page at `/design-system` displaying these exact HEX colors, typography weights, and button components to visually verify the palette looks perfect.



---



### 🛡️ Milestone 2: Frictionless Onboarding Phase A

- [x] Task 2.1: Build the 5-Second Personalization Gate - collect Birth Year and Username only (`/onboarding/start`).

- [x] Task 2.2: Instant Ghost Routing - route users straight into the app dashboard with temporary Ghost Access (no password or parental stage-gate upfront). Ghost sessions persist in `sessionStorage`; onboarding routes to `/dashboard/home`.



---



### 📊 Milestone 3: Core App Shell & Skeletons *(NEARLY COMPLETE)*



**Current execution notes:**

- Task 3.1 is complete: the dashboard shell ships with a desktop left sidebar, mobile bottom navigation, sticky compact status header (XP + streak + streak-freeze pills + Ghost Mode badge), ghost-session route protection via `DashboardShell`, and app-wide wallet state via `DashboardProviders` → `DashboardWalletProvider` at the dashboard layout root (persists XP balance, parent conversion rate, jar balances, and Vault unallocated AUD pool to `sessionStorage` via `dashboard-wallet-storage.ts`).

- `/dashboard` now server-redirects to `/dashboard/home`, making **Home** the default application landing page. Four-hub navigation (Home, Academy, Engine, Vault) is wired in `lib/dashboard/navigation.ts` for both sidebar and bottom nav.

- **Visual alignment sprint (complete):** The entire application shell - Home, Academy, Engine, and Vault - has been refactored into a borderless, minimalist, floating Duolingo-style spatial layout. Heavy grid boxes, rigid panel borders, and straight connector lines have been removed in favor of open white canvas spacing and soft `shadow-md` floating tiles.

- **Global typography & header standardization (complete):** All hub section titles route through the shared `DashboardSectionHeading` component - centered Poppins (`font-heading`) tokens at `text-lg font-extrabold text-nga-primary sm:text-xl` - ensuring visual parity across Home, Academy, Engine, and Vault.

- **Journey path connectors (complete):** Linear vertical connector lines on Academy and Engine journey maps have been replaced by curved, progress-faded **dotted SVG cubic-bezier paths** (`JourneyPathBridge`) that bridge center-to-center between zigzag milestone nodes. Walked path segments render in solid medium grey (`#6B7280`); future path segments fade at `opacity-35`. Demo progress anchors on active Step 3 (Nodes 1–2 completed, Node 3 glowing active target, Node 4+ locked).

- **Child-initiated points cash-out engine & Save Jar bridge (complete):** Home Child Mode ships the **Cash In Your Points** panel - flipped conversion rate slider logic ($0.50–$5.00 AUD per 100 XP), unified numeric XP input (editable; **Convert Full Points Balance** auto-populates max available balance), live AUD readout, virtual-money disclaimer, and **Claim Cash Reward** success modal. `claimPointsForVault()` deducts XP and credits the shared **Save Jar** balance directly (protected from Money to Allocate Reset wipes). Jar balances persist via `sessionStorage` with zero state drop between hub navigation; children can still recall funds from Save into Spend or Give via Vault allocation mechanics.

- **Home** (`/dashboard/home`) ships Account & Settings links, Shared Device Parent Mode toggle, and the point-conversion workspace. In Parent Mode, parents set the AUD-per-100-XP conversion rate slider with no child payout triggers. Global XP in the status header reads from the same wallet context.

- **The Academy** (`/dashboard/academy`) ships a high-engagement, scrollable, Duolingo-inspired vertical skill roadmap - sticky Day Streak + XP momentum header, 6 numbered zigzag nodes with finance placeholder icons, dotted path progression, and youth-tailored copy (The Cash Stash, Leveling Up Your Loot, The Interest Multiplier, and locked placeholders through Node 6). State and copy pull from `academy-state.ts` and `copyMatrix` placeholders pending Supabase wiring.

- **The Engine** (`/dashboard/engine`) ships a premium, mobile-first operating layout: dual horizontal carousels (In Progress ventures + All Business Ideas deck), discovery-brief launch drawers, safe close-shop confirmation flows, and a dynamic bottom canvas consuming 50% viewport height with a 4-node zigzag venture journey map (dotted path connectors + Step 3 demo state) synced to the selected active venture. Finn voice copy drives all mentor prompts.

- **The Vault** (`/dashboard/vault`) ships a Money Allocation workspace - circular skill-medal trophy shelf carousel, savings motivation scoreboard (live-linked to Save Jar balance), **Allocate Your Income** deposit funnel, **Money to Allocate** holding pool (manual deposits only; AUD-formatted) with typo-safe Reset, foundational **Spend, Save, Give** jars (Save Jar fed by Home point conversions) plus a premium custom-jar teaser, Finn's Activity Log accordion, and full bidirectional allocator + time-machine compounding plumbing.

- **Active technical backlog (remaining within Milestone 3):** Task 3.3 (Supabase 24-Skill schema), Task 3.4 (gamified adaptive placement quiz), and Task 3.7 (Parent Incentive Engine interface). Downstream Sprint 4 and Sprint 5 items are catalogued at the bottom of this file.



- [x] Task 3.1: Core Shell - build the main application dashboard structure that replaces the onboarding screen permanently post-entry. **(COMPLETE - Desktop sidebar + mobile bottom nav, sticky compact status pills for XP / streak / streak freezes, Ghost Mode badge, ghost-session guard, and layout-root `DashboardProviders` / `DashboardWalletProvider` with `sessionStorage` wallet + jar persistence across hub navigation.)**

- [x] Task 3.2: The Three Front Doors - scaffold main landing hubs for The Academy, The Engine, and The Vault. **(COMPLETE - All four hubs (Home + Academy + Engine + Vault) are fully built with premium, mobile-first, high-fidelity responsive layouts.)** *(Visual sub-note: entire application shell refactored to borderless, minimalist, floating Duolingo-style spatial layout - no heavy grid boxes or rigid containment lines.)*

- [ ] Task 3.3: 24-Skill Core Schema - build the Supabase database schema for the 24-Skill Core Library, mapping user tracking states (Beginner, Intermediate, Advanced).

- [ ] Task 3.4: Gamified Adaptive Placement Quiz - build the interactive, Duolingo-style placement flow that updates skill tiers in the database upon completion.

- [x] Task 3.5: The Vault Allocator (Bidirectional Jars) - Build the sandbox management bank layout supporting manual logging of real-world income, foundational Spend, Save, and Give jars, fluidly adjustable custom jars, and bidirectional Money Allocation mechanics with ADD/RECALL ledger actions. **(COMPLETE - Intuitive tile-tapping interaction physics, clear ADD/RECALL modifiers, custom jar premium paywall placeholders, foundational Spend / Save / Give jars, unallocated-pool Reset for deposit typos, coin-flying micro-animations, shared jar balances in wallet context, and Home→Vault Save Jar direct deposit via `claimPointsForVault()`. Finn narrates all ledger activity.)** *(Visual sub-note: Vault refactored to match Academy and Engine borderless floating Duolingo-style panels - white canvas, soft shadows, no heavy grid boxes.)*

- [x] Task 3.6: The Savings Time-Machine Widget - Build an interactive sandbox compounding widget inside The Vault that pulls live Save Jar balances by default, features interactive sliders for "Years Saved" and "Weekly Top-Up", and accepts text input for manual principal overrides. **(COMPLETE - Fully plumbing-linked to the live Total Savings scoreboard and Save Jar state. Includes interactive sliders for years, weekly top-ups, a dynamic expected return ROI slider, and a compliance safety trigger warning card that activates at 12%+ ROI to caution users about high-risk volatility.)**

- [ ] Task 3.7: Parent Incentive Engine Interface - Build a parent-facing configuration settings view to establish custom financial cash payouts tied to app metrics (e.g., streaks, XP). Must support triggering a celebration card and writing a "Pending Parent Payout" line-item directly to the child's Vault feed.

- [x] Task 3.8: Global Typography & Header Standardization - unify hub section titles via shared `DashboardSectionHeading` component using centered Poppins tokens (`font-heading text-lg font-extrabold text-nga-primary sm:text-xl`) across Home, Academy, Engine, and Vault.

- [x] Task 3.9: The 4-Hub Shell Pivot - migrate from the original 3-tab layout to a four-pillar navigation model with `/dashboard/home` as the default landing node (`/dashboard` server-redirect, onboarding ghost route, sidebar + bottom nav wired in `lib/dashboard/navigation.ts`).

- [x] Task 3.10: Curved Dotted Journey Lines - replace linear vertical connectors with smooth SVG cubic-bezier dotted path bridges (`JourneyPathBridge`) connecting milestone nodes center-to-center on Academy and Engine journey maps, with progress-faded walked vs. future segments.

- [x] Task 3.11: Child-Initiated Point Conversion Interface - ship Home Child Mode **Cash In Your Points** panel with flipped conversion rate slider ($0.50–$5.00 AUD per 100 XP), virtual-money disclaimer, full-balance input auto-population, live AUD readout, Claim Cash Reward success modal, and direct routing of converted funds into the Vault **Save Jar** balance via shared wallet context + `sessionStorage` persistence.



---



### 🔐 Milestone 4: Retrospective Progress Gates

- [ ] Task 4.1: Titan Progress Saver (14+) - prompt for a password to save progress and lock in streaks when the user needs persistence.

- [ ] Task 4.2: Explorer Parent Consent (<14) - prompt for a Parent's Email to trigger an asynchronous Magic Link consent flow, placing the app in a data-restricted Sandbox Mode until approved. *(Route stub exists at `/onboarding/parent-consent`; magic-link flow not implemented.)*

- [ ] Task 4.5: The Retrospective Shortcut Engine - Build the cross-progression highway tracking real-world checklist completions in The Engine to auto-resolve parallel theoretical modules in The Academy, triggering a "Shortcut Unlocked" visual notification and bonus XP.

- [ ] Task 4.6: Tiered Achievements Cabinet - Build a gamified master skills matrix that dynamically graduates user achievement badges from Bronze (Theory mastered) → Silver (Vault/Action completed) → Gold (True cross-progression breakthrough).



---



### 🚪 Milestone 5: Freemium Horizontal Slice

- [ ] Task 5.1: Paywall Layer - lock premium dashboards behind high-energy CTA orange (#FFA503) prompts. *(Design-system preview label only; no paywall logic shipped.)*

- [ ] Task 5.2: Slice One Content - ship the horizontal slice (1 active foundational learning mission, 1 operational entry-level Venture Pack template, 1 basic Vault tool layout).



---



### 🎮 Sprint 4: Gamification, Profile & Security *(Local State & UI)*

- [ ] **Gamified Utility Points Allocation:** Map static lesson activity parameters (10 XP standard milestones, 20 XP hard action items, Double XP finishes) into our local state configuration.

- [ ] **Parent Rewards Marketplace (Vault Section):** Create a visual card component layout at the base of the Vault for exchanging point balances for custom parent-fulfilled rewards (screen time, movie nights, etc.).

- [ ] **The Gamified Store Engine (Streak Freezes):** Build an interactive profile shop interface allowing kids to spend earned XP to buy out or renew Daily Streak Freezes dynamically.

- [ ] **Parental Gate Security Layer:** Evaluate and implement a 4-digit PIN lock or app-wide parent access PIN to secure the "Switch to Parent Mode" navigation toggle from child access.



---



### ☁️ Sprint 5: Database & Infrastructure Integration *(Supabase & External Services)*

- [ ] **Multi-Device Session Auth Architecture:** Configure Supabase Auth logic to smoothly handle concurrent, distinct parent and child login sessions across completely separate physical devices.

- [ ] **Asynchronous Parent Payout Alerts:** Integrate background transactional communication workers (via Resend email templates or Twilio SMS) to automatically notify parents when a child triggers a points cash-out simulation.

- [ ] **Device Native Push Notifications:** Set up progressive web app (PWA) push notification service workers to fire alerts to a user's device when a daily streak is at risk of breaking.



---
