"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
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
import {
  checkParentTabPin,
  clearParentTabPin,
  hasParentTabPin,
  isParentTabPin,
  parentTabPinLockedUntil,
  setParentTabPin,
} from "@/lib/parent/parent-tab-pin";
import {
  confirmParentPasswordForPinReset,
  loadParentTabData,
  openParentTabGate,
  type ParentTabChildSummary,
  type ParentTabData,
  type ParentTabOkItem,
} from "@/lib/parent/parent-tab-server";
import { cn } from "@/lib/utils/cn";

type GatePhase = "set" | "confirm" | "enter" | "forgot" | "unlocked";

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
  const [phase, setPhase] = useState<GatePhase | null>(null);
  const [pass, setPass] = useState<string | null>(null);
  const [data, setData] = useState<ParentTabData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lockGeneration = useRef(0);
  /** First PIN typed while creating one. Memory only, cleared on lock. */
  const pendingPin = useRef("");

  const lock = useCallback(() => {
    lockGeneration.current += 1;
    pendingPin.current = "";
    setPass(null);
    setData(null);
    setLoadError(null);
    setPhase(hasParentTabPin(parentUserId) ? "enter" : "set");
  }, [parentUserId]);

  useEffect(() => {
    lock();
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

  const unlock = useCallback(async (): Promise<string | null> => {
    const generation = lockGeneration.current;
    const gate = await openParentTabGate();
    if (generation !== lockGeneration.current) return null;
    if (!gate.ok) return gate.error;
    setPass(gate.pass);
    setPhase("unlocked");
    void refresh(gate.pass);
    return null;
  }, [refresh]);

  return (
    <div
      data-parent-tab
      data-parent-tab-state={phase === "unlocked" ? "unlocked" : "locked"}
      className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-x-hidden bg-white px-1 py-2 pb-8"
    >
      <div className="px-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-[25px] font-extrabold leading-tight tracking-[-0.2px] text-[#031F82]">
            Parent dashboard
          </h1>
          {phase === "unlocked" ? (
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

      {phase === null ? null : phase === "unlocked" ? (
        pass ? (
          <UnlockedView
            data={data}
            loadError={loadError}
            pass={pass}
            onChanged={() => void refresh(pass)}
            onLocked={lock}
          />
        ) : null
      ) : (
        <PinGate
          key={phase}
          phase={phase}
          pendingPin={pendingPin}
          parentUserId={parentUserId}
          parentName={parentName}
          setPhase={setPhase}
          onUnlocked={unlock}
        />
      )}
    </div>
  );
}

function PinBoxes({
  value,
  onChange,
  disabled,
  label,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label: string;
  autoFocus?: boolean;
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
        autoFocus={autoFocus}
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

function PinGate({
  phase,
  pendingPin,
  parentUserId,
  parentName,
  setPhase,
  onUnlocked,
}: {
  phase: Exclude<GatePhase, "unlocked">;
  pendingPin: { current: string };
  parentUserId: string;
  parentName: string;
  setPhase: (phase: GatePhase) => void;
  onUnlocked: () => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [lockedUntil, setLockedUntil] = useState<number | null>(() =>
    phase === "enter" ? parentTabPinLockedUntil(parentUserId) : null,
  );
  const [now, setNow] = useState(() => Date.now());

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (phase === "forgot") {
      setBusy(true);
      const result = await confirmParentPasswordForPinReset(password);
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearParentTabPin(parentUserId);
      setPhase("set");
      return;
    }

    if (!isParentTabPin(pin)) {
      setError("Enter 4 numbers.");
      return;
    }

    if (phase === "set") {
      pendingPin.current = pin;
      setPhase("confirm");
      return;
    }

    setBusy(true);
    try {
      if (phase === "confirm") {
        if (pin !== pendingPin.current) {
          pendingPin.current = "";
          setBusy(false);
          setPhase("set");
          return;
        }
        pendingPin.current = "";
        await setParentTabPin(parentUserId, pin);
      } else {
        const result = await checkParentTabPin(parentUserId, pin);
        if (!result.ok) {
          setPin("");
          if (result.reason === "locked") {
            setLockedUntil(result.lockedUntil);
            setNow(Date.now());
            setError("Too many wrong tries.");
          } else if (result.reason === "missing") {
            setPhase("set");
          } else {
            setError(
              `That PIN didn't match. ${result.triesLeft} ${result.triesLeft === 1 ? "try" : "tries"} left.`,
            );
          }
          return;
        }
      }
      const gateError = await onUnlocked();
      if (gateError) setError(gateError);
    } finally {
      setBusy(false);
    }
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
      ? "Pick 4 numbers. You'll need them every time you open this tab."
      : phase === "confirm"
        ? "Type the same 4 numbers to confirm."
        : phase === "forgot"
          ? "Confirm your account password, then pick a new PIN."
          : `Hi${parentName ? ` ${parentName}` : ""}. Enter your PIN to open the Parent tab.`;

  return (
    <form
      data-parent-tab-gate={phase}
      onSubmit={submit}
      className={cn(
        "mx-1 mt-4 rounded-2xl bg-white px-4 pb-4 pt-5 text-center",
        CARD_SHADOW,
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
          onClick={() => setPhase("forgot")}
          className="mt-3 block w-full font-sans text-xs font-semibold text-[#031F82] underline underline-offset-2"
        >
          Forgot your PIN?
        </button>
      ) : phase === "forgot" || phase === "confirm" ? (
        <button
          type="button"
          onClick={() =>
            setPhase(hasParentTabPin(parentUserId) ? "enter" : "set")
          }
          className="mt-3 block w-full font-sans text-xs font-semibold text-[#031F82] underline underline-offset-2"
        >
          Back
        </button>
      ) : null}
    </form>
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
          {summaryWord(child.lessonsDone, "lesson", "lessons")}
        </span>
        <span
          className="flex items-center gap-0.5"
          aria-label={`${child.dayStreak} day streak`}
        >
          <span aria-hidden>🔥</span>
          <b className="font-heading text-xs font-bold text-[#031F82]">
            {child.dayStreak}
          </b>
        </span>
        <span
          className="flex items-center gap-0.5"
          aria-label={`${child.coins} coins`}
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
  pass,
  onChanged,
  onLocked,
}: {
  data: ParentTabData | null;
  loadError: string | null;
  pass: string;
  onChanged: () => void;
  onLocked: () => void;
}) {
  const { currencyCode } = useCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<Extract<
    ParentTabOkItem,
    { kind: "approval" }
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

  async function decide(approve: boolean) {
    if (!review || busy) return;
    setBusy(true);
    setReviewError(null);
    try {
      if (!approve) {
        const declined = await declineConsentRequestFromParentTab(
          review.requestId,
          pass,
        );
        if (!declined.success) {
          setReviewError(declined.error);
          if (/PIN/.test(declined.error)) onLocked();
          return;
        }
      } else {
        const result = await approveConsentRequestFromParentTab(
          review.requestId,
          pass,
        );
        if (!result.success) {
          setReviewError(result.error);
          if (/PIN/.test(result.error)) onLocked();
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
        onClose={() => (busy ? undefined : setReview(null))}
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
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide(true)}
                className="rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide(false)}
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
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
