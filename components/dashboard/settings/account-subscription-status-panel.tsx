"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import { representativeBirthYearForCohort } from "@/lib/onboarding/birth-years";
import {
  approveConsentRequestInApp,
  listPendingConsentRequestsForParent,
  type PendingConsentRequestView,
} from "@/lib/onboarding/approve-consent-request";
import {
  convertToRegisteredProfile,
  DASHBOARD_ADD_PROFILE_PATH,
  ONBOARDING_ENTRY_PATH,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { deleteHouseholdMasterAccount } from "@/lib/onboarding/delete-household-master";
import {
  approvePendingLearnerAccount,
  listPendingConsentsForEmail,
} from "@/lib/onboarding/parent-consent-pending";
import {
  deleteMasterAccountCascade,
  displayAccountIdentity,
  listHouseholdAccounts,
  removeRegisteredAccountByUsername,
  resolveHouseholdEmail,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { useSettingsParentView } from "@/lib/dashboard/testing-settings-view";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const dangerButtonClass =
  "rounded-nga-lg border-2 border-red-200 bg-white px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

const approveButtonClass =
  "rounded-nga-lg border-2 border-[#0CC1E0]/50 bg-white px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

const destructiveCtaClass =
  "rounded-nga-lg border-b-4 border-red-700 bg-red-600 font-heading text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

type HouseholdView = {
  master: UserSession | null;
  children: UserSession[];
  householdEmail: string | null;
};

type PendingDelete =
  | { kind: "child"; username: string }
  | { kind: "master"; username: string };

type PendingLinkItem = {
  username: string;
  requestId?: string;
  childBirthYear?: number | null;
  kind?: "vpc" | "parent_claim";
};

function usernameKey(value: string): string {
  return value.trim().toLowerCase();
}

function mergePendingLinks(input: {
  children: UserSession[];
  remote: PendingConsentRequestView[];
  local: ReturnType<typeof listPendingConsentsForEmail>;
}): { householdPending: PendingLinkItem[]; waitingToLink: PendingLinkItem[] } {
  const byUsername = new Map<string, PendingLinkItem & { listed: boolean }>();

  for (const child of input.children) {
    if (child.accountStatus !== "PENDING_CONSENT") continue;
    byUsername.set(usernameKey(child.username), {
      username: child.username,
      childBirthYear: child.birthYear,
      listed: true,
    });
  }

  for (const remote of input.remote) {
    const key = usernameKey(remote.childUsername);
    const existing = byUsername.get(key);
    if (existing) {
      existing.requestId = remote.requestId;
      existing.childBirthYear = existing.childBirthYear ?? remote.childBirthYear;
      existing.kind = remote.kind;
      continue;
    }
    byUsername.set(key, {
      username: remote.childUsername,
      requestId: remote.requestId,
      childBirthYear: remote.childBirthYear,
      kind: remote.kind,
      listed: false,
    });
  }

  for (const local of input.local) {
    const key = usernameKey(local.childUsername);
    const existing = byUsername.get(key);
    if (existing) {
      existing.childBirthYear = existing.childBirthYear ?? local.birthYear;
      continue;
    }
    byUsername.set(key, {
      username: local.childUsername,
      childBirthYear: local.birthYear,
      listed: false,
    });
  }

  const householdPending: PendingLinkItem[] = [];
  const waitingToLink: PendingLinkItem[] = [];
  for (const item of byUsername.values()) {
    const { listed, ...pending } = item;
    if (listed) householdPending.push(pending);
    else waitingToLink.push(pending);
  }
  return { householdPending, waitingToLink };
}

function readHouseholdForViewer(
  session: UserSession,
  showFullHousehold: boolean,
): HouseholdView {
  const household = listHouseholdAccounts(session);
  if (showFullHousehold || session.accountRole === "parent_master") {
    return household;
  }

  // Learners: own account + linked master only (no siblings).
  const selfKey = session.username.trim().toLowerCase();
  return {
    ...household,
    children: household.children.filter(
      (child) => child.username.trim().toLowerCase() === selfKey,
    ),
  };
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
  const [isMasterViewer, setIsMasterViewer] = useState(false);
  const isParentSettingsView = useSettingsParentView();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [masterDeleteAcknowledged, setMasterDeleteAcknowledged] =
    useState(false);
  const [isDeletingHousehold, setIsDeletingHousehold] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [approvingUsername, setApprovingUsername] = useState<string | null>(
    null,
  );
  const [approveError, setApproveError] = useState<string | null>(null);
  const [remotePending, setRemotePending] = useState<
    PendingConsentRequestView[]
  >([]);

  const refresh = useCallback(() => {
    const session = readUserSession();
    if (!session || session.accessMode !== "registered") {
      setActiveUsername(null);
      setIsMasterViewer(false);
      setHousehold({ master: null, children: [], householdEmail: null });
      setRemotePending([]);
      return;
    }
    setActiveUsername(session.username.trim() || null);
    setIsMasterViewer(session.accountRole === "parent_master");
    setHousehold(readHouseholdForViewer(session, isParentSettingsView));

    if (session.accountRole === "parent_master") {
      void listPendingConsentRequestsForParent().then((result) => {
        if (result.ok) setRemotePending(result.requests);
      });
    } else {
      setRemotePending([]);
    }
  }, [isParentSettingsView]);

  useEffect(() => {
    refresh();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  const pendingLinks = useMemo(() => {
    const local = household.householdEmail
      ? listPendingConsentsForEmail(household.householdEmail)
      : [];
    return mergePendingLinks({
      children: household.children,
      remote: remotePending,
      local,
    });
  }, [household.children, household.householdEmail, remotePending]);

  function leaveAfterDestructiveDelete() {
    clearAllAppSessionState();
    router.replace(ONBOARDING_ENTRY_PATH);
  }

  function closeDeleteDialog() {
    if (isDeletingHousehold) return;
    setPendingDelete(null);
    setMasterDeleteAcknowledged(false);
    setDeleteError(null);
  }

  function openMasterDelete(username: string) {
    setDeleteError(null);
    setMasterDeleteAcknowledged(false);
    setPendingDelete({ kind: "master", username });
  }

  function handleApproveChild(username: string) {
    const pending = pendingLinks.householdPending.find(
      (item) => usernameKey(item.username) === usernameKey(username),
    );
    void handleLinkProfile(pending ?? { username });
  }

  async function handleLinkProfile(item: PendingLinkItem) {
    if ((!isMasterViewer && !isParentSettingsView) || approvingUsername) return;
    const masterEmail =
      household.householdEmail ??
      (readUserSession() ? resolveHouseholdEmail(readUserSession()!) : null);
    if (!masterEmail) {
      setApproveError(copy.approveChildError);
      return;
    }

    setApprovingUsername(item.username);
    setApproveError(null);

    try {
      let linkedRemotely = false;
      if (item.requestId && isMasterViewer) {
        const remote = await approveConsentRequestInApp(item.requestId);
        if (!remote.success) {
          setApproveError(remote.error || copy.approveChildError);
          return;
        }
        linkedRemotely = true;
        const birthYear =
          remote.childBirthYear ??
          item.childBirthYear ??
          representativeBirthYearForCohort(
            remote.kind === "vpc" ? "explorer" : "pathfinder",
          );
        const now = new Date().toISOString();
        const childSession = convertToRegisteredProfile({
          username: remote.childUsername,
          birthYear,
          accountRole: "child",
          parentEmail: remote.parentEmail || masterEmail,
          accountStatus: "ACTIVE",
          consentApprovedAt: now,
          supabaseUserId: remote.childId,
        });
        upsertRegisteredAccount({ ...childSession, createdAt: now });
      }

      const localActivated = approvePendingLearnerAccount({
        childUsername: item.username,
        masterEmail,
      });
      if (!linkedRemotely && !localActivated) {
        setApproveError(copy.approveChildError);
        return;
      }
      refresh();
    } catch {
      setApproveError(copy.approveChildError);
    } finally {
      setApprovingUsername(null);
    }
  }

  async function confirmPendingDelete() {
    if (!pendingDelete || isDeletingHousehold) return;

    if (pendingDelete.kind === "child") {
      const targetKey = pendingDelete.username.trim().toLowerCase();
      const selfKey = activeUsername?.trim().toLowerCase() ?? "";
      // Learners may only delete themselves; masters may delete any linked learner.
      if (!isMasterViewer && targetKey !== selfKey) {
        setPendingDelete(null);
        return;
      }

      const removed = removeRegisteredAccountByUsername(pendingDelete.username);
      setPendingDelete(null);
      if (!removed) return;

      if (targetKey === selfKey) {
        leaveAfterDestructiveDelete();
        return;
      }

      refresh();
      return;
    }

    if (!isMasterViewer || !masterDeleteAcknowledged) {
      return;
    }

    setIsDeletingHousehold(true);
    setDeleteError(null);

    try {
      const result = await deleteHouseholdMasterAccount();
      if (!result.success) {
        setDeleteError(result.error || copy.deleteMasterError);
        return;
      }

      deleteMasterAccountCascade(pendingDelete.username);
      setPendingDelete(null);
      leaveAfterDestructiveDelete();
    } catch {
      setDeleteError(copy.deleteMasterError);
    } finally {
      setIsDeletingHousehold(false);
    }
  }

  const deleteDialogTitle =
    pendingDelete?.kind === "master"
      ? copy.deleteMasterTitle
      : copy.deleteChildTitle;
  const deleteDialogBody =
    pendingDelete?.kind === "master"
      ? copy.deleteMasterConfirm
      : copy.deleteChildConfirm;

  return (
    <>
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
                <div className="min-w-0">
                  <p className="break-all font-heading text-base font-extrabold text-[#031F82]">
                    {household.householdEmail ||
                      displayAccountIdentity(household.master)}
                  </p>
                  <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#0CC1E0]">
                    {copy.masterBadge}
                  </p>
                </div>
                {isParentSettingsView ? (
                  <button
                    type="button"
                    className={cn(dangerButtonClass, "mt-3 w-full")}
                    onClick={() =>
                      openMasterDelete(household.master!.username)
                    }
                  >
                    {copy.deleteMaster}
                  </button>
                ) : null}
              </li>
            ) : null}

            {household.children.map((child) => {
              const isPending = child.accountStatus === "PENDING_CONSENT";
              const isSelf =
                Boolean(activeUsername) &&
                child.username.trim().toLowerCase() ===
                  activeUsername!.trim().toLowerCase();
              const canDeleteChild = isParentSettingsView || isSelf;
              const canApproveChild = isParentSettingsView && isPending;
              return (
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
                        {isPending ? ` · ${copy.pendingApprovalBadge}` : ""}
                      </p>
                    </div>
                    {canDeleteChild || canApproveChild ? (
                      <div className="flex shrink-0 flex-col items-stretch gap-2">
                        {canApproveChild ? (
                          <button
                            type="button"
                            className={approveButtonClass}
                            disabled={approvingUsername === child.username}
                            onClick={() => handleApproveChild(child.username)}
                          >
                            {approvingUsername === child.username
                              ? copy.linkingProfile
                              : copy.linkProfile}
                          </button>
                        ) : null}
                        {canDeleteChild ? (
                          <button
                            type="button"
                            className={dangerButtonClass}
                            onClick={() =>
                              setPendingDelete({
                                kind: "child",
                                username: child.username,
                              })
                            }
                          >
                            {copy.deleteChild}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {approveError ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {approveError}
            </p>
          ) : null}

          {isParentSettingsView && !household.master && !isMasterViewer ? (
            <p className="font-sans text-sm font-semibold leading-relaxed text-[#031F82]">
              {copy.needParentPrompt}
            </p>
          ) : null}

          {!household.master && household.children.length === 0 ? (
            <p className="font-sans text-sm text-[#1E3A5F]">
              {copy.noAccountsYet}
            </p>
          ) : null}

          {isParentSettingsView &&
          household.master &&
          household.children.length === 0 &&
          pendingLinks.waitingToLink.length === 0 ? (
            <p className="font-sans text-sm text-[#1E3A5F]">
              {copy.emptyChildren}
            </p>
          ) : null}

          {isParentSettingsView && pendingLinks.waitingToLink.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="font-heading text-xs font-extrabold uppercase tracking-wide text-[#031F82]">
                  {copy.pendingHeading}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-[#1E3A5F]">
                  {copy.pendingHint}
                </p>
              </div>
              <ul className="space-y-3">
                {pendingLinks.waitingToLink.map((item) => (
                  <li
                    key={item.username}
                    className="rounded-xl border-2 border-[#FFA503]/50 bg-[#FFF8EC] px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-base font-extrabold text-[#031F82]">
                          {item.username}
                        </p>
                        <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-wide text-[#C88202]">
                          {copy.pendingApprovalBadge}
                        </p>
                      </div>
                      {isMasterViewer ? (
                        <button
                          type="button"
                          className={approveButtonClass}
                          disabled={approvingUsername === item.username}
                          onClick={() => void handleLinkProfile(item)}
                        >
                          {approvingUsername === item.username
                            ? copy.linkingProfile
                            : copy.linkProfile}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {isParentSettingsView ? (
            <button
              type="button"
              onClick={() => router.push(DASHBOARD_ADD_PROFILE_PATH)}
              className="h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
            >
              {household.master || isMasterViewer
                ? copy.addProfile
                : copy.createParentSubmit}
            </button>
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

      <ModalShell
        isOpen={pendingDelete !== null}
        onClose={closeDeleteDialog}
        role="alertdialog"
        align="center"
        labelledBy="account-delete-title"
        describedBy="account-delete-body"
        dismissOnBackdrop={!isDeletingHousehold}
        backdropClassName="bg-[#031F82]/55"
        panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        <h2
          id="account-delete-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {deleteDialogTitle}
        </h2>
        {pendingDelete?.kind === "master" ? (
          <div id="account-delete-body" className="mt-2 space-y-3">
            <p className="font-sans text-sm leading-snug text-[#1E3A5F]">
              {copy.deleteMasterConfirm}
            </p>
            <ul className="list-disc space-y-1 pl-5 font-sans text-sm leading-snug text-[#1E3A5F]">
              <li>{copy.deleteMasterConfirmParent}</li>
              <li>{copy.deleteMasterConfirmChildren}</li>
              <li>{copy.deleteMasterConfirmData}</li>
            </ul>
            <label className="flex items-start gap-2 font-sans text-sm leading-snug text-[#031F82]">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[#031F82]"
                checked={masterDeleteAcknowledged}
                disabled={isDeletingHousehold}
                onChange={(event) =>
                  setMasterDeleteAcknowledged(event.target.checked)
                }
              />
              <span>{copy.deleteMasterAcknowledge}</span>
            </label>
          </div>
        ) : (
          <p
            id="account-delete-body"
            className="mt-2 font-sans text-sm leading-snug text-[#1E3A5F]"
          >
            {deleteDialogBody}
          </p>
        )}
        {deleteError ? (
          <p className="mt-3 font-sans text-sm font-medium text-red-600" role="alert">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={closeDeleteDialog}
            disabled={isDeletingHousehold}
            className="flex-1 py-2 font-heading text-sm font-bold text-[#0CC1E0] disabled:opacity-40"
          >
            {copy.deleteCancelAction}
          </button>
          <button
            type="button"
            onClick={() => void confirmPendingDelete()}
            disabled={
              isDeletingHousehold ||
              (pendingDelete?.kind === "master" && !masterDeleteAcknowledged)
            }
            className={cn("flex-1 px-3 py-2", destructiveCtaClass)}
          >
            {pendingDelete?.kind === "master" && isDeletingHousehold
              ? copy.deleteMasterDeleting
              : copy.deleteConfirmAction}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
