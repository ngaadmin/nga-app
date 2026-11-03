import { BackCrumb, Heading, SubLine } from "@/components/launchpad/venture-test/venture-test-ui";

/** White error screen when a venture's content can't be loaded (no current and no last good copy). */
export function VentureUnavailable({ onBack }: { onBack: () => void }) {
  return (
    <section className="flex flex-1 flex-col bg-white" data-launchpad-error="1">
      <BackCrumb label="Launchpad" onClick={onBack} />
      <Heading>This business kit isn&apos;t available right now</Heading>
      <SubLine>Please try again in a few minutes.</SubLine>
    </section>
  );
}
