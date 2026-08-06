"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import {
  getBirthYearRangeLabel,
  getEligibleBirthYears,
  isEligibleBirthYear,
} from "@/lib/onboarding/birth-years";
import { reserveGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  createGuestAccessSession,
  DASHBOARD_ACADEMY_PATH,
  isGuestSession,
  ONBOARDING_SIGN_UP_PATH,
  readUserSession,
  saveGuestAccessSession,
} from "@/lib/onboarding/guest-session";
import { cn } from "@/lib/utils/cn";

const USERNAME_PATTERN = /^[a-zA-Z0-9_#-]{2,20}$/;

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

export function PersonalizationGateForm() {
  const router = useRouter();
  const birthYears = useMemo(() => getEligibleBirthYears(), []);

  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [genericProfileId, setGenericProfileId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    birthYear?: string;
  }>({});

  useEffect(() => {
    const existing = readUserSession();
    if (existing && isGuestSession(existing) && existing.username.trim()) {
      setUsername(existing.username);
      setGenericProfileId(existing.genericProfileId ?? null);
      if (existing.birthYearLocked && isEligibleBirthYear(existing.birthYear)) {
        setBirthYear(String(existing.birthYear));
      }
      return;
    }

    try {
      const generated = reserveGenericProfileId();
      setUsername(generated.username);
      setGenericProfileId(generated.id);
    } catch {
      setUsername("");
      setGenericProfileId(null);
    }
  }, []);

  function validate(): boolean {
    const next: typeof errors = {};
    const trimmed = username.trim();

    if (!trimmed) {
      next.username = "Pick a username to continue.";
    } else if (!USERNAME_PATTERN.test(trimmed)) {
      next.username =
        "Use 2-20 letters, numbers, underscores, hyphens, or # only.";
    }

    const year = birthYear ? Number(birthYear) : NaN;
    if (!birthYear) {
      next.birthYear = "Select your birth year so we can match your challenges.";
    } else if (!isEligibleBirthYear(year)) {
      next.birthYear = `Please choose a birth year between ${getBirthYearRangeLabel()}.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function persistGuestSession(): boolean {
    let reservedId = genericProfileId;
    if (!reservedId) {
      try {
        reservedId = reserveGenericProfileId().id;
      } catch {
        setErrors((prev) => ({
          ...prev,
          username: "Could not reserve a profile ID. Try again in a moment.",
        }));
        return false;
      }
    }

    const session = createGuestAccessSession({
      username: username.trim(),
      birthYear: Number(birthYear),
      genericProfileId: reservedId,
    });
    saveGuestAccessSession(session);
    return true;
  }

  function handleContinueWithoutProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    if (!persistGuestSession()) return;
    router.push(DASHBOARD_ACADEMY_PATH);
  }

  function handleCreateProfile() {
    const year = birthYear ? Number(birthYear) : NaN;
    if (!birthYear || !isEligibleBirthYear(year)) {
      setErrors((prev) => ({
        ...prev,
        birthYear: "Select your birth year before creating a profile.",
      }));
      return;
    }
    if (!validate()) return;
    if (!persistGuestSession()) return;
    router.push(ONBOARDING_SIGN_UP_PATH);
  }

  return (
    <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md space-y-8 px-1">
        <OnboardingProgress value={25} />

        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-nga-primary sm:text-[2rem]">
            Welcome to NextGenAchievers
          </h1>
          <p className="font-sans text-sm leading-relaxed text-nga-slate sm:text-base">
            The fun, real-world way to learn money skills.
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={handleContinueWithoutProfile}
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Pick a cool username..."
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
              className={cn(
                fieldBase,
                errors.username && "border-red-400 focus:border-red-500",
              )}
            />
            {errors.username ? (
              <p
                id="username-error"
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="birth-year"
              className="block font-heading text-sm font-bold text-nga-primary"
            >
              What year was the learner born?
            </label>
            <div className="relative">
              <select
                id="birth-year"
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
                  errors.birthYear ? "birth-year-error" : "birth-year-hint"
                }
                className={cn(
                  fieldBase,
                  "appearance-none pr-10",
                  !birthYear && "text-nga-slate/60",
                  errors.birthYear && "border-red-400 focus:border-red-500",
                )}
              >
                <option value="" disabled>
                  Select birth year
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
              id="birth-year-hint"
              className="font-sans text-sm leading-relaxed text-nga-slate"
            >
              <span className="font-bold text-nga-primary">IMPORTANT:</span>{" "}
              Enter the birth year of the learner (the player). We use this to
              set the right learning level and age-appropriate tools. We never
              share this information.
            </p>
            {errors.birthYear ? (
              <p
                id="birth-year-error"
                className="font-sans text-sm font-medium text-red-600"
                role="alert"
              >
                {errors.birthYear}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="cta"
              fullWidth
              onClick={handleCreateProfile}
            >
              Create Profile
            </Button>
            <Button type="submit" variant="secondary-outline" fullWidth>
              Continue without a profile
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
