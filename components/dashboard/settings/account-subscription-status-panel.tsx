"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copyMatrix } from "@/constants/copyMatrix";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  ONBOARDING_SIGN_IN_PATH,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  deleteMasterAccountCascade,
  listHouseholdAccounts,
  removeRegisteredAccountByUsername,
} from "@/lib/onboarding/registered-accounts";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const dangerButtonClass =
  "rounded-nga-lg border-2 border-red-200 bg-white px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

type HouseholdView = {
  master: UserSession | null;
  children: UserSession[];
  householdEmail: string | null;
};

function readHousehold(): HouseholdView {
  const session = readUserSession();
  if (!session || session.accessMode !== "registered") {
    return { master: null, children: [], householdEmail: null };
  }
  return listHouseholdAccounts(session);
}

export function AccountSubscriptionStatusPanel() {
  const router = useRouter();
  const copy = copyMatrix.dashboard.settings.accountSubscription;
  const [household, setHousehold] = useState<HouseholdView>({
    master: null,
    children: [],
    householdEmail: null,
  });
  const [activeUsername, setActiveUsername] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const session = readUserSession();
    setActiveUsername(session?.username?.trim() || null);
    setHousehold(readHousehold());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  function leaveAfterDestructiveDelete() {
    clearAllAppSessionState();
    router.replace(ONBOARDING_SIGN_IN_PATH);
  }

  function handleDeleteChild(username: string) {
    if (!window.confirm(copy.deleteChildConfirm)) return;

    const removed = removeRegisteredAccountByUsername(username);
    if (!removed) return;

    if (
      activeUsername &&
      activeUsername.trim().toLowerCase() === username.trim().toLowerCase()
    ) {
      leaveAfterDestructiveDelete();
      return;
    }

    refresh();
  }

  function handleDeleteMaster(username: string) {
    if (!window.confirm(copy.deleteMasterConfirm)) return;

    const removed = deleteMasterAccountCascade(username);
    if (removed.length === 0) return;

    leaveAfterDestructiveDelete();
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82]"
        >
          ← {copy.backLabel}
        </button>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">
            {copy.title}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {copy.description}
          </p>
        </div>
      </div>

      <section
        aria-labelledby="accounts-heading"
        className={cn(floatingPanelClass, "space-y-4 p-4")}
      >
        <h2
          id="accounts-heading"
          className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82]"
        >
          {copy.accountsHeading}
        </h2>

        <ul className="space-y-3">
          {household.master ? (
            <li className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-extrabold text-[#031F82]">
                    {household.master.username}
                  </p>
                  <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#0CC1E0]">
                    {copy.masterBadge}
                  </p>
                  {household.householdEmail ? (
                    <p className="mt-1 truncate font-sans text-xs text-[#1E3A5F]">
                      {household.householdEmail}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={dangerButtonClass}
                  onClick={() =>
                    handleDeleteMaster(household.master!.username)
                  }
                >
                  {copy.deleteMaster}
                </button>
              </div>
            </li>
          ) : null}

          {household.children.map((child) => (
            <li
              key={child.username}
              className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-extrabold text-[#031F82]">
                    {child.username}
                  </p>
                  <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#1E3A5F]">
                    {copy.childBadge}
                    {child.accountStatus === "PENDING_CONSENT"
                      ? " · Pending approval"
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className={dangerButtonClass}
                  onClick={() => handleDeleteChild(child.username)}
                >
                  {copy.deleteChild}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {!household.master && household.children.length === 0 ? (
          <p className="font-sans text-sm text-[#1E3A5F]">
            No registered accounts found for this session.
          </p>
        ) : null}

        {household.master && household.children.length === 0 ? (
          <p className="font-sans text-sm text-[#1E3A5F]">{copy.emptyChildren}</p>
        ) : null}
      </section>

      <section
        aria-labelledby="subscription-heading"
        className={cn(floatingPanelClass, "space-y-2 p-4")}
      >
        <h2
          id="subscription-heading"
          className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82]"
        >
          {copy.subscriptionHeading}
        </h2>
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {copy.subscriptionPlaceholder}
        </p>
      </section>
    </div>
  );
}
