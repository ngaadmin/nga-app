import type { LaunchpadSummaryDisplay } from "@/lib/launchpad/content/types";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";

/** A summary section's lines: bullets for lists and sentences, numbers for a ranking, plain text otherwise. */
export function SummaryLines({ display, lines, className = "" }: { display: LaunchpadSummaryDisplay; lines: readonly string[]; className?: string }) {
  if (display === "ranked") {
    return (
      <ol className={`flex flex-col gap-1 ${className}`}>
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-5 flex-none font-bold text-nga-secondary-shadow">{i + 1}.</span>
            <ChosenValue>{l}</ChosenValue>
          </li>
        ))}
      </ol>
    );
  }
  if (display === "list" || display === "sentences") {
    return (
      <ul className={`flex flex-col gap-1 ${className}`}>
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[9px] size-1.5 flex-none rounded-full bg-nga-secondary" aria-hidden="true" />
            <ChosenValue>{l}</ChosenValue>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={className}>
      {lines.map((l, i) => (
        <p key={i}>
          <ChosenValue>{l}</ChosenValue>
        </p>
      ))}
    </div>
  );
}
