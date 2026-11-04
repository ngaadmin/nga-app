import type { ReactNode } from "react";
import type { NodeState } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import styles from "@/components/launchpad/venture-test/venture-test.module.css";
import { BackCrumb, BTN_LIFT, CheckIcon, Heading, LockIcon, TICK_COLOR } from "@/components/launchpad/venture-test/venture-test-ui";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { ComeBackMarker } from "@/components/launchpad/venture/bronze-doors";
import { COME_BACK_LATER_COPY } from "@/lib/launchpad/venture-test/come-back-later";

function Plaque({ label, state, onOpen, onComeBack }: { label: string; state: NodeState; onOpen: () => void; onComeBack?: () => void }) {
  const dot = state === "current" ? "#fff" : state === "done" ? VT.panel : VT.lockDot;
  const surface =
    state === "current"
      ? "bg-nga-secondary text-white shadow-[0_4px_0_#099fb8]"
      : state === "done"
        ? "bg-white text-nga-ink shadow-[inset_0_0_0_2px_#bde9fb]"
        : "bg-[#eef2f6] text-[#8a9bb0]";
  const body = (
    <>
      <span className="block font-heading text-base font-bold">
        {label}
        {state === "locked" && (
          <>
            {" "}
            <LockIcon size={13} />
          </>
        )}
      </span>
      <span className="mt-0.5 block text-xs font-medium opacity-95">
        {state === "current" ? "Tap to start" : state === "done" ? "Tap to review" : "Tap to look inside"}
      </span>
      {(["top", "bottom"] as const).flatMap((v) =>
        (["left", "right"] as const).map((h) => (
          <span
            key={`${v}${h}`}
            aria-hidden="true"
            className="absolute size-1.5 rounded-full"
            style={{ [v]: 8, [h]: 10, background: dot }}
          />
        )),
      )}
      {state === "done" && (
        <span className="absolute -right-2.5 -top-2.5 flex size-[30px] items-center justify-center rounded-full" style={{ background: TICK_COLOR }} aria-hidden="true" data-plaque-tick="">
          <CheckIcon />
        </span>
      )}
    </>
  );
  const cls = `relative mx-auto mb-[18px] block w-[236px] rounded-[10px] px-3 py-4 text-center ${surface}`;
  // Every plaque can be tapped. A locked plaque opens its doors read-only.
  const plaque = (
    <button
      type="button"
      onClick={onOpen}
      className={cls}
      aria-label={`${label}, ${state === "current" ? "up next" : state === "done" ? "done" : "locked"}`}
    >
      {body}
    </button>
  );
  if (!onComeBack) return plaque;
  // A task in this silver was left open: the marker opens it straight away.
  return (
    <div className="relative mx-auto w-[236px]">
      {plaque}
      <button type="button" onClick={onComeBack} className="absolute -left-3 -top-3" aria-label={`${COME_BACK_LATER_COPY.marker}: finish a step in ${label}`}>
        <ComeBackMarker className="block shadow-[0_2px_0_#c88202]" />
      </button>
    </div>
  );
}

/**
 * Floor template "corridor": the gold milestone on the wall, then one plaque
 * per silver (1 to 6, centered in the wall), lift doors on entry, and the
 * level-complete state. Registered in floor-templates.tsx.
 */
function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="#FFA503" />
    </svg>
  );
}

/** Level done on the lift wall: aqua "Congratulations!" with its swash and orange sparkles, then the level line. */
function LevelDone({ level }: { level: number }) {
  return (
    <div className="mt-[34px] flex flex-col items-center text-center" role="status" data-level-done={level}>
      <div className="flex items-center justify-center gap-1.5">
        <Sparkle />
        <span className={`inline-flex flex-col gap-0.5 text-[24px] leading-[1.2] text-[#0CC1E0] ${FREDOKA_CLASS}`}>
          Congratulations!
          <svg width="100%" height="7" viewBox="0 0 74 7" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 4.6C18 2 40 2.2 72 3.4" fill="none" stroke="#0CC1E0" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <Sparkle />
      </div>
      <p className="mt-2.5 font-heading text-[17px] font-semibold text-[#19347D]">You&apos;ve completed Level {level}</p>
    </div>
  );
}

export type CorridorProps = {
  level: number;
  floorName: string;
  goal: string;
  /** `onComeBack`: set when a task in the silver was left open; opens that task. */
  silvers: readonly { id: string; title: string; state: NodeState; onComeBack?: () => void }[];
  /** Play the lift-doors entry animation. */
  entering: boolean;
  note?: string;
  /** Level done (wrapup-binder-r5 screen D): `nextLevel` is null on the top floor. */
  complete?: { nextLevel: number | null; onLift: (() => void) | null };
  onBack: () => void;
  onOpenSilver: (silverId: string) => void;
};

export function CorridorFloor(props: CorridorProps) {
  const { level, floorName, goal, silvers, entering, note, complete, onBack, onOpenSilver } = props;
  const plaques: ReactNode = silvers.map((s) => (
    <Plaque key={s.id} label={s.title} state={s.state} onOpen={() => onOpenSilver(s.id)} onComeBack={s.onComeBack} />
  ));
  return (
    <section className="flex flex-1 flex-col" aria-labelledby="lp-corridor-title">
      <BackCrumb label="Back to building" onClick={onBack} />
      <Heading>
        <span id="lp-corridor-title">
          Level {level} · {floorName}
        </span>
      </Heading>
      <div className="relative mt-1.5 h-[610px] shrink-0 overflow-hidden">
        {/* Wall */}
        <div className="absolute inset-x-[26px] top-5 h-[3px] bg-nga-panel" />
        <div className="absolute inset-x-[26px] top-[470px] h-[3px] bg-nga-panel" />
        <div className="absolute inset-x-[26px] top-[23px] flex h-[447px] flex-col items-center">
          {complete ? (
            <LevelDone level={level} />
          ) : (
            <>
            <p className="mt-[22px] font-heading text-[11px] font-bold tracking-[1.5px] text-nga-secondary">LEVEL {level} GOAL</p>
            <p className="mx-[18px] mt-1.5 text-center font-heading text-[19px] font-bold leading-[1.32] text-nga-ink">{goal}</p>
            <div className="mt-3.5 h-[3px] w-[120px] rounded-sm bg-nga-accent" />
            </>
          )}
          <div className={`flex w-full flex-1 flex-col justify-center ${entering ? styles.plaquesFadeIn : ""}`}>{plaques}</div>
        </div>
        {note && <p className="absolute inset-x-[26px] top-[478px] text-center text-xs text-[#8a9bb0]">{note}</p>}
        {complete?.onLift && complete.nextLevel !== null && (
          <div className="absolute inset-x-[26px] top-[490px] flex justify-center">
            <button type="button" onClick={complete.onLift} className={BTN_LIFT} data-go-to-level={complete.nextLevel}>
              Go to Level {complete.nextLevel}
            </button>
          </div>
        )}
        {/* Lift doors: open strips at the sides; they slide apart on entry. */}
        <div
          aria-hidden="true"
          className={`absolute left-0 top-0 z-raised h-[600px] w-1/2 border-r-4 border-[#c9d6e2] bg-[#dde7ef] ${entering ? styles.doorLeftOpen : ""}`}
          style={entering ? undefined : { transform: "translateX(calc(-100% + 26px))" }}
        />
        <div
          aria-hidden="true"
          className={`absolute right-0 top-0 z-raised h-[600px] w-1/2 border-l-4 border-[#c9d6e2] bg-[#dde7ef] ${entering ? styles.doorRightOpen : ""}`}
          style={entering ? undefined : { transform: "translateX(calc(100% - 26px))" }}
        />
      </div>
    </section>
  );
}
