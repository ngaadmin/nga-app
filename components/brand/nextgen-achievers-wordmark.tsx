import Image from "next/image";

/**
 * Approved NextGenAchiever$ trademark wordmark (`public/nga-logo-tm.svg`).
 * Width and height match that file's viewBox scaled by 100 so the ratio stays exact.
 * Default height is 40px. The header lockup is 56px, and 64px from the md breakpoint up.
 * Width follows the artwork. Do not recolour, crop, or restretch it.
 */
const WORDMARK_WIDTH = 51754;
const WORDMARK_HEIGHT = 14718;

type NextGenAchieversWordmarkProps = {
  /** Header bar only. Other placements stay 40px tall. */
  header?: boolean;
};

export function NextGenAchieversWordmark({
  header = false,
}: NextGenAchieversWordmarkProps) {
  return (
    <Image
      src="/nga-logo-tm.svg"
      alt="NextGenAchievers Logo"
      width={WORDMARK_WIDTH}
      height={WORDMARK_HEIGHT}
      className={header ? "h-[56px] w-auto md:h-[64px]" : undefined}
      style={
        header ? { width: "auto" } : { height: "2.5rem", width: "auto" }
      }
      priority
      unoptimized
    />
  );
}
