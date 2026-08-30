"use client";

import { useEffect, useRef, useState } from "react";
import { vaultHomeCompactCtaAutoClass } from "@/lib/dashboard/vault/vault-action-form-styles";

const PRODUCTION_LANDING_URL = "https://nga-app-three.vercel.app/";

/** One-line invite. Site URL belongs in Web Share `url`, not in this text. */
const APP_INVITE_LINE = "Come try NextGenAchiever$ with me.";

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

/** Native share sheet, or copy the production URL when Web Share is missing. */
export function InviteFriendsControl() {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) {
        window.clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  async function copyProductionLink() {
    const ok = await copyText(PRODUCTION_LANDING_URL);
    setCopied(ok);
    if (ok) {
      if (copiedTimer.current !== null) {
        window.clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleInvite() {
    const withUrl: ShareData = { text: APP_INVITE_LINE, url: PRODUCTION_LANDING_URL };
    const textOnly: ShareData = { text: APP_INVITE_LINE };
    const canNativeShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (!canNativeShare) {
      await copyProductionLink();
      return;
    }

    try {
      const canShareWithUrl =
        typeof navigator.canShare !== "function" || navigator.canShare(withUrl);
      await navigator.share(canShareWithUrl ? withUrl : textOnly);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.share(textOnly);
      } catch {
        await copyProductionLink();
      }
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        onClick={() => void handleInvite()}
        className={vaultHomeCompactCtaAutoClass}
      >
        + Invite Friends
      </button>
      {copied ? (
        <p className="mt-1 font-sans text-sm font-medium text-nga-primary" role="status">
          Link copied
        </p>
      ) : null}
    </div>
  );
}
