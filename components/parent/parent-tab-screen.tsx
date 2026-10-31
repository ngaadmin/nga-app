"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { ProfileAvatarImage } from "@/components/dashboard/profile/profile-avatar";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { GoldCoinIcon } from "@/lib/dashboard/icons";
import { markLinkedChildCashInPaid } from "@/lib/dashboard/linked-child-exchange-rate";
import {
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { readStoredProfileAvatarId } from "@/lib/dashboard/profile-avatar";
import {
  approveConsentRequestFromParentTab,
  declineConsentRequestFromParentTab,
} from "@/lib/onboarding/approve-consent-request";
import { convertToRegisteredProfile } from "@/lib/onboarding/guest-session";
import { upsertRegisteredAccount } from "@/lib/onboarding/registered-accounts";
import { ParentPinGate } from "@/components/parent/parent-pin-gate";
import { settleHelpLine } from "@/lib/parent/parent-tab-copy";
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
      className={cn(
        // Full-bleed light blue page, as in the r6 design. Cancels the
        // dashboard main padding so the color reaches the edges.
        "-mx-4 -mt-6 -mb-[calc(112px+env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col bg-[#E8F6FC] px-3.5 pb-[calc(112px+env(safe-area-inset-bottom))] pt-3.5 sm:-mx-6 md:-mb-8 md:pb-8",
      )}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-x-hidden">
        <h1 className="font-heading text-2xl font-extrabold leading-tight text-[#031F82]">
          Parent dashboard
        </h1>
        <p className="mt-px font-sans text-[13px] text-[#1E3A5F]">
          Only you can see this. It&apos;s PIN-protected.
        </p>

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
            className="mx-0"
            enterBody={`Hi${parentName ? ` ${parentName}` : ""}. Enter your PIN to open the Parent tab.`}
            onUnlocked={unlock}
          />
        )}
      </div>
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

const TRACK_CHIP: Record<MasteryCohort, string> = {
  explorer: "bg-[#EDE7FE] text-[#6D3FE0]",
  pathfinder: "bg-[#E0F7FB] text-[#0288A3]",
  maverick: "bg-[#FFE9D6] text-[#B45309]",
};

/** One child: avatar, name, track, lifetime lessons, coins to cash in. */
function ChildCard({ child }: { child: ParentTabChildSummary }) {
  const avatarId = readStoredProfileAvatarId(
    child.userId,
    child.cohort ?? "explorer",
  );
  return (
    <div
      data-parent-tab-child={child.username}
      className={cn(
        "grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-3.5",
        CARD_SHADOW,
      )}
    >
      <ProfileAvatarImage avatarId={avatarId} className="size-14" />
      <div className="min-w-0">
        <p className="truncate font-heading text-[17px] font-bold leading-tight text-[#031F82]">
          {child.username}
        </p>
        {child.status === "waiting" ? (
          <span className="mt-1 inline-block rounded-full bg-[#FFE7B3] px-[9px] py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.3px] text-[#8A5300]">
            Waiting
          </span>
        ) : child.cohort ? (
          <span
            data-parent-tab-child-track
            className={cn(
              "mt-1 inline-block rounded-full px-[9px] py-0.5 font-heading text-[10px] font-bold uppercase tracking-[0.3px]",
              TRACK_CHIP[child.cohort],
            )}
          >
            {masteryCohortLabel(child.cohort)}
          </span>
        ) : null}
      </div>
      <div
        data-parent-tab-child-summary
        className="flex flex-col items-end gap-1.5 text-right font-sans text-[12.5px] font-medium text-[#1E3A5F]"
      >
        <span className="inline-flex items-center whitespace-nowrap">
          <b className="mr-[3px] font-heading text-sm font-bold text-[#031F82]">
            {child.lessonsDone}
          </b>
          {summaryWord(child.lessonsDone, "lesson", "lessons")}
        </span>
        <span
          data-parent-tab-child-coins
          className="inline-flex items-center whitespace-nowrap rounded-full bg-[#FFF4DE] py-[3px] pl-1.5 pr-2.5"
        >
          <GoldCoinIcon className="mr-[5px] size-[15px]" />
          <b className="mr-[3px] font-heading text-sm font-bold text-[#031F82]">
            {child.coins}
          </b>
          {summaryWord(child.coins, "coin", "coins")} to cash in
        </span>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden
      className={cn(
        "block shrink-0 text-[#031F82] transition-transform",
        open && "rotate-180",
      )}
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Messages log, collapsed by default. No messages table exists yet, so the
 * open log says so; the unread badge counts unread rows (0 for now).
 */
function MessagesLog({ messages }: { messages: readonly never[] }) {
  const [open, setOpen] = useState(false);
  const unread = 0;
  return (
    <section
      data-parent-tab-messages
      data-parent-tab-messages-state={open ? "open" : "closed"}
      className={cn("mt-3 rounded-2xl bg-white px-3.5", CARD_SHADOW)}
    >
      <button
        type="button"
        data-parent-tab-messages-toggle
        aria-expanded={open}
        aria-controls="parent-tab-messages-log"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 py-[13px] text-left"
      >
        <h2 className="flex-1 font-heading text-[15px] font-bold text-[#031F82]">
          Messages
        </h2>
        <span
          data-parent-tab-messages-unread={unread}
          className={cn(
            "rounded-full px-2 py-0.5 font-sans text-[11.5px] font-semibold",
            unread > 0
              ? "bg-[#E11D48] text-white"
              : "bg-[#EEF3FA] text-[#64748b]",
          )}
        >
          {unread} unread
        </span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <div id="parent-tab-messages-log" className="pb-[13px]">
          {messages.length === 0 ? (
            <p className="border-t border-[#eef3fa] pt-2.5 font-sans text-[13px] font-semibold text-[#031F82]">
              No messages yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
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
  const [review, setReview] = useState<Extract<
    ParentTabOkItem,
    { kind: "approval" }
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  /** Approve/decline tapped: the PIN is asked again for this one action. */
  const [decision, setDecision] = useState<"approve" | "decline" | null>(null);
  /** To settle: the parent confirms they paid this amount outside the app. */
  const [settle, setSettle] = useState<Extract<
    ParentTabOkItem,
    { kind: "owed" }
  > | null>(null);
  const [settleBusy, setSettleBusy] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

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

  async function markPaid() {
    if (!settle || settleBusy) return;
    setSettleBusy(true);
    setSettleError(null);
    try {
      const result = await markLinkedChildCashInPaid({
        childId: settle.childUserId,
      });
      if (!result.ok) {
        setSettleError(result.error || "Could not mark that as paid. Try again.");
        return;
      }
      setSettle(null);
      onChanged();
    } finally {
      setSettleBusy(false);
    }
  }

  return (
    <div data-parent-tab-content>
      <div
        data-parent-tab-children
        className="mt-3 flex flex-col gap-2.5"
        role="group"
        aria-label="Your children"
      >
        {data.children.map((child) => (
          <ChildCard key={child.userId} child={child} />
        ))}
      </div>

      <section
        data-parent-tab-needs-ok
        className={cn(
          "mt-3 rounded-2xl border-2 border-[#FFA503] bg-[#FFF8EA] px-3.5 pb-1 pt-[13px]",
          CARD_SHADOW,
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-bold text-[#031F82]">
            Needs your OK
          </h2>
          <small className="font-sans text-[11.5px] font-semibold text-[#8A5300]">
            {data.needsOk.length === 0
              ? "All done"
              : `${data.needsOk.length} to do`}
          </small>
        </div>
        {data.needsOk.length === 0 ? (
          <p className="pb-2.5 pt-1 font-sans text-[12.5px] text-[#1E3A5F]">
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
                "flex items-center gap-2.5 py-2.5",
                index > 0 && "border-t border-[#F6DFA8]",
              )}
            >
              <div className="min-w-0 flex-1 font-sans text-[13.5px] font-bold leading-tight text-[#031F82]">
                <em className="mb-0.5 block font-sans text-[10.5px] font-semibold uppercase not-italic tracking-[0.3px] text-[#8A5300]">
                  {item.kind === "approval" ? "Account approval" : "To settle"}
                </em>
                {item.kind === "approval" ? (
                  <>
                    {item.childUsername} is waiting for approval
                    {shortDate(item.expiresAt) ? (
                      <span className="mt-0.5 block font-sans text-[11.5px] font-medium text-[#1E3A5F]">
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
                    <span
                      data-parent-tab-settle-help
                      className="mt-0.5 block font-sans text-[11.5px] font-medium text-[#1E3A5F]"
                    >
                      {settleHelpLine(item.cashIns)}
                    </span>
                  </>
                )}
              </div>
              {item.kind === "approval" ? (
                <button
                  type="button"
                  data-parent-tab-review
                  data-parent-ok-pill
                  onClick={() => {
                    setReviewError(null);
                    setReview(item);
                  }}
                  className="parent-ok-pill"
                >
                  Review
                </button>
              ) : (
                <button
                  type="button"
                  data-parent-tab-mark-paid
                  data-parent-ok-pill
                  onClick={() => {
                    setSettleError(null);
                    setSettle(item);
                  }}
                  className="parent-ok-pill"
                >
                  Mark as paid
                </button>
              )}
            </div>
          ))
        )}
      </section>

      <MessagesLog messages={data.messages} />

      <ModalShell
        isOpen={Boolean(settle)}
        onClose={() => {
          if (settleBusy) return;
          setSettle(null);
        }}
        layer="toast"
        labelledBy="parent-tab-settle-title"
        backdropClassName="bg-[#031F82]/55"
        panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
      >
        {settle ? (
          <div data-parent-tab-settle-sheet>
            <h2
              id="parent-tab-settle-title"
              className="font-heading text-lg font-extrabold text-[#031F82]"
            >
              Did you pay {settle.childUsername}{" "}
              {formatMoney(settle.owedCents / 100, currencyCode)}?
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
              The app doesn&apos;t move money. Pay {settle.childUsername}{" "}
              yourself, then mark it as paid here. The amount owed goes back
              to zero.
            </p>
            {settleError ? (
              <p
                role="alert"
                className="mt-2 font-sans text-[12.5px] font-semibold text-[#B42318]"
              >
                {settleError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                data-parent-tab-mark-paid-confirm
                disabled={settleBusy}
                onClick={() => void markPaid()}
                className="rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] disabled:opacity-50"
              >
                Yes, mark as paid
              </button>
              <button
                type="button"
                data-parent-tab-mark-paid-cancel
                disabled={settleBusy}
                onClick={() => setSettle(null)}
                className="py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
              >
                Not yet
              </button>
            </div>
          </div>
        ) : null}
      </ModalShell>

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
