import type { LaunchpadPlaceholderBlockKind, LaunchpadPlaceholderScreen } from "@/lib/launchpad/content/types";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";

/** Block heights from the r3 workbook design. */
const BLOCK_HEIGHT: Record<LaunchpadPlaceholderBlockKind, number> = {
  text: 90,
  illustration: 130,
  interactive: 130,
};

/** Task screen "placeholder": labelled grey blocks while workbook content is TBC. */
export function PlaceholderScreen({ screen }: { screen: LaunchpadPlaceholderScreen }) {
  return (
    <div data-task-screen="placeholder">
      {screen.heading && <h3 className={`mx-5 mb-2 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#19347D]`}>{screen.heading}</h3>}
      {screen.blocks.map((b, i) => (
        <div
          key={`${b.kind}-${i}`}
          className="mx-5 mb-3 flex items-center justify-center rounded-2xl bg-nga-mist font-heading text-[16px] font-semibold text-nga-slate"
          style={{ height: BLOCK_HEIGHT[b.kind] }}
        >
          {b.label}
        </div>
      ))}
    </div>
  );
}
