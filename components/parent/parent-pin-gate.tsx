"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LockIcon } from "@/lib/dashboard/icons";
import { isParentTabPin } from "@/lib/parent/parent-tab-pin";
import {
  confirmParentPasswordForPinReset,
  createParentPin,
  getParentPinState,
  openParentTabGate,
} from "@/lib/parent/parent-tab-server";
import { cn } from "@/lib/utils/cn";

type Phase = "loading" | "set" | "confirm" | "enter" | "forgot";

const CARD_SHADOW = "shadow-[0_4px_24px_-4px_rgb(3_31_130/0.14)]";

function PinBoxes({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="relative mx-auto mt-3 w-fit">
      <div className="flex justify-center gap-2.5" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "flex h-[46px] w-10 items-center justify-center rounded-xl border-2 bg-[#E8F6FC] font-heading text-xl font-extrabold text-[#031F82]",
              index < value.length ? "border-[#031F82]" : "border-[#C9D6EA]",
            )}
          >
            {index < value.length ? "•" : ""}
          </span>
        ))}
      </div>
      <input
        data-parent-tab-pin-input
        aria-label={label}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        autoFocus
        disabled={disabled}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
        className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Parent PIN prompt. Everything is checked on the server: whether a PIN
 * exists, the PIN itself, failed tries and the 5-minute lockout. A correct
 * PIN returns a short-lived pass that the caller keeps in memory only.
 * Used by the Parent tab and by every approve or decline in Settings.
 */
export function ParentPinGate({
  parentName,
  enterBody,
  onUnlocked,
  className,
}: {
  parentName: string;
  /** Line under "Enter your parent PIN". */
  enterBody?: string;
  onUnlocked: (pass: string) => void | Promise<void>;
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pendingPin = useRef("");
  const hasPin = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getParentPinState().then((state) => {
      if (cancelled) return;
      if (!state.ok) {
        setError(state.error);
        setPhase("enter");
        return;
      }
      hasPin.current = state.hasPin;
      setLockedUntil(state.lockedUntil);
      setNow(Date.now());
      setPhase(state.hasPin ? "enter" : "set");
    });
    return () => {
      cancelled = true;
      pendingPin.current = "";
    };
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        setLockedUntil(null);
        setError(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const lockedOut = Boolean(lockedUntil && lockedUntil > now);

  function go(next: Phase) {
    setPin("");
    setPassword("");
    setError(null);
    setPhase(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || phase === "loading") return;
    setError(null);

    if (phase === "forgot") {
      setBusy(true);
      const result = await confirmParentPasswordForPinReset(password);
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      hasPin.current = false;
      setLockedUntil(null);
      go("set");
      return;
    }

    if (!isParentTabPin(pin)) {
      setError("Enter 4 numbers.");
      return;
    }

    if (phase === "set") {
      pendingPin.current = pin;
      go("confirm");
      return;
    }

    setBusy(true);
    try {
      if (phase === "confirm") {
        if (pin !== pendingPin.current) {
          pendingPin.current = "";
          go("set");
          setError("Those didn't match. Pick your PIN again.");
          return;
        }
        pendingPin.current = "";
        const created = await createParentPin(pin);
        if (!created.ok) {
          setPin("");
          setError(created.error);
          return;
        }
        hasPin.current = true;
        await onUnlocked(created.pass);
        return;
      }

      const result = await openParentTabGate(pin);
      if (result.ok) {
        await onUnlocked(result.pass);
        return;
      }
      setPin("");
      if (result.reason === "locked") {
        setLockedUntil(result.lockedUntil);
        setNow(Date.now());
        setError("Too many wrong tries.");
      } else if (result.reason === "missing") {
        hasPin.current = false;
        go("set");
      } else if (result.reason === "wrong") {
        setError(
          `That PIN didn't match. ${result.triesLeft} ${result.triesLeft === 1 ? "try" : "tries"} left.`,
        );
      } else {
        setError(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return (
      <div
        data-parent-tab-gate="loading"
        className={cn(
          "mx-1 mt-4 rounded-2xl bg-white px-4 py-8 text-center font-sans text-sm text-[#1E3A5F]",
          CARD_SHADOW,
          className,
        )}
      >
        Loading…
      </div>
    );
  }

  const title =
    phase === "set"
      ? "Create your parent PIN"
      : phase === "confirm"
        ? "Enter your new PIN again"
        : phase === "forgot"
          ? "Reset your parent PIN"
          : "Enter your parent PIN";
  const body =
    phase === "set"
      ? "Pick 4 numbers. You'll need them for the Parent tab and for every approval."
      : phase === "confirm"
        ? "Type the same 4 numbers to confirm."
        : phase === "forgot"
          ? "Confirm your account password, then pick a new PIN."
          : (enterBody ??
            `Hi${parentName ? ` ${parentName}` : ""}. Enter your PIN to continue.`);

  return (
    <form
      data-parent-tab-gate={phase}
      onSubmit={submit}
      className={cn(
        "mx-1 mt-4 rounded-2xl bg-white px-4 pb-4 pt-5 text-center",
        CARD_SHADOW,
        className,
      )}
    >
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#E8F6FC] text-[#031F82]">
        <LockIcon className="size-5" />
      </span>
      <h2 className="mt-2 font-heading text-lg font-extrabold text-[#031F82]">
        {title}
      </h2>
      <p className="mx-auto mt-1 max-w-[17rem] font-sans text-[13px] leading-snug text-[#1E3A5F]">
        {body}
      </p>

      {phase === "forgot" ? (
        <input
          data-parent-tab-password
          type="password"
          autoComplete="current-password"
          aria-label="Account password"
          placeholder="Account password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mx-auto mt-3 block w-full max-w-[15rem] rounded-xl border-2 border-[#C9D6EA] bg-[#E8F6FC] px-3 py-2.5 font-sans text-sm text-[#031F82] outline-none focus:border-[#031F82]"
        />
      ) : (
        <PinBoxes
          key={phase}
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (error && !lockedOut) setError(null);
          }}
          disabled={busy || lockedOut}
          label={phase === "confirm" ? "Confirm parent PIN" : "Parent PIN"}
        />
      )}

      <p
        data-parent-tab-gate-error
        role="alert"
        className="mt-2 min-h-[1.25rem] font-sans text-[12.5px] font-semibold text-[#B42318]"
      >
        {lockedOut && lockedUntil
          ? `Too many wrong tries. Try again in ${formatCountdown(lockedUntil - now)}.`
          : error}
      </p>

      <button
        type="submit"
        data-parent-tab-continue
        disabled={
          busy ||
          lockedOut ||
          (phase === "forgot" ? !password : pin.length !== 4)
        }
        className="mt-1 w-full max-w-[15rem] rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] transition-opacity disabled:opacity-50"
      >
        {busy ? "Checking…" : "Continue"}
      </button>

      {phase === "enter" ? (
        <button
          type="button"
          data-parent-tab-forgot
          onClick={() => go("forgot")}
          className="mt-3 block w-full font-sans text-xs font-semibold text-[#031F82] underline underline-offset-2"
        >
          Forgot your PIN?
        </button>
      ) : phase === "forgot" || phase === "confirm" ? (
        <button
          type="button"
          onClick={() => go(hasPin.current ? "enter" : "set")}
          className="mt-3 block w-full font-sans text-xs font-semibold text-[#031F82] underline underline-offset-2"
        >
          Back
        </button>
      ) : null}
    </form>
  );
}
