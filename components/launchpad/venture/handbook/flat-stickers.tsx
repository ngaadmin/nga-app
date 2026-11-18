import { STICKER_SVG } from "@/components/launchpad/venture/handbook/sticker-svg";

/** A Getting Ready mark. Doodles are 18px. Stickers are 96px wide. */
export function FlatSticker({ kind, doodle = false }: { kind: keyof typeof STICKER_SVG | string; doodle?: boolean }) {
  const svg = STICKER_SVG[kind];
  if (!svg) return null;
  const width = doodle ? 18 : 96;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 [&>svg]:h-auto [&>svg]:w-full"
      style={{ width }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
