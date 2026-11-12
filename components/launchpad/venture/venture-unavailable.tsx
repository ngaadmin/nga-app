import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { BackCrumb, Heading, SubLine } from "@/components/launchpad/venture-test/venture-test-ui";

/** White error screen when a venture's content can't be loaded (no current and no last good copy). */
export function VentureUnavailable({ onBack }: { onBack: () => void }) {
  const s = useSurfaceCopy();
  return (
    <section className="flex flex-1 flex-col bg-white" data-launchpad-error="1">
      <BackCrumb label={s.chrome.launchpad} onClick={onBack} />
      <Heading>{s.chrome.unavailableTitle}</Heading>
      <SubLine>{s.chrome.unavailableBody}</SubLine>
    </section>
  );
}
