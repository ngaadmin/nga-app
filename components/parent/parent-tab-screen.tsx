"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ModalShell } from "@/components/ui/modal-shell";
import { ProfileAvatarImage } from "@/components/dashboard/profile/profile-avatar";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { CheckIcon, GoldCoinIcon, LockIcon } from "@/lib/dashboard/icons";
import { masteryCohortLabel } from "@/lib/dashboard/mastery-cohort";
import { readStoredProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import {
  approveConsentRequestFromParentTab,
  declineConsentRequestFromParentTab,
} from "@/lib/onboarding/approve-consent-request";
import { convertToRegisteredProfile } from "@/lib/onboarding/guest-session";
import { upsertRegisteredAccount } from "@/lib/onboarding/registered-accounts";
import { ParentPinGate } from "@/components/parent/parent-pin-gate";
import {
  loadParentTabData,
  type ParentTabChildSummary,
  type ParentTabData,
  type ParentTabOkItem,
} from "@/lib/parent/parent-tab-server";
import { cn } from "@/lib/utils/cn";

const CARD_SHADOW = "shadow-[0_4px_24px_-4px_rgb(3_31_130/0.14)]";

/**
 * Parent tab. Asks for the parent PIN every time it opens: the unlocked
 * state lives only in this component, so leaving the tab (unmount),
 * reloading, or backgrounding the app (visibilitychange / pagehide) locks
 * it again. Nothing here runs when switching into the parent profile.
 */
export function ParentTabScreen({
  parentUserId,
  parentName,
}: {
  parentUserId: string;
  parentName: string;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [pass, setPass] = useState<string | null>(null);
  const [data, setData] = useState<ParentTabData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lockGeneration = useRef(0);

  const lock = useCallback(() => {
    lockGeneration.current += 1;
    setPass(null);
    setData(null);
    setLoadError(null);
    setUnlocked(false);
    setGateKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") lock();
    };
    window.addEventListener("pagehide", lock);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      lockGeneration.current += 1;
      window.removeEventListener("pagehide", lock);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lock]);

  const refresh = useCallback(
    async (gatePass: string) => {
      const generation = lockGeneration.current;
      const result = await loadParentTabData(gatePass);
      if (generation !== lockGeneration.current) return;
      if (!result.ok) {
        if (result.locked) lock();
        else setLoadError(result.error);
        return;
      }
      setLoadError(null);
      setData(result.data);
    },
    [lock],
  );

  /** The server checked the PIN and signed this pass. Memory only. */
  const unlock = useCallback(
    (gatePass: string) => {
      setPass(gatePass);
      setUnlocked(true);
      void refresh(gatePass);
    },
    [refresh],
  );

  return (
    <div
      data-parent-tab
      data-parent-tab-state={unlocked ? "unlocked" : "locked"}
      className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-x-hidden bg-white px-1 py-2 pb-8"
    >
      <div className="px-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-[25px] font-extrabold leading-tight tracking-[-0.2px] text-[#031F82]">
            Parent dashboard
          </h1>
          {unlocked ? (
            <button
              type="button"
              data-parent-tab-lock
              onClick={lock}
              className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F6FC] px-2.5 py-1 font-sans text-[11px] font-semibold text-[#031F82] transition-opacity hover:opacity-80"
            >
              <LockIcon className="size-3.5" />
              Lock
            </button>
          ) : null}
        </div>
        <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">
          Only you can see this. We ask for your PIN every time you open it.
        </p>
      </div>

      {unlocked ? (
        pass ? (
          <UnlockedView
            data={data}
            loadError={loadError}
            onChanged={() => void refresh(pass)}
          />
        ) : null
      ) : (
        <ParentPinGate
          key={`${parentUserId}:${gateKey}`}
          parentName={parentName}
          enterBody={`Hi${parentName ? ` ${parentName}` : ""}. Enter your PIN to open the Parent tab.`}
          onUnlocked={unlock}
        />
      )}
    </div>
  );
}

function summaryWord(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

function shortDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChildCard({
  child,
  selected,
  onSelect,
}: {
  child: ParentTabChildSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const avatarId = readStoredProfileAvatarId(
    child.userId,
    child.cohort ?? "explorer",
  );
  return (
    <button
      type="button"
      data-parent-tab-child={child.username}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative min-w-0 rounded-[14px] border-2 px-[9px] py-2 text-left transition-colors",
        selected
          ? "border-[#031F82] bg-white"
          : "border-transparent bg-[#E8F6FC]",
      )}
    >
      {selected ? (
        <span className="absolute right-2 top-[7px] flex size-4 items-center justify-center rounded-full bg-[#031F82] text-white">
          <CheckIcon className="size-2.5" />
        </span>
      ) : null}
      <span className="flex items-center gap-[7px] pr-4">
        <ProfileAvatarImage avatarId={avatarId} className="size-8" />
        <span className="min-w-0">
          <span className="block truncate font-heading text-sm font-bold leading-tight text-[#031F82]">
            {child.username}
          </span>
          {child.status === "waiting" ? (
            <span className="mt-0.5 inline-block rounded-full bg-[#FFE7B3] px-1.5 py-px font-sans text-[10px] font-semibold text-[#8A5300]">
              Waiting
            </span>
          ) : child.cohort ? (
            <span className="block font-heading text-[10px] font-bold uppercase text-[#0288A3]">
              {masteryCohortLabel(child.cohort)}
            </span>
          ) : null}
        </span>
      </span>
      <span
        data-parent-tab-child-summary
        className="mt-[7px] flex items-center gap-[7px] whitespace-nowrap font-sans text-[11px] font-semibold text-[#1E3A5F]"
      >
        <span>
          <b className="font-heading text-xs font-bold text-[#031F82]">
            {child.lessonsDone}
          </b>{" "}
          {summaryWord(child.lessonsDone, "lesson", "lessons")} done
        </span>
        <span
          className="flex items-center gap-0.5"
          data-parent-tab-child-coins
          aria-label={`${child.coins} coins to cash in`}
        >
          <GoldCoinIcon className="size-[13px]" />
          <b className="font-heading text-xs font-bold text-[#031F82]">
            {child.coins}
          </b>
        </span>
      </span>
    </button>
  );
}

function UnlockedView({
  data,
  loadError,
  onChanged,
}: {
  data: ParentTabData | null;
  loadError: string | null;
  onChanged: () => void;
}) {
  const { currencyCode } = useCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<Extract<
    ParentTabOkItem,
    { kind: "approval" }
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  /** Approve/decline tapped: the PIN is asked again for this one action. */
  const [decision, setDecision] = useState<"approve" | "decline" | null>(null);

  if (loadError) {
    return (
      <p className="mx-1 mt-4 rounded-2xl bg-[#FEF3F2] px-4 py-3 font-sans text-sm text-[#B42318]">
        {loadError}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="mx-1 mt-4 font-sans text-sm text-[#1E3A5F]" role="status">
        Loading…
      </p>
    );
  }

  const selected =
    data.children.find((child) => child.userId === selectedId) ??
    data.children[0] ??
    null;

  async function decide(approve: boolean, actionPass: string) {
    if (!review || busy) return;
    setBusy(true);
    setReviewError(null);
    try {
      if (!approve) {
        const declined = await declineConsentRequestFromParentTab(
          review.requestId,
          actionPass,
        );
        if (!declined.success) {
          setReviewError(declined.error);
          return;
        }
      } else {
        const result = await approveConsentRequestFromParentTab(
          review.requestId,
          actionPass,
        );
        if (!result.success) {
          setReviewError(result.error);
          return;
        }
        const now = new Date().toISOString();
        upsertRegisteredAccount({
          ...convertToRegisteredProfile({
            username: result.childUsername,
            curriculumCohort:
              result.childCohort ??
              review.childCohort ??
              (result.kind === "vpc" ? "explorer" : "pathfinder"),
            accountRole: "child",
            parentEmail: result.parentEmail,
            accountStatus: "ACTIVE",
            consentApprovedAt: now,
            supabaseUserId: result.childId,
          }),
          createdAt: now,
        });
      }
      setReview(null);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-parent-tab-content className="px-1">
      <div
        className="mt-3 grid grid-cols-2 gap-2"
        role="group"
        aria-label="Your children"
      >
        {data.children.map((child) => (
          <ChildCard
            key={child.userId}
            child={child}
            selected={selected?.userId === child.userId}
            onSelect={() => setSelectedId(child.userId)}
          />
        ))}
      </div>

      <section
        data-parent-tab-needs-ok
        className="mt-3 rounded-2xl border-2 border-[#FFA503] bg-[#FFF8EA] px-[13px] pb-1.5 pt-3"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-bold text-[#031F82]">
            Needs your OK
          </h2>
          <small className="font-sans text-xs font-semibold text-[#8A5300]">
            {data.needsOk.length === 0
              ? "All done"
              : `${data.needsOk.length} to do`}
          </small>
        </div>
        {data.needsOk.length === 0 ? (
          <p className="pb-2 pt-1 font-sans text-[12.5px] text-[#1E3A5F]">
            Nothing needs your OK right now.
          </p>
        ) : (
          data.needsOk.map((item, index) => (
            <div
              key={
                item.kind === "approval"
                  ? item.requestId
                  : `owed-${item.childUserId}`
              }
              data-parent-tab-ok-row={item.kind}
              className={cn(
                "flex items-center gap-2.5 py-[9px]",
                index > 0 && "border-t border-[#F6DFA8]",
              )}
            >
              <div className="min-w-0 flex-1 font-sans text-[13px] font-bold leading-tight text-[#031F82]">
                <em className="mb-0.5 block font-sans text-[10.5px] font-semibold uppercase not-italic tracking-[0.3px] text-[#8A5300]">
                  {item.kind === "approval" ? "Account approval" : "To settle"}
                </em>
                {item.kind === "approval" ? (
                  <>
                    {item.childUsername} is waiting for approval
                    {shortDate(item.expiresAt) ? (
                      <span className="mt-px block font-sans text-[11px] font-medium text-[#1E3A5F]">
                        Request expires on {shortDate(item.expiresAt)}.
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    Owed to {item.childUsername}{" "}
                    <span className="font-heading text-base font-extrabold">
                      {formatMoney(item.owedCents / 100, currencyCode)}
                    </span>
                    <span className="mt-px block font-sans text-[11px] font-medium text-[#1E3A5F]">
                      You pay this outside the app.
                    </span>
                  </>
                )}
              </div>
              {item.kind === "approval" ? (
                <button
                  type="button"
                  data-parent-tab-review
                  onClick={() => {
                    setReviewError(null);
                    setReview(item);
                  }}
                  className="shrink-0 rounded-full bg-[#FFA503] px-3.5 py-[7px] font-heading text-[12.5px] font-bold text-white shadow-[0_3px_0_#C88202]"
                >
                  Review
                </button>
              ) : (
                <Link
                  href="/dashboard/settings"
                  className="shrink-0 rounded-full bg-[#FFA503] px-3.5 py-[7px] font-heading text-[12.5px] font-bold text-white shadow-[0_3px_0_#C88202]"
                >
                  Settle
                </Link>
              )}
            </div>
          ))
        )}
      </section>

      <section
        data-parent-tab-messages
        className={cn(
          "mt-2.5 rounded-2xl bg-white px-3.5 py-[13px]",
          CARD_SHADOW,
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-bold text-[#031F82]">
            Messages
          </h2>
        </div>
        <p className="font-sans text-[12.5px] font-semibold text-[#031F82]">
          No messages yet.
        </p>
        <p className="font-sans text-[11px] text-[#64748b]">
          Updates about your children will show up here.
        </p>
      </section>

      <p className="mt-3 text-center font-sans text-xs text-[#1E3A5F]">
        Profiles, coin rates and other controls are in{" "}
        <Link
          href="/dashboard/settings"
          className="font-semibold text-[#031F82] underline underline-offset-2"
        >
          Settings
        </Link>
        .
      </p>

      <ModalShell
        isOpen={Boolean(review)}
        onClose={() => {
          if (busy) return;
          setDecision(null);
          setReview(null);
        }}
        layer="toast"
        labelledBy="parent-tab-review-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        {review ? (
          <div data-parent-tab-review-sheet>
            <h2
              id="parent-tab-review-title"
              className="font-heading text-lg font-extrabold text-[#031F82]"
            >
              Approve {review.childUsername}&apos;s account?
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
              {review.childUsername} signed up
              {review.childCohort
                ? ` on the ${masteryCohortLabel(review.childCohort)} track`
                : ""}{" "}
              and is waiting for you. Approving links the profile to your
              account.
            </p>
            {reviewError ? (
              <p
                role="alert"
                className="mt-2 font-sans text-[12.5px] font-semibold text-[#B42318]"
              >
                {reviewError}
              </p>
            ) : null}
            {decision ? (
              <div data-parent-tab-decision-pin={decision}>
                <ParentPinGate
                  parentName=""
                  className="mx-0 mt-3 shadow-none ring-1 ring-[#E3EAF5]"
                  enterBody={
                    decision === "approve"
                      ? `Enter your parent PIN to approve ${review.childUsername}.`
                      : `Enter your parent PIN to decline ${review.childUsername}.`
                  }
                  onUnlocked={async (actionPass) => {
                    const approve = decision === "approve";
                    setDecision(null);
                    await decide(approve, actionPass);
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDecision(null)}
                  className="mt-2 block w-full py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
                >
                  Back
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  data-parent-tab-approve
                  disabled={busy}
                  onClick={() => {
                    setReviewError(null);
                    setDecision("approve");
                  }}
                  className="rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  data-parent-tab-decline
                  disabled={busy}
                  onClick={() => {
                    setReviewError(null);
                    setDecision("decline");
                  }}
                  className="rounded-full border-2 border-[#C9D6EA] py-2 font-heading text-sm font-bold text-[#031F82] disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  data-parent-tab-review-cancel
                  disabled={busy}
                  onClick={() => setReview(null)}
                  className="py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
