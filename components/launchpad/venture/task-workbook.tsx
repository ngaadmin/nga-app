import type { LaunchpadLogoPickerScreen, LaunchpadNamePickerScreen, LaunchpadTaskScreen } from "@/lib/launchpad/content/types";
import { TaskScreen } from "@/components/launchpad/venture/task-screen-renderer";
import { identityTaskKind, LogoBuilder, NameForm } from "@/components/launchpad/venture/identity/picker-screens";
import { BTN_CYAN, BTN_WHITE, Heading, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
import { COME_BACK_LATER_COPY } from "@/lib/launchpad/venture-test/come-back-later";

/**
 * Workbook page. Previous and Next move freely between tasks; the learner
 * stays here until every task in the bronze is done. The task body is its
 * typed screens from the content payload, drawn by the task screen registry.
 */
export function TaskWorkbook(props: {
  level: number;
  tasks: readonly { id: string; title: string; done: boolean; screens: readonly LaunchpadTaskScreen[]; ctaLabel?: string }[];
  /** Small uppercase line over the title, e.g. the silver "Build your identity". */
  eyebrow?: string;
  index: number;
  onBuilding: () => void;
  onCorridor: () => void;
  onExit: () => void;
  onJump: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  /** Picker steps keep Next off until a choice is made; `nextHint` says what is missing. */
  nextDisabled?: boolean;
  nextHint?: string;
  /**
   * Paged task: only this page's screen shows, Previous and Next move a page
   * at a time (Previous on the first page goes to the task before).
   */
  page?: { index: number; count: number; screen: LaunchpadTaskScreen };
  /** Set on tasks that allow it: saves the partial answer as a draft, leaves the task open and moves on. */
  onComeBackLater?: () => void;
}) {
  const { tasks, index } = props;
  const task = tasks[index];
  if (!task) return null;
  const isLast = index === tasks.length - 1;
  const single = tasks.length === 1;
  const page = props.page;
  const kind = page ? null : identityTaskKind(task.screens);
  const lastPage = !page || page.index === page.count - 1;
  const forward = lastPage ? (task.ctaLabel ?? (isLast ? "Finish ›" : "Next ›")) : "Next ›";
  const showPrevious = !single || (page && page.index > 0);
  const previousDisabled = index === 0 && (!page || page.index === 0);
  return (
    <section className="flex flex-1 flex-col">
      <TrailCrumb level={props.level} current={task.title} onBuilding={props.onBuilding} onCorridor={props.onCorridor} />
      <div className="mx-5 mt-2.5 flex justify-between font-heading text-[13px] font-semibold">
        <button type="button" onClick={props.onExit} className="text-nga-slate">
          ✕ Exit
        </button>
        {!single && (
          <span className="text-nga-secondary-shadow">
            Task {index + 1} of {tasks.length}
          </span>
        )}
        {single && page && page.count > 1 && (
          <span className="text-nga-secondary-shadow" data-page-count="">
            Step {page.index + 1} of {page.count}
          </span>
        )}
      </div>
      {!single && (
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
      )}
      {props.eyebrow && (
        <p className="mx-6 mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]" data-eyebrow="">
          {props.eyebrow}
        </p>
      )}
      <Heading className={kind ? "!mx-6 mb-1.5 !mt-1" : "mb-2.5 mt-1.5"}>{task.title}</Heading>
      {kind === "logo" && <LogoBuilder key={task.id} screens={task.screens as readonly LaunchpadLogoPickerScreen[]} />}
      {kind === "name" && <NameForm key={task.id} screens={task.screens as readonly LaunchpadNamePickerScreen[]} />}
      {page && <TaskScreen key={page.screen.id} screen={page.screen} />}
      {!kind &&
        !page &&
        task.screens.map((screen) => (
          <TaskScreen key={screen.id} screen={screen} />
        ))}
      {props.nextDisabled && props.nextHint && (
        <p id="workbook-next-hint" className="mx-5 mb-2 text-center text-[13px] text-nga-slate">
          {props.nextHint}
        </p>
      )}
      <div className="mx-5 mt-auto flex gap-3 pb-4">
        {showPrevious && (
          <button type="button" onClick={props.onPrevious} disabled={previousDisabled} className={`${BTN_WHITE} flex-1`}>
            ‹ Previous
          </button>
        )}
        <button
          type="button"
          onClick={props.onNext}
          disabled={props.nextDisabled}
          aria-describedby={props.nextDisabled && props.nextHint ? "workbook-next-hint" : undefined}
          className={`${BTN_CYAN} flex-1 disabled:opacity-50`}
        >
          {forward}
        </button>
      </div>
      {props.onComeBackLater && (
        <div className="mx-5 -mt-1 pb-4 text-center">
          <button
            type="button"
            onClick={props.onComeBackLater}
            className="min-h-11 px-3 font-heading text-[15px] font-semibold text-nga-slate underline underline-offset-4"
            data-come-back-later=""
          >
            {COME_BACK_LATER_COPY.button}
          </button>
        </div>
      )}
    </section>
  );
}
