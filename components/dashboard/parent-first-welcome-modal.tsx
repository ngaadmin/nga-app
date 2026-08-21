"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import {
  DASHBOARD_SETTINGS_ACCOUNT_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";
import {
  markParentFirstWelcomeSeen,
  shouldShowParentFirstWelcome,
} from "@/lib/onboarding/parent-first-welcome";

function parentWelcomeKey(
  session: ReturnType<typeof readUserSession>,
): string | null {
  if (!session || session.accountRole !== "parent_master") return null;
  const id = session.supabaseUserId?.trim();
  if (id) return id;
  const email = (
    session.learnerEmail ??
    session.email ??
    session.parentEmail ??
    ""
  ).trim();
  return email || null;
}

export function ParentFirstWelcomeModal() {
  const router = useRouter();
  const live = useUserSession();
  const [open, setOpen] = useState(false);
  const [accountKey, setAccountKey] = useState<string | null>(null);
  const copy = copyMatrix.onboarding.parentFirstWelcome;

  useEffect(() => {
    const session = live ?? readUserSession();
    const key = parentWelcomeKey(session);
    setAccountKey(key);
    setOpen(Boolean(key && shouldShowParentFirstWelcome(key)));
  }, [live]);

  function continueIntoApp() {
    if (accountKey) {
      markParentFirstWelcomeSeen(accountKey);
    }
    setOpen(false);
    router.push(DASHBOARD_SETTINGS_ACCOUNT_PATH);
  }

  return (
    <ModalShell
      isOpen={open}
      dismissOnBackdrop={false}
      role="dialog"
      align="center"
      labelledBy="parent-first-welcome-heading"
      describedBy="parent-first-welcome-body"
      panelClassName="rounded-nga-xl border-2 border-[#BDE9FB] bg-white p-6 shadow-nga-pop"
    >
      <div className="space-y-4 text-center">
        <div className="space-y-1.5">
          <h2
            id="parent-first-welcome-heading"
            className="font-heading text-2xl font-extrabold leading-tight text-nga-primary sm:text-[1.75rem]"
          >
            {copy.heading}
          </h2>
          <p className="font-sans text-sm font-semibold leading-snug text-nga-primary sm:text-base">
            {copy.ready}
          </p>
        </div>
        <div
          id="parent-first-welcome-body"
          className="space-y-2 font-sans text-sm leading-relaxed text-nga-ink sm:text-base"
        >
          <p>{copy.follow}</p>
          <p>{copy.habits}</p>
        </div>
        <Button type="button" variant="cta" fullWidth onClick={continueIntoApp}>
          {copy.cta}
        </Button>
      </div>
    </ModalShell>
  );
}
