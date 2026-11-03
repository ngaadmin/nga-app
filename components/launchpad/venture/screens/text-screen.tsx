import type { LaunchpadTextScreen } from "@/lib/launchpad/content/types";

/** Task screen "text": an optional heading, body copy and a small note. */
export function TextScreen({ screen }: { screen: LaunchpadTextScreen }) {
  return (
    <div data-task-screen="text" className="mx-5 mb-4">
      {screen.heading && <h3 className="mb-2 font-heading text-base font-bold text-nga-ink">{screen.heading}</h3>}
      <p className="whitespace-pre-line text-base leading-relaxed text-nga-slate">{screen.body}</p>
      {screen.note && <p className="mt-2 text-xs text-[#8a9bb0]">{screen.note}</p>}
    </div>
  );
}
