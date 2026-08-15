"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const TEST_PASSWORD = "TestPassword123!";

export default function TestAuthEmailPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: TEST_PASSWORD,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage(
        "Signup request sent. Check that inbox (and spam) for the Supabase confirmation email.",
      );
    }

    setPending(false);
  }

  return (
    <main className="mx-auto max-w-md p-6 font-sans">
      <h1 className="mb-4 text-xl font-semibold">Test Auth Email</h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-neutral-400 px-3 py-2"
            autoComplete="email"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send test confirmation email"}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-4 text-sm ${isError ? "text-red-700" : "text-green-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </main>
  );
}
