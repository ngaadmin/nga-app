"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { createTeacherAccount } from "@/lib/school/create-teacher-account";
import { cn } from "@/lib/utils/cn";
import { EMAIL_PATTERN } from "@/lib/validation/email";

const fieldBase =
  "w-full rounded-nga-lg border-2 border-[#E5E5E5] bg-[#F7F7F7] px-4 py-3 font-sans text-base text-nga-ink transition-colors placeholder:text-nga-slate/60 focus:border-nga-secondary focus:bg-white focus:outline-none";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function TeacherSignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FormErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = "Please enter a valid email address.";
    }
    if (password.length < 6) {
      next.password = "Use at least 6 characters for your password.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await createTeacherAccount({
        email: trimmedEmail,
        password,
      });
      if (!result.success) {
        setErrors({ form: result.error });
        return;
      }

      setCheckEmailFor(result.email);
    } catch {
      setErrors({ form: "Could not create the teacher account. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <OnboardingHeader />
      <section className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-md px-1">
          <h1 className="font-heading text-3xl font-black tracking-tight text-nga-primary">
            Create your teacher account
          </h1>
          <p className="mt-2 font-sans text-base text-nga-slate">
            Next, you’ll add your students.
          </p>
          {checkEmailFor ? (
            <p className="mt-6 font-sans text-base text-nga-ink" role="status">
              Check {checkEmailFor} and tap Open my class to confirm this
              account.
            </p>
          ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="teacher-email"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Email
              </label>
              <input
                id="teacher-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
                }}
                aria-invalid={Boolean(errors.email)}
                className={cn(fieldBase, errors.email && "border-red-400 focus:border-red-500")}
              />
              {errors.email ? (
                <p className="font-sans text-sm font-medium text-red-600" role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="teacher-password"
                className="block font-heading text-sm font-bold text-nga-primary"
              >
                Password
              </label>
              <input
                id="teacher-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                    form: undefined,
                  }));
                }}
                aria-invalid={Boolean(errors.password)}
                className={cn(
                  fieldBase,
                  errors.password && "border-red-400 focus:border-red-500",
                )}
              />
              {errors.password ? (
                <p className="font-sans text-sm font-medium text-red-600" role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>
            {errors.form ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {errors.form}
              </p>
            ) : null}
            <Button type="submit" variant="cta" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
          )}
        </div>
      </section>
    </>
  );
}
