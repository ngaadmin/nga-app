import { test } from "@playwright/test";
import { runJourney } from "./launchpad-venture-journey";

// AC2: every Level 1 screen fits (no vertical scroll, Next/Finish in view) on
// a small phone too. The journey's fits() checks run at 375x667 here; the
// mobile journey spec covers 390x844.
test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

test("Launchpad venture: Level 1 screens fit at 375x667 (AC2)", async ({ page }, info) => {
  test.setTimeout(480_000);
  await runJourney(page, info, "s");
});
