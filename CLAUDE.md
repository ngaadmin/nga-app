# Project Manifesto & System Guidelines: NextGenAchievers V2.0

## 1. System Vision & User Experience
* **Core Mission:** A dynamic, AI-powered financial cockpit transitioning youth (ages 10-17+) from passive learning to active entrepreneurship.
* **Architecture:** High-performance, mobile-responsive Progressive Web App (PWA) scaling seamlessly from desktop to mobile viewports.
* **Hardware Isolation:** Zero reliance on native mobile device hardware (no camera, no Bluetooth, no native push notifications).
* **The Drafting Table Rule:** Strictly non-agentic execution. We provide tools and dashboards; the user provides direct intent. No automated financial trading, web scraping, or auto-gig placements.

## 2. Technical Stack Constraints (Non-Negotiable)
* **Frontend UI:** Next.js (React App Router), TypeScript (Strict Mode), and Tailwind CSS.
* **Backend & Database:** Supabase (PostgreSQL) for user authentication, session persistence, and progress tracking.
* **Hosting & Pipeline:** Vercel integrated with GitHub version control for automated testing and continuous deployment.
* **Cognitive Processing:** Direct integration with the xAI Grok API. 
* **OpenAI Absolute Exclusion:** Under no circumstances are OpenAI, ChatGPT, or associated SDKs, libraries, or dependencies to be imported or referenced.

## 3. Brand Voice & UI Style Safeguards
* **The Sjon Persona:** The AI must generate user-facing copy matching the "Cool, Savvy Mentor" identity—Bold, Fun, Direct, and Witty. Never lecture or talk down to the user.
* **Tone Adaptability:** UI copy must align with the target user profiles: Short sentences and high-energy metaphors for Explorers (10-13); peer-to-peer respect focusing on leverage and independence for Titans (14-17+).
* **Aesthetic Standard:** "Duolingo for Finance"—highly visual, low-text, interactive, gamified interface layouts.

## 4. Ethical & Compliance Guardrails
* **Financial Advice Ban:** The application code and underlying prompt configurations must never deliver specific financial advice or asset recommendations.
* **High-Risk Exclusion:** Absolute prohibition of gambling, cryptocurrency spec-logic, or unregulated get-rich-quick themes.
* **Token Stewardship:** Maximize unit economics. Use lightweight local math and charting libraries for dashboard calculations; do not call the Grok API for static processing.

## 5. Global Minor Compliance & Parental Oversight (Strictest Global Standards)
* **Age-Gated Verification:** Implement a strict, neutral age-gate during the initial onboarding flow to accurately segregate users into legal compliance tiers (Explorers: 10–13, Titans: 14–17+).
* **Verifiable Parental Consent (VPC):** For any user under 13 (COPPA/GDPR-K threshold), the application must block account creation until a parent or legal guardian creates a verified master account, grants explicit consent, and completes verification.
* **Scaled Parental Oversight:** 
  - *Explorers (10–13):* The parent account maintains full read-access to progress tracking, milestone updates, and app activity via a secure parent dashboard link.
  - *Titans (14–17+):* Shift toward privacy-by-design that respects young adult autonomy, providing scaled parental visibility while maintaining peer-to-peer user boundaries.
* **Data Minimization & Privacy by Design:** Turn off all non-essential telemetry, tracking pixels, or behavioral profiling for minor accounts by default. Absolutely no PII leakage or unauthorized collection of identifier data.

## 6. Standard DevOps & System Commands
* **Development Server:** `npm run dev`
* **Production Build Validation:** `npm run build`
* **Type-Check & Linting Gate:** `npm run lint` && `npx tsc --noEmit`

### 🛡️ Security & Scalability Blueprint
- **Input Safety:** Standardize on basic input sanitization for form components to prevent obvious injection risks.
- **Type Approach:** Favor clean TypeScript definitions, but allow standard type-casting or flexible interfaces during rapid UI prototyping.
- **Database Readiness:** Write query structures that cleanly isolate user data, keeping future Supabase Row Level Security (RLS) integration in mind without hardcoding authentication barriers into early static views.
- **Data Minimization:** Prioritize capturing the minimum required attributes for the active user state (e.g., local state for ghost play).