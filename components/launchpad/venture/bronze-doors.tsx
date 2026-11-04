import type { NodeState } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { Heading, LockIcon, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

function Door({ label, subtitle, state, onOpen }: { label: string; subtitle?: string; state: NodeState; onOpen: () => void }) {
  const doorColor = state === "done" ? VT.panel : state === "current" ? VT.secondary : VT.lockDot;
  const knob = state === "current" ? VT.cta : "#fff";
  const surface =
    state === "done"
      ? "bg-white shadow-[inset_0_0_0_2px_#bde9fb]"
      : state === "current"
        ? "bg-nga-mist shadow-[inset_0_0_0_3px_#0cc1e0]"
        : "bg-[#eef2f6]";
  const body = (
    <>
      <svg width="66" height="104" viewBox="0 0 66 104" aria-hidden="true" className="shrink-0">
        <rect x="0" y="0" width="66" height="104" rx="6" fill="#fff" />
        <rect x="5" y="5" width="56" height="99" rx="4" fill={doorColor} />
        <rect x="12" y="14" width="42" height="30" rx="3" fill="#fff" opacity=".35" />
        <rect x="12" y="52" width="42" height="40" rx="3" fill="#fff" opacity=".35" />
        <circle cx="50" cy="58" r="4" fill={knob} />
      </svg>
      <span className="block text-left">
        <span className={`block font-heading text-[17px] font-bold ${state === "locked" ? "text-[#8a9bb0]" : "text-nga-ink"}`}>{label}</span>
        {subtitle && (
          <span className={`mt-0.5 block text-[13px] leading-snug ${state === "locked" ? "text-[#8a9bb0]" : "text-nga-slate"}`}>{subtitle}</span>
        )}
        <span className="mt-1.5 block">
          {state === "done" && <span className="font-heading text-[13px] font-semibold text-nga-secondary-shadow">✓ Done</span>}
          {state === "current" && (
            <span className="rounded-full bg-nga-cta px-2.5 py-[3px] font-heading text-xs font-bold text-white">Up next</span>
          )}
          {state === "locked" && (
            <span className="font-heading text-[13px] font-semibold text-[#8a9bb0]">
              <LockIcon /> Locked
            </span>
          )}
        </span>
      </span>
    </>
  );
  const cls = `mx-5 mb-4 flex items-center gap-4 rounded-2xl p-3.5 ${surface}`;
  // The open door and finished doors (to review saved work) can be tapped; locked doors are read-only.
  if (state === "current" || state === "done") {
    return (
      <button type="button" onClick={onOpen} className={`${cls} w-[calc(100%-40px)]`}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} aria-disabled="true">
      {body}
    </div>
  );
}

/** One door per bronze in the silver, stacked from the top. */
export function BronzeDoors(props: {
  level: number;
  silverTitle: string;
  bronzes: readonly { id: string; title: string; subtitle?: string; state: NodeState }[];
  /** Set when the plaque is still locked: the doors show read-only. */
  lockedNote?: string;
  onBuilding: () => void;
  onCorridor: () => void;
  onOpenBronze: (bronzeId: string) => void;
}) {
  return (
    <section className="flex flex-1 flex-col">
      <TrailCrumb level={props.level} current={props.silverTitle} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <Heading>{props.silverTitle}</Heading>
      <SubLine className="mb-4">{props.lockedNote ?? "Open a door to see its tasks."}</SubLine>
      {props.bronzes.map((b) => (
        <Door key={b.id} label={b.title} subtitle={b.subtitle} state={b.state} onOpen={() => props.onOpenBronze(b.id)} />
      ))}
    </section>
  );
}
