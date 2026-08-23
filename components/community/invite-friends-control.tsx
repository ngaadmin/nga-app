"use client";

import { useEffect, useState, type FormEvent } from "react";
import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import { EMAIL_PATTERN } from "@/lib/validation/email";

const FALLBACK_LANDING_ORIGIN = "https://nga-app-three.vercel.app";

function inviteLandingUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return `${new URL(fromEnv).origin}/`;
    } catch {
      // fall through
    }
  }
  return `${FALLBACK_LANDING_ORIGIN}/`;
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to execCommand
  }
  if (typeof document === "undefined") return false;
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(field);
  return ok;
}

/** Copy / Share / optional email invite. Landing URL only, no invite codes. */
export function InviteFriendsControl() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [email, setEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  function closePanel() {
    setOpen(false);
    setCopied(false);
    setEmailNotice(null);
    setEmailError(null);
    setSending(false);
  }

  const landingUrl = inviteLandingUrl();

  async function handleCopy() {
    const ok = await copyText(landingUrl);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return;
    }
    try {
      await navigator.share({
        title: "NextGenAchiever$",
        text: "Come try NextGenAchiever$ with me.",
        url: landingUrl,
      });
    } catch {
      // User dismissed the sheet.
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipient = email.trim().toLowerCase();
    setEmailNotice(null);
    if (!recipient || !EMAIL_PATTERN.test(recipient)) {
      setEmailError("Enter a valid email.");
      return;
    }

    setEmailError(null);
    setSending(true);
    try {
      const result = await requestOnboardingEmailSend({
        type: "FRIEND_INVITE",
        recipientEmail: recipient,
        data: {},
      });
      if (!result.success) {
        setEmailError(result.error || "Could not send. Try again.");
        return;
      }
      setEmail("");
      setEmailNotice("Invite sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="invite-friends-panel"
        onClick={() => {
          if (open) {
            closePanel();
            return;
          }
          setOpen(true);
        }}
        className="rounded-nga-lg border-b-4 border-nga-secondary-shadow bg-nga-secondary px-3 py-2 font-heading text-sm font-bold uppercase tracking-wide text-nga-primary shadow-sm transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2"
      >
        + Invite Friends
      </button>
      {open ? (
        <div
          id="invite-friends-panel"
          className="absolute right-0 z-raised mt-2 w-[17.5rem] space-y-3 rounded-2xl border border-nga-panel bg-nga-surface p-3 pt-8 shadow-nga-card"
        >
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md font-heading text-sm font-extrabold leading-none text-nga-primary hover:bg-nga-mist"
            aria-label="Close"
          >
            X
          </button>
          <p className="font-heading text-sm font-extrabold text-nga-primary">
            Invite a friend
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex-1 rounded-nga-lg border border-nga-panel bg-nga-mist/70 px-2 py-2 font-heading text-sm font-bold uppercase tracking-wide text-nga-primary"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            {canShare ? (
              <button
                type="button"
                onClick={() => void handleShare()}
                className="flex-1 rounded-nga-lg border border-nga-panel bg-nga-mist/70 px-2 py-2 font-heading text-sm font-bold uppercase tracking-wide text-nga-primary"
              >
                Share
              </button>
            ) : null}
          </div>
          <form className="space-y-2" onSubmit={handleEmailSubmit}>
            <label
              htmlFor="friend-invite-email"
              className="block font-heading text-sm font-bold uppercase tracking-wide text-nga-primary"
            >
              Email (optional)
            </label>
            <input
              id="friend-invite-email"
              name="friendInviteEmail"
              type="email"
              autoComplete="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
                setEmailNotice(null);
              }}
              className="w-full rounded-nga-lg border border-nga-panel bg-white px-3 py-2 font-sans text-sm text-nga-ink outline-none focus:border-nga-secondary"
            />
            {emailError ? (
              <p className="font-sans text-sm font-medium text-red-600" role="alert">
                {emailError}
              </p>
            ) : null}
            {emailNotice ? (
              <p className="font-sans text-sm font-medium text-nga-primary" role="status">
                {emailNotice}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-nga-lg border-b-4 border-nga-cta-shadow bg-nga-cta px-3 py-2 font-heading text-sm font-bold uppercase tracking-wide text-nga-primary disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send email"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
