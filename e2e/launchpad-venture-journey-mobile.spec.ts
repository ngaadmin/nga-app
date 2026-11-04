import { test } from "@playwright/test";
import { MOBILE } from "./launchpad-venture-helpers";
import { runJourney } from "./launchpad-venture-journey";

test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

test("Launchpad venture: full Level 1 and Level 2 journey at 390x844", async ({ page }, info) => {
  test.setTimeout(480_000);
  await runJourney(page, info, "m");
});
