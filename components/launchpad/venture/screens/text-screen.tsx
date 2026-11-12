import type { LaunchpadTextScreen } from "@/lib/launchpad/content/types";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";

/** Task screen "text": an optional heading, body copy and a small note. */
export function TextScreen({ screen }: { screen: LaunchpadTextScreen }) {
  return (
    <div data-task-screen="text" className="mx-5 mb-4">
      {screen.heading && <h3 className={`mb-2 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#19347D]`}>{screen.heading}</h3>}
      <p className="whitespace-pre-line font-sans text-[18px] leading-[26px] text-nga-slate">{screen.body}</p>
      {screen.note && <p className="mt-2 text-[16px] text-[#8a9bb0]">{screen.note}</p>}
    </div>
  );
}
