import type { LaunchpadContextScreen } from "@/lib/launchpad/content/types";

/**
 * Context/guidance page: the "why it matters" line, then the how-to line on
 * a light panel with a cyan accent edge. White screen, colour on the accent only.
 */
export function ContextScreen({ screen }: { screen: LaunchpadContextScreen }) {
  return (
    <div className="mx-5 mt-2 flex flex-col gap-4" data-screen-type="context">
      <p className="text-[17px] leading-[1.5] text-nga-ink">{screen.context}</p>
      {screen.guidance && (
        <p className="rounded-r-2xl border-l-4 border-nga-secondary bg-[#F7FAFD] px-4 py-3 text-[18px] leading-[1.5] text-nga-ink" data-guidance="">
          {screen.guidance}
        </p>
      )}
    </div>
  );
}
