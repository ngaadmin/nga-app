"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PIN_GATE_CARD_SHADOW, PinBoxes } from "@/components/parent/parent-pin-gate";
import { LockIcon } from "@/lib/dashboard/icons";
import { requestParentPinReset } from "@/lib/dashboard/parent-pin-reset";
import { PIN_NAMES, childDataPhrase, pinDifferenceLine } from "@/lib/parent/pin-copy";
import { loadParentLinkedChildCount } from "@/lib/privacy/account-data-server";
import { isFourDigitPin } from "@/lib/validation/pin";
import { cn } from "@/lib/utils/cn";

/**
 * Parent PIN gate for My account and child data. Same look as the Parent Hub
 * PIN gate (four boxes, orange Continue, lock, "Forgot your PIN?") but it asks
 * for the Parent PIN, never the Parent Hub PIN. The PINs stay separate.
 */
export function ParentDataPinGate({
  kind,
  onUnlock,
}: {
  kind: "account" | "child";
  /** Resolves with an error string, or null once unlocked. */
  onUnlock: (pin: string) => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [childCount, setChildCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadParentLinkedChildCount().then((count) => {
      if (!cancelled) setChildCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isFourDigitPin(pin)) {
      setError("Enter 4 numbers.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const failed = await onUnlock(pin);
    setBusy(false);
    if (failed) {
      setPin("");
      setError(failed);
    }
  }

  async function forgot() {
    if (sending) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const sent = await requestParentPinReset();
      if (sent.ok) setNotice(sent.message);
      else setError(sent.error);
    } catch {
      setError("We could not email a PIN reset link. Try again.");
    } finally {
      setSending(false);
    }
  }

  const body =
    kind === "account"
      ? `Your account record stays behind your ${PIN_NAMES.parent}.`
      : `This page holds ${childDataPhrase(childCount)} and privacy controls. Nothing changes until you confirm.`;

  return (
    <div data-parent-data-gate={kind} className="mx-auto w-full max-w-md px-1 pt-2">
      <Link
        href="/dashboard/settings"
        data-parent-data-gate-back
        className="font-heading text-sm font-bold text-[#0CC1E0]"
      >
        ← Back to Settings
      </Link>
      <form
        onSubmit={submit}
        className={cn(
          "mt-4 rounded-2xl bg-white px-4 pb-4 pt-5 text-center",
          PIN_GATE_CARD_SHADOW,
        )}
      >
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#E8F6FC] text-[#031F82]">
          <LockIcon className="size-5" />
        </span>
        <h1 className="mt-2 font-heading text-lg font-extrabold text-[#031F82]">
          Enter your {PIN_NAMES.parent}
        </h1>
        <p className="mx-auto mt-1 max-w-[17rem] font-sans text-[13px] leading-snug text-[#1E3A5F]">
          {body}
        </p>
        <p
          data-pin-difference
          className="mx-auto mt-1.5 max-w-[17rem] font-sans text-[11.5px] leading-snug text-[#4A5675]"
        >
          {pinDifferenceLine(childCount)}
        </p>

        <PinBoxes
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (error) setError(null);
          }}
          disabled={busy}
          label={PIN_NAMES.parent}
          inputDataAttr="data-parent-data-pin-input"
        />

        <p
          data-parent-data-gate-error
          role="alert"
          className="mt-2 min-h-[1.25rem] font-sans text-[12.5px] font-semibold text-[#B42318]"
        >
          {error}
        </p>

        <button
          type="submit"
          data-parent-data-continue
          disabled={busy || pin.length !== 4}
          className="mt-1 w-full max-w-[15rem] rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] transition-opacity disabled:opacity-50"
        >
          {busy ? "Checking…" : "Continue"}
        </button>

        <button
          type="button"
          data-parent-data-forgot
          onClick={() => void forgot()}
          disabled={sending}
          className="mt-3 block w-full font-sans text-xs font-semibold text-[#031F82] underline underline-offset-2 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Forgot your PIN?"}
        </button>
        {notice ? (
          <p
            data-parent-data-gate-notice
            role="status"
            className="mt-2 font-sans text-[12.5px] font-semibold text-[#1E3A5F]"
          >
            {notice}
          </p>
        ) : null}
      </form>
    </div>
  );
}
