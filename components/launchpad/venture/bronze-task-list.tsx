import { BTN_ORANGE, CheckIcon, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

export function BronzeTaskList(props: {
  level: number;
  bronzeTitle: string;
  tasks: readonly { id: string; title: string; done: boolean }[];
  currentIndex: number;
  onBuilding: () => void;
  onCorridor: () => void;
  onStart: () => void;
}) {
  const doneCount = props.tasks.filter((t) => t.done).length;
  const pct = props.tasks.length ? (doneCount / props.tasks.length) * 100 : 0;
  return (
    <section className="flex flex-1 flex-col">
      <TrailCrumb level={props.level} current={props.bronzeTitle} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <Heading>{props.bronzeTitle}</Heading>
      <SubLine className="mb-1.5">
        {doneCount} of {props.tasks.length} tasks done
      </SubLine>
      <div
        className="mx-5 mb-4 h-2 overflow-hidden rounded bg-nga-mist"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={props.tasks.length}
        aria-valuenow={doneCount}
      >
        <div className="h-full rounded bg-nga-secondary" style={{ width: `${pct}%` }} />
      </div>
      <ol>
        {props.tasks.map((t, i) => {
          const cur = i === props.currentIndex && !t.done;
          return (
            <li
              key={t.id}
              className={`mx-5 mb-3 flex items-center gap-3.5 rounded-2xl bg-white p-4 ${
                cur ? "shadow-[inset_0_0_0_3px_#0cc1e0]" : "shadow-[inset_0_0_0_2px_#bde9fb]"
              }`}
            >
              {t.done ? (
                <span className="flex size-[26px] items-center justify-center rounded-full bg-nga-secondary" aria-label="Done">
                  <CheckIcon size={14} />
                </span>
              ) : (
                <span
                  className={`size-[26px] rounded-full ${cur ? "shadow-[inset_0_0_0_2.5px_#0cc1e0]" : "shadow-[inset_0_0_0_2.5px_#bde9fb]"}`}
                  aria-hidden="true"
                />
              )}
              <span className="font-heading text-base font-semibold">{t.title}</span>
              <span className="ml-auto font-heading text-xs font-semibold text-nga-secondary-shadow">{cur ? "Start here" : ""}</span>
            </li>
          );
        })}
      </ol>
      <div className="mx-5 mt-2.5">
        <button type="button" onClick={props.onStart} className={`${BTN_ORANGE} w-full`}>
          Start
        </button>
      </div>
      <p className="mx-5 my-4 text-center text-[12.5px] text-[#8a9bb0]">Task content TBC. Each milestone has 2 to 4 tasks.</p>
    </section>
  );
}
