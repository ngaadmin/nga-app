import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Design System",
  description: "NextGenAchievers brand style verification gate",
};

const brandColors = [
  {
    name: "Primary Base",
    token: "nga-primary",
    hex: "#031F82",
    className: "bg-nga-primary",
    textClass: "text-white",
  },
  {
    name: "Background / Panels",
    token: "nga-panel",
    hex: "#BDE9FB",
    className: "bg-nga-panel",
    textClass: "text-nga-ink",
  },
  {
    name: "Secondary Blue",
    token: "nga-secondary",
    hex: "#0CC1E0",
    className: "bg-nga-secondary",
    textClass: "text-nga-ink",
  },
  {
    name: "CTA Accent",
    token: "nga-cta",
    hex: "#FFA503",
    className: "bg-nga-cta",
    textClass: "text-nga-ink",
  },
  {
    name: "Design Accent",
    token: "nga-accent",
    hex: "#DCB766",
    className: "bg-nga-accent",
    textClass: "text-nga-ink",
  },
] as const;

export default function DesignSystemPage() {
  return (
    <main className="min-h-dvh bg-nga-panel px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="rounded-nga-xl bg-nga-surface p-8 shadow-nga-card">
          <p className="font-heading text-sm font-bold uppercase tracking-widest text-nga-secondary">
            Style Verification Gate
          </p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold text-nga-primary">
            NextGenAchievers Design System
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-nga-slate">
            Milestone 1 brand assets - corporate HEX palette, Poppins headings,
            Inter body copy, and interactive button states. Confirm everything
            looks sharp before we ship onboarding.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block font-sans text-sm font-semibold text-nga-secondary underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
        </header>

        {/* Corporate colors */}
        <section className="space-y-4">
          <SectionHeading
            title="Corporate Colors"
            subtitle="Official HEX values mapped in Tailwind (@theme + tailwind.config.ts)"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandColors.map((color) => (
              <div
                key={color.hex}
                className="overflow-hidden rounded-nga-lg bg-nga-surface shadow-nga-card"
              >
                <div
                  className={`flex h-28 items-end p-4 ${color.className} ${color.textClass}`}
                >
                  <span className="font-mono text-sm font-semibold opacity-90">
                    {color.hex}
                  </span>
                </div>
                <div className="space-y-1 p-4">
                  <p className="font-heading text-lg font-bold text-nga-primary">
                    {color.name}
                  </p>
                  <p className="font-sans text-sm text-nga-slate">
                    <code className="rounded bg-nga-mist px-1.5 py-0.5 text-xs">
                      {color.token}
                    </code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="rounded-nga-xl bg-nga-surface p-8 shadow-nga-card">
          <SectionHeading
            title="Typography"
            subtitle="Poppins - bold interactive headings & buttons · Inter - body text"
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-nga-cta">
                Poppins (Headings)
              </p>
              <p className="font-heading text-4xl font-extrabold text-nga-primary">
                ExtraBold 800 - Level up your money game
              </p>
              <p className="font-heading text-2xl font-bold text-nga-primary">
                Bold 700 - Your financial cockpit awaits
              </p>
              <p className="font-heading text-xl font-semibold text-nga-slate">
                SemiBold 600 - Short. Punchy. No lectures.
              </p>
            </div>
            <div className="space-y-6">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-nga-cta">
                Inter (Body)
              </p>
              <p className="font-sans text-lg font-semibold text-nga-ink">
                SemiBold 600 - Track progress across all three front doors.
              </p>
              <p className="font-sans text-base font-medium text-nga-slate">
                Medium 500 - Explorers get high-energy metaphors; Pathfinders
                and Mavericks get peer-level respect and leverage-focused copy.
              </p>
              <p className="font-sans text-base font-normal leading-relaxed text-nga-slate">
                Regular 400 - Data minimization by default. No fluff, no
                financial advice, no get-rich-quick noise - just tools you
                control.
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="rounded-nga-xl bg-nga-surface p-8 shadow-nga-card">
          <SectionHeading
            title="Interactive Buttons"
            subtitle="Primary, CTA, secondary, outline, ghost - default, hover, and disabled"
          />
          <div className="mt-8 space-y-10">
            <ButtonRow label="Default states">
              <Button variant="primary">Primary Action</Button>
              <Button variant="cta">Unlock Premium</Button>
              <Button variant="secondary">Explore Free</Button>
              <Button variant="outline">Learn More</Button>
              <Button variant="ghost">Skip for now</Button>
            </ButtonRow>

            <ButtonRow label="Tactile 3D (onboarding entry gate)">
              <Button variant="cta">Get started</Button>
              <Button variant="secondary-outline">
                I already have an account
              </Button>
              <ButtonLink href="/onboarding" variant="cta">
                Get started (link)
              </ButtonLink>
            </ButtonRow>

            <ButtonRow label="Disabled states">
              <Button variant="primary" disabled>
                Primary Action
              </Button>
              <Button variant="cta" disabled>
                Unlock Premium
              </Button>
              <Button variant="secondary" disabled>
                Explore Free
              </Button>
            </ButtonRow>

            <div className="rounded-nga-lg border-2 border-dashed border-nga-accent/60 bg-nga-panel/50 p-6">
              <p className="font-heading text-sm font-bold text-nga-primary">
                Paywall preview (Milestone 4)
              </p>
              <p className="mt-2 font-sans text-sm text-nga-slate">
                High-energy CTA orange drives upgrade prompts across locked
                dashboards.
              </p>
              <Button variant="cta" className="mt-4">
                Go Pro - #FFA503
              </Button>
            </div>
          </div>
        </section>

        {/* Composite sample */}
        <section className="overflow-hidden rounded-nga-xl shadow-nga-card">
          <div className="bg-nga-primary px-8 py-6">
            <h2 className="font-heading text-2xl font-bold text-white">
              Composite card sample
            </h2>
            <p className="mt-1 font-sans text-sm text-nga-panel/90">
              Primary base header on panel body - typical app shell pattern
            </p>
          </div>
          <div className="space-y-4 bg-nga-panel px-8 py-6">
            <p className="font-sans text-nga-slate">
              Panel background with design accent highlight:
            </p>
            <span className="inline-block rounded-full bg-nga-accent px-4 py-1 font-heading text-sm font-bold text-nga-ink">
              +50 XP Streak Bonus
            </span>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="primary">Start Mission</Button>
              <Button variant="cta">Upgrade</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-nga-primary">{title}</h2>
      <p className="mt-1 font-sans text-sm text-nga-slate">{subtitle}</p>
    </div>
  );
}

function ButtonRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-4 font-heading text-sm font-semibold text-nga-slate">
        {label}
      </p>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}
