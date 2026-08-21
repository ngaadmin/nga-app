"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  getComplianceTierFromBirthYear,
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";
import {
  isEligibleBirthYear,
  representativeBirthYearForCohort,
} from "@/lib/onboarding/birth-years";
import {
  approveConsentRequestInApp,
  listPendingConsentRequestsForParent,
  type PendingConsentRequestView,
} from "@/lib/onboarding/approve-consent-request";
import {
  listLinkedChildrenForCurrentParent,
  type LinkedHouseholdChild,
} from "@/lib/onboarding/list-linked-children";
import {
  convertToRegisteredProfile,
  DASHBOARD_ADD_PROFILE_PATH,
  ONBOARDING_ENTRY_PATH,
  ONBOARDING_SIGN_IN_PATH,
  ONBOARDING_SIGN_UP_LEARNER_PATH,
  ONBOARDING_SIGN_UP_PARENT_PATH,
  isGuestSession,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { deleteHouseholdMasterAccount } from "@/lib/onboarding/delete-household-master";
import { notifyAccountDeletedChild } from "@/lib/onboarding/issue-account-deleted-email";
import { approvePendingLearnerAccount } from "@/lib/onboarding/parent-consent-pending";
import {
  deleteMasterAccountCascade,
  displayAccountIdentity,
  findRegisteredAccountByUsername,
  removeRegisteredAccountByUsername,
  resolveHouseholdEmail,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { USER_SESSION_UPDATED_EVENT } from "@/lib/onboarding/user-session-events";
import { useSettingsParentView } from "@/lib/dashboard/testing-settings-view";
import { AccountRowTrack } from "@/components/dashboard/settings/account-row-track";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const quietDeleteClass =
  "font-sans text-xs font-medium text-[#5B6B7C] underline underline-offset-2 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40";

const approveButtonClass =
  "shrink-0 rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

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

function extraPendingFromRemote(input: {
  children: UserSession[];
  remote: PendingConsentRequestView[];
}): PendingLinkItem[] {
  const listed = new Set(
    input.children.map((child) => usernameKey(child.username)),
  );
  const extra = new Map<string, PendingLinkItem>();

  for (const remote of input.remote) {
    const key = usernameKey(remote.childUsername);
    if (listed.has(key)) continue;
    extra.set(key, {
      username: remote.childUsername,
      requestId: remote.requestId,
      childBirthYear: remote.childBirthYear,
      kind: remote.kind,
    });
  }

  return [...extra.values()];
}

function linkedChildToSession(
  row: LinkedHouseholdChild,
  parentEmail: string | null,
): UserSession {
  const curriculumCohort: MasteryCohort =
    row.curriculumCohort ??
    (row.birthYear ? getMasteryCohortFromBirthYear(row.birthYear) : "explorer");
  const birthYear =
    row.birthYear && isEligibleBirthYear(row.birthYear)
      ? row.birthYear
      : representativeBirthYearForCohort(curriculumCohort);
  const pending = row.accountStatus === "pending_consent";
  return {
    accessMode: "registered",
    username: row.username,
    birthYear,
    birthYearLocked: true,
    ageTier: getComplianceTierFromBirthYear(birthYear),
    curriculumCohort,
    accountStatus: pending ? "PENDING_CONSENT" : "ACTIVE",
    accountRole: "child",
    parentEmail: parentEmail ?? undefined,
    createdAt: new Date().toISOString(),
    consentApprovedAt: pending ? undefined : (row.consentApprovedAt ?? undefined),
    supabaseUserId: row.userId,
  };
}

function householdForLearnerViewer(session: UserSession): HouseholdView {
  return {
    master: null,
    children: session.accountRole === "child" ? [session] : [],
    householdEmail: resolveHouseholdEmail(session),
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
  const [isGuest, setIsGuest] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
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
  const [householdLoadError, setHouseholdLoadError] = useState<string | null>(
    null,
  );
  const [householdLoading, setHouseholdLoading] = useState(false);
  const refreshGeneration = useRef(0);

  const refresh = useCallback(() => {
    const session = readUserSession();
    const generation = ++refreshGeneration.current;
    if (!session || session.accessMode !== "registered") {
      setActiveUsername(null);
      setIsMasterViewer(false);
      setIsGuest(!session || isGuestSession(session));
      setHousehold({ master: null, children: [], householdEmail: null });
      setRemotePending([]);
      setHouseholdLoadError(null);
      setHouseholdLoading(false);
      setSessionReady(true);
      return;
    }
    setIsGuest(false);
    setActiveUsername(session.username.trim() || null);
    const isParent = session.accountRole === "parent_master";
    setIsMasterViewer(isParent);
    const householdEmail = resolveHouseholdEmail(session);

    if (!isParent) {
      setHousehold(householdForLearnerViewer(session));
      setRemotePending([]);
      setHouseholdLoadError(null);
      setHouseholdLoading(false);
      setSessionReady(true);
      return;
    }

    setHousehold({
      master: session,
      children: [],
      householdEmail,
    });
    setHouseholdLoading(true);
    setSessionReady(true);

    void (async () => {
      try {
        const [linked, pending] = await Promise.all([
          listLinkedChildrenForCurrentParent(),
          listPendingConsentRequestsForParent(),
        ]);
        if (generation !== refreshGeneration.current) return;

        if (!linked.ok) {
          setHousehold({ master: session, children: [], householdEmail });
          setHouseholdLoadError(
            linked.error || "Could not load linked children. Try again.",
          );
        } else {
          setHouseholdLoadError(null);
          setHousehold({
            master: session,
            children: linked.children.map((child) =>
              linkedChildToSession(child, householdEmail),
            ),
            householdEmail,
          });
        }

        setRemotePending(pending.ok ? pending.requests : []);
      } catch {
        if (generation !== refreshGeneration.current) return;
        setHousehold({ master: session, children: [], householdEmail });
        setHouseholdLoadError("Could not load linked children. Try again.");
        setRemotePending([]);
      } finally {
        if (generation === refreshGeneration.current) {
          setHouseholdLoading(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(USER_SESSION_UPDATED_EVENT, refresh);
    };
  }, [refresh]);

  const extraPending = useMemo(
    () =>
      extraPendingFromRemote({
        children: household.children,
        remote: remotePending,
      }),
    [household.children, remotePending],
  );

  const deletableAccounts = useMemo(() => {
    const canManageHousehold = isMasterViewer || isParentSettingsView;
    const children = household.children.filter((child) => {
      const isSelf =
        Boolean(activeUsername) &&
        child.username.trim().toLowerCase() ===
          activeUsername!.trim().toLowerCase();
      return canManageHousehold || isSelf;
    });
    return {
      master: canManageHousehold ? household.master : null,
      children,
    };
  }, [
    activeUsername,
    household.children,
    household.master,
    isMasterViewer,
    isParentSettingsView,
  ]);

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

  function pendingItemForUsername(username: string): PendingLinkItem {
    const extra = extraPending.find(
      (item) => usernameKey(item.username) === usernameKey(username),
    );
    if (extra) return extra;

    const remote = remotePending.find(
      (item) => usernameKey(item.childUsername) === usernameKey(username),
    );
    const child = household.children.find(
      (item) => usernameKey(item.username) === usernameKey(username),
    );
    return {
      username,
      requestId: remote?.requestId,
      childBirthYear: child?.birthYear ?? remote?.childBirthYear,
      kind: remote?.kind,
    };
  }

  function handleApproveChild(username: string) {
    void handleLinkProfile(pendingItemForUsername(username));
  }

  function markChildApprovedInList(
    username: string,
    nextChild?: UserSession | null,
  ) {
    const key = usernameKey(username);
    setRemotePending((current) =>
      current.filter((request) => usernameKey(request.childUsername) !== key),
    );
    setHousehold((current) => {
      const exists = current.children.some(
        (child) => usernameKey(child.username) === key,
      );
      if (exists) {
        return {
          ...current,
          children: current.children.map((child) =>
            usernameKey(child.username) === key
              ? {
                  ...child,
                  accountStatus: "ACTIVE",
                  consentApprovedAt: new Date().toISOString(),
                }
              : child,
          ),
        };
      }
      if (nextChild) {
        return { ...current, children: [...current.children, nextChild] };
      }
      return current;
    });
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
      let approvedChild: UserSession | null = null;
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
        approvedChild = childSession;
      }

      const localActivated = approvePendingLearnerAccount({
        childUsername: item.username,
        masterEmail,
      });
      if (!linkedRemotely && !localActivated) {
        setApproveError(copy.approveChildError);
        return;
      }
      markChildApprovedInList(item.username, localActivated ?? approvedChild);
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

      const account = findRegisteredAccountByUsername(pendingDelete.username);
      const noticeEmail =
        household.householdEmail ??
        account?.parentEmail ??
        account?.learnerEmail ??
        account?.email ??
        null;
      if (noticeEmail) {
        void notifyAccountDeletedChild({
          recipientEmail: noticeEmail,
          username: pendingDelete.username,
        });
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
                <div className="space-y-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="break-all font-heading text-base font-extrabold leading-snug text-[#031F82]">
                      {household.householdEmail ||
                        displayAccountIdentity(household.master)}
                    </p>
                    <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#0CC1E0]">
                      {copy.masterBadge}
                    </p>
                  </div>
                  <AccountRowTrack
                    account={household.master}
                    canChange={false}
                  />
                </div>
              </li>
            ) : null}

            {household.children.map((child) => {
              const isPending = child.accountStatus === "PENDING_CONSENT";
              const canApproveChild = isParentSettingsView && isPending;
              return (
                <li
                  key={child.username}
                  className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-heading text-base font-extrabold leading-snug text-[#031F82]">
                          {child.username}
                        </p>
                        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#1E3A5F]">
                          {copy.childBadge}
                          {isPending ? ` · ${copy.pendingApprovalBadge}` : ""}
                        </p>
                      </div>
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
                    </div>
                    <AccountRowTrack
                      account={child}
                      canChange={isMasterViewer || isParentSettingsView}
                    />
                  </div>
                </li>
              );
            })}

            {isParentSettingsView
              ? extraPending.map((item) => (
                  <li
                    key={item.username}
                    className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-heading text-base font-extrabold leading-snug text-[#031F82]">
                          {item.username}
                        </p>
                        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-[#1E3A5F]">
                          {copy.childBadge}
                          {` · ${copy.pendingApprovalBadge}`}
                        </p>
                      </div>
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
                    </div>
                  </li>
                ))
              : null}
          </ul>

          {householdLoadError ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {householdLoadError}
            </p>
          ) : null}

          {approveError ? (
            <p className="font-sans text-sm font-medium text-red-600" role="alert">
              {approveError}
            </p>
          ) : null}

          {isParentSettingsView && !isGuest && !household.master && !isMasterViewer ? (
            <p className="font-sans text-sm font-semibold leading-relaxed text-[#031F82]">
              {copy.needParentPrompt}
            </p>
          ) : null}

          {sessionReady && isGuest ? (
            <div className="space-y-3">
              <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
                {copy.guestEmptyHint}
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`${ONBOARDING_SIGN_UP_PARENT_PATH}&from=account`)
                }
                className="h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
              >
                {copy.guestCreateParent}
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(`${ONBOARDING_SIGN_UP_LEARNER_PATH}&from=account`)
                }
                className="h-touch w-full rounded-nga-lg border-2 border-[#0CC1E0] bg-white px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-colors hover:bg-[#BDE9FB]/30"
              >
                {copy.guestSaveLearner}
              </button>
              <button
                type="button"
                onClick={() => router.push(ONBOARDING_SIGN_IN_PATH)}
                className="w-full py-2 text-center font-heading text-sm font-bold text-[#0CC1E0] underline-offset-2 hover:underline"
              >
                {copyMatrix.onboarding.signIn.heroLogIn}
              </button>
            </div>
          ) : sessionReady && !household.master && household.children.length === 0 ? (
            <p className="font-sans text-sm text-[#1E3A5F]">
              {copy.noAccountsYet}
            </p>
          ) : null}

          {isParentSettingsView &&
          household.master &&
          !householdLoading &&
          !householdLoadError &&
          household.children.length === 0 &&
          extraPending.length === 0 ? (
            <p className="font-sans text-sm text-[#1E3A5F]">
              {copy.emptyChildren}
            </p>
          ) : null}

          {isParentSettingsView && !isGuest ? (
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

          {deletableAccounts.master ||
          deletableAccounts.children.length > 0 ? (
            <div className="space-y-2 border-t border-[#BDE9FB]/70 pt-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-[#8FA3B0]">
                {copy.deleteSectionHeading}
              </h3>
              <div className="flex flex-col items-start gap-2">
                {deletableAccounts.master ? (
                  <button
                    type="button"
                    className={quietDeleteClass}
                    onClick={() =>
                      openMasterDelete(deletableAccounts.master!.username)
                    }
                  >
                    {copy.deleteMaster}
                  </button>
                ) : null}
                {deletableAccounts.children.map((child) => (
                  <button
                    key={child.username}
                    type="button"
                    className={quietDeleteClass}
                    onClick={() =>
                      setPendingDelete({
                        kind: "child",
                        username: child.username,
                      })
                    }
                  >
                    {copy.deleteChildNamed.replace(
                      "{username}",
                      child.username,
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
