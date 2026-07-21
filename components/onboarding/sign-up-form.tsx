"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import {
  getBirthYearRangeLabel,
  getEligibleBirthYears,
  isEligibleBirthYear,
} from "@/lib/onboarding/birth-years";
import {
  convertToRegisteredProfile,
  DASHBOARD_ACADEMY_PATH,
  readUserSession,
  saveUserSession,
} from "@/lib/onboarding/ghost-session";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const birthYears = useMemo(() => getEligibleBirthYears(), []);

  const existingSession = useMemo(() => readUserSession(), []);

  const [username, setUsername] = useState(() => {
    return (
      searchParams.get("username") ??
      (existingSession?.accessMode === "ghost" ? existingSession.username : "") ??
      ""
    );
  });
  const [email, setEmail] = useState("");
  const [birthYear, setBirthYear] = useState(() => {
    const fromQuery = searchParams.get("birthYear");
    if (fromQuery) return fromQuery;
    if (existingSession?.birthYear) return String(existingSession.birthYear);
    return "";
  });
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    birthYear?: string;
    form?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    const trimmed = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmed) {
      next.username = "Pick a nickname for your saved profile.";
    } else if (!USERNAME_PATTERN.test(trimmed)) {
      next.username =
        "Use 2–20 letters, numbers, underscores, or hyphens only.";
    }

    if (!trimmedEmail) {
      next.email = "Enter an email so we can save your account.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = "Enter a valid email address.";
    }

    const year = birthYear ? Number(birthYear) : NaN;
    if (!birthYear) {
      next.birthYear = "Select your birth year.";
    } else if (!isEligibleBirthYear(year)) {
      next.birthYear = `Please choose a birth year between ${getBirthYearRangeLabel()}.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    try {
      const session = convertToRegisteredProfile({
        username: username.trim(),
        email: email.trim(),
        birthYear: Number(birthYear),
      });
      saveUserSession(session);
      router.push(DASHBOARD_ACADEMY_PATH);
    } catch {
      setErrors((prev) => ({
        ...prev,
        form: "We could not create your profile. Check your details and try again.",
      }));
    }
  }

  const isGhostConversion = existingSession?.accessMode === "ghost";

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={50} />

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Create Your Free Profile
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate">
            {isGhostConversion
              ? "Your points, skills, and lesson progress carry over automatically."
              : "Save your streak, points, and skills across every visit."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="signup-username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Nickname / Username
            </label>
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Pick the name you want to keep"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.username)}
              className={cn(
                fieldBase,
                errors.username && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.username ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="signup-email"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.email)}
              className={cn(
                fieldBase,
                errors.email && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.email ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="signup-birth-year"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Birth year
            </label>
            <div className="relative">
              <select
                id="signup-birth-year"
                name="birthYear"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  if (errors.birthYear) {
                    setErrors((prev) => ({ ...prev, birthYear: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.birthYear)}
                aria-describedby={
                  errors.birthYear ? "signup-birth-year-error" : "signup-birth-year-hint"
                }
                className={cn(
                  fieldBase,
                  "appearance-none pr-10",
                  !birthYear && "text-nga-slate/60",
                  errors.birthYear && "border-red-400 focus:border-red-500",
                )}
              >
                <option value="" disabled>
                  Select your birth year
                </option>
                {birthYears.map((year) => (
                  <option key={year} value={year} className="text-nga-ink">
                    {year}
                  </option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-nga-secondary"
                aria-hidden
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <p
              id="signup-birth-year-hint"
              className="font-sans text-sm italic leading-relaxed text-nga-slate"
            >
              We ask for birth year to match lesson difficulty to your age band
              and apply the right privacy rules for younger players. We never
              use it for marketing.
            </p>
            {errors.birthYear ? (
              <p
                id="signup-birth-year-error"
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.birthYear}
              </p>
            ) : null}
          </div>

          {errors.form ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" variant="cta" fullWidth>
            Create My Free Account
          </Button>
        </form>
      </div>
    </section>
  );
}
