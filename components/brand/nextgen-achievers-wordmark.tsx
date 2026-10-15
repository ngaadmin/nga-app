import Image from "next/image";

/**
 * Approved NextGenAchiever$ trademark wordmark (`public/nga-logo-tm.svg`).
 * Width and height match that file's viewBox scaled by 100 so the ratio stays exact.
 * Height stays 40px; width follows the artwork. Do not recolour, crop, or restretch it.
 */
const WORDMARK_WIDTH = 51754;
const WORDMARK_HEIGHT = 14718;

export function NextGenAchieversWordmark() {
  return (
    <Image
      src="/nga-logo-tm.svg"
      alt="NextGenAchievers Logo"
      width={WORDMARK_WIDTH}
      height={WORDMARK_HEIGHT}
      style={{ height: "2.5rem", width: "auto" }}
      priority
      unoptimized
    />
  );
}
