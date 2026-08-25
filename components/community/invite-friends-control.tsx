"use client";

import { useState, type FormEvent } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import { vaultHomeCompactCtaAutoClass } from "@/lib/dashboard/vault/vault-action-form-styles";
import { EMAIL_PATTERN } from "@/lib/validation/email";
import { cn } from "@/lib/utils/cn";

const invitePrimaryBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40";

const inviteNavyOutlineBtnClass =
  "inline-flex h-touch min-h-touch flex-1 items-center justify-center rounded-nga-lg border-2 border-[#031F82] bg-white px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-colors hover:bg-[#F0FBFF] active:bg-[#FAFDFF] disabled:cursor-not-allowed disabled:opacity-40";

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
  const [email, setEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
        className={vaultHomeCompactCtaAutoClass}
      >
        + Invite Friends
      </button>
      <ModalShell
        isOpen={open}
        onClose={closePanel}
        align="center"
        labelledBy="invite-friends-title"
        backdropClassName="bg-[#031F82]/50"
        panelClassName="flex max-h-[min(92vh,36rem)] max-w-lg flex-col rounded-2xl border-0 bg-white p-0 shadow-md"
      >
        <div className="shrink-0 border-b border-[#BDE9FB]/40 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="invite-friends-title"
              className="min-w-0 font-heading text-lg font-extrabold text-[#031F82]"
            >
              Invite a friend
            </h2>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close"
              className="shrink-0 rounded-lg px-2 py-1 font-heading text-lg font-bold leading-none text-[#1E3A5F]/60 transition-colors hover:bg-[#BDE9FB]/40 hover:text-[#031F82]"
            >
              ✕
            </button>
          </div>
        </div>

        <div id="invite-friends-panel" className="space-y-3 px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={inviteNavyOutlineBtnClass}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className={invitePrimaryBtnClass}
            >
              Share
            </button>
          </div>
          <form className="space-y-2" onSubmit={handleEmailSubmit}>
            <label
              htmlFor="friend-invite-email"
              className="block font-heading text-sm font-bold uppercase tracking-wide text-[#031F82]"
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
              className={cn(inviteNavyOutlineBtnClass, "w-full")}
            >
              {sending ? "Sending..." : "Send email"}
            </button>
          </form>
        </div>
      </ModalShell>
    </div>
  );
}
