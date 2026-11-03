import { BTN_CYAN, BTN_WHITE, Heading, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";

function Block({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="mx-5 mb-3 flex items-center justify-center rounded-2xl bg-nga-mist font-heading text-[13px] font-semibold text-nga-slate"
      style={{ height }}
    >
      {label}
    </div>
  );
}

/**
 * Workbook page. Previous and Next move freely between tasks; the learner
 * stays here until every task in the bronze is done.
 */
export function VentureWorkbook(props: {
  level: number;
  tasks: readonly { id: string; title: string; done: boolean }[];
  index: number;
  onBuilding: () => void;
  onCorridor: () => void;
  onExit: () => void;
  onJump: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { tasks, index } = props;
  const task = tasks[index];
  if (!task) return null;
  const isLast = index === tasks.length - 1;
  return (
    <section className="flex flex-1 flex-col">
      <TrailCrumb level={props.level} current={task.title} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <div className="mx-5 mt-2.5 flex justify-between font-heading text-[13px] font-semibold">
        <button type="button" onClick={props.onExit} className="text-nga-slate">
          ✕ Exit
        </button>
        <span className="text-nga-secondary-shadow">
          Task {index + 1} of {tasks.length}
        </span>
      </div>
      <div className="mb-0.5 mt-2.5 flex items-center justify-center gap-2.5" role="group" aria-label="Tasks">
        {tasks.map((t, i) => {
          const cur = i === index;
          const tone = cur ? "bg-nga-secondary text-white" : t.done ? "bg-nga-panel text-nga-ink" : "bg-nga-mist text-nga-slate";
          return (
            <span key={t.id} className="contents">
              {i > 0 && <span className="h-[3px] w-[26px] bg-nga-mist" aria-hidden="true" />}
              <button
                type="button"
                onClick={() => props.onJump(i)}
                aria-current={cur ? "step" : undefined}
                aria-label={`Task ${i + 1}${t.done ? ", done" : ""}`}
                className={`inline-flex size-[30px] items-center justify-center rounded-full font-heading text-[13px] font-bold ${tone}`}
              >
                {i + 1}
              </button>
            </span>
          );
        })}
      </div>
      <Heading className="mb-2.5 mt-1.5">{task.title}</Heading>
      {/* Workbook content is TBC: labelled placeholders only. */}
      <Block height={90} label="Text block (placeholder)" />
      <Block height={130} label="Illustration (placeholder)" />
      <Block height={130} label="Interactive element (placeholder)" />
      <div className="mx-5 flex gap-3 pb-4">
        <button type="button" onClick={props.onPrevious} disabled={index === 0} className={`${BTN_WHITE} flex-1`}>
          ‹ Previous
        </button>
        <button type="button" onClick={props.onNext} className={`${BTN_CYAN} flex-1`}>
          {isLast ? "Finish ›" : "Next ›"}
        </button>
      </div>
    </section>
  );
}
