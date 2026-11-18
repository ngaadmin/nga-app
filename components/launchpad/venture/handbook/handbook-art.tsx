import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

/*
 * Handbook art: the book button icon (handbook-icon-r1.svg). The page art
 * (paper card, dividers, labels, chips, doodle) lives in handbook-page.tsx,
 * per handbook-vision-products-r4.
 */

/** Book button icon (handbook-icon-r1.svg). */
export function HandbookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={VT.ink}>
      <path d="M12 6.2C10.2 4.9 7.6 4.3 4.6 4.4c-.6 0-1.1.5-1.1 1.1v11.6c0 .6.5 1.1 1.1 1.1 2.9-.1 5.3.5 7.4 1.9V6.2z" />
      <path
        d="M12 6.2c1.8-1.3 4.4-1.9 7.4-1.8.6 0 1.1.5 1.1 1.1v11.6c0 .6-.5 1.1-1.1 1.1-2.9-.1-5.3.5-7.4 1.9V6.2z"
        opacity=".6"
      />
      <path d="M15.2 4.6h2.4v5.6l-1.2-.9-1.2.9z" fill={VT.secondary} />
    </svg>
  );
}
