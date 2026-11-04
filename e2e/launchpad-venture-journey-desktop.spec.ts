import { test } from "@playwright/test";
import { DESKTOP } from "./launchpad-venture-helpers";
import { runJourney } from "./launchpad-venture-journey";

test.use({ viewport: DESKTOP });

test("Launchpad venture: full Level 1 and Level 2 journey on desktop", async ({ page }, info) => {
  test.setTimeout(300_000);
  await runJourney(page, info, "d");
});
