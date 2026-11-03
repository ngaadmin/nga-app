import type { ReactNode } from "react";
import type { NodeState } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import styles from "@/components/launchpad/venture-test/venture-test.module.css";
import { BackCrumb, BTN_ORANGE, CheckIcon, Heading, LockIcon } from "@/components/launchpad/venture-test/venture-test-ui";

function Plaque({ label, state, onOpen }: { label: string; state: NodeState; onOpen: () => void }) {
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
      {state === "current" && <span className="mt-0.5 block text-xs font-medium opacity-95">Tap to start</span>}
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
        <span className="absolute -right-2.5 -top-2.5 flex size-[30px] items-center justify-center rounded-full bg-nga-accent" aria-hidden="true">
          <CheckIcon />
        </span>
      )}
    </>
  );
  const cls = `relative mx-auto mb-[18px] block w-[236px] rounded-[10px] px-3 py-4 text-center ${surface}`;
  // Only the current plaque can be tapped.
  if (state === "current") {
    return (
      <button type="button" onClick={onOpen} className={cls}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} aria-disabled="true" aria-label={`${label}, ${state === "done" ? "done" : "locked"}`}>
      {body}
    </div>
  );
}

export type CorridorProps = {
  level: number;
  floorName: string;
  goal: string;
  silvers: readonly { id: string; title: string; state: NodeState }[];
  /** Play the lift-doors entry animation. */
  entering: boolean;
  note?: string;
  complete?: { nextLabel: string | null; onLift: (() => void) | null };
  onBack: () => void;
  onOpenSilver: (silverId: string) => void;
};

export function VentureCorridor(props: CorridorProps) {
  const { level, floorName, goal, silvers, entering, note, complete, onBack, onOpenSilver } = props;
  const plaques: ReactNode = silvers.map((s) => (
    <Plaque key={s.id} label={s.title} state={s.state} onOpen={() => onOpenSilver(s.id)} />
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
          <p className="mt-[22px] font-heading text-[11px] font-bold tracking-[1.5px] text-nga-secondary">LEVEL {level} GOAL</p>
          <p className="mx-[18px] mt-1.5 text-center font-heading text-[19px] font-bold leading-[1.32] text-nga-ink">{goal}</p>
          <div className="mt-3.5 h-[3px] w-[120px] rounded-sm bg-nga-accent" />
          <div className={`flex w-full flex-1 flex-col justify-center ${entering ? styles.plaquesFadeIn : ""}`}>{plaques}</div>
        </div>
        {note && <p className="absolute inset-x-[26px] top-[478px] text-center text-xs text-[#8a9bb0]">{note}</p>}
        {complete && (
          <>
            <div className="absolute inset-x-11 top-[476px] flex items-center gap-3 rounded-2xl bg-nga-ink px-3.5 py-3 text-white" role="status">
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-nga-accent" aria-hidden="true">
                <CheckIcon size={22} strokeWidth={2.4} />
              </span>
              <div>
                <p className="font-heading text-base font-bold">Level {level} complete</p>
                <p className="text-[12.5px] opacity-85">{complete.nextLabel ? `${complete.nextLabel} is unlocked` : "Every floor is done"}</p>
              </div>
            </div>
            {complete.onLift && (
              <button type="button" onClick={complete.onLift} className={`${BTN_ORANGE} absolute inset-x-11 top-[556px]`}>
                Take the lift up
              </button>
            )}
          </>
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
