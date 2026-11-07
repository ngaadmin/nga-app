import type { LaunchpadChecklistScreen } from "@/lib/launchpad/content/types";

/** Task screen "checklist": an optional intro, then a list of items to work through. */
export function ChecklistScreen({ screen }: { screen: LaunchpadChecklistScreen }) {
  return (
    <div data-task-screen="checklist" className="mx-5 mb-4">
      {screen.heading && <h3 className="mb-2 font-heading text-base font-bold text-nga-ink">{screen.heading}</h3>}
      {screen.intro && <p className="mb-2 text-base text-nga-slate">{screen.intro}</p>}
      <ul className="space-y-2">
        {screen.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl bg-nga-mist px-3 py-2.5 text-[15px] text-nga-ink">
            <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-sm border-2 border-nga-secondary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
