"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import styles from "@/components/launchpad/venture-test/venture-test.module.css";

/** Lift going up: doors close, the indicator moves from one floor to the next. */
export function VentureLift({ from, to, toName }: { from: number; to: number; toName: string }) {
  const goingUp = useSurfaceCopy().lift.goingUp;
  return (
    <section className="relative h-[690px] shrink-0" aria-live="polite" aria-label={`${goingUp} ${to} · ${toName}`}>
      <div className="absolute inset-x-[115px] top-10 flex h-[84px] items-center justify-center gap-3 rounded-2xl bg-nga-ink font-heading text-[34px] font-extrabold text-white">
        <span className={styles.liftFromDim}>{from}</span>
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" className={styles.liftArrow}>
          <path d="M12 4l7 9h-4.5v7h-5v-7H5z" fill={VT.cta} />
        </svg>
        <span className={styles.liftToLit}>{to}</span>
      </div>
      <p className="absolute inset-x-0 top-[140px] text-center font-heading text-sm font-semibold text-nga-slate">
        {goingUp} {to} · {toName}
      </p>
      <div className="absolute inset-x-10 top-[180px] h-[470px] overflow-hidden rounded-t-[10px] bg-nga-panel">
        <div className={`absolute left-2.5 top-2.5 h-[460px] w-[calc(50%-13px)] bg-[#dde7ef] ${styles.liftDoorLeftClose}`} />
        <div className={`absolute right-2.5 top-2.5 h-[460px] w-[calc(50%-13px)] bg-[#dde7ef] ${styles.liftDoorRightClose}`} />
        <div className="absolute left-1/2 top-2.5 h-[460px] w-1.5 -translate-x-1/2 bg-white" />
      </div>
      <div className="absolute inset-x-5 top-[650px] h-[3px] bg-nga-panel" />
    </section>
  );
}
