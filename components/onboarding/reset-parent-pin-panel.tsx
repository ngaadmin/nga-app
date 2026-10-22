"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeParentPinReset } from "@/lib/dashboard/parent-pin-reset";
import { ONBOARDING_SIGN_IN_PATH } from "@/lib/onboarding/guest-session";
import { isFourDigitPin } from "@/lib/validation/pin";

export function ResetParentPinPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!token) {
      setError("This reset link is invalid or expired. Request a new one.");
      return;
    }
    if (!isFourDigitPin(pin) || pin !== confirmPin) {
      setError("Enter the same 4-digit PIN twice.");
      return;
    }
    setSaving(true);
    try {
      const result = await completeParentPinReset({ token, pin });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">Set a new parent PIN</h1>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        This link works once and expires in 30 minutes.
      </p>
      {saved ? (
        <p className="mt-4 font-sans text-sm font-semibold text-[#031F82]" role="status">
          PIN saved
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block font-heading text-sm font-bold text-[#031F82]">
            New PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] px-3 py-2"
            />
          </label>
          <label className="block font-heading text-sm font-bold text-[#031F82]">
            Confirm new PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mt-1.5 w-full rounded-xl border-2 border-[#BDE9FB] px-3 py-2"
            />
          </label>
          {error ? (
            <p className="font-sans text-sm font-semibold text-[#031F82]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save PIN"}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => router.push(ONBOARDING_SIGN_IN_PATH)}
        className="mt-4 font-heading text-sm font-bold text-[#0CC1E0]"
      >
        Back to login
      </button>
    </section>
  );
}
