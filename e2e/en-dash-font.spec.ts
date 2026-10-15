import { expect, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";

const TEACHER_SESSION = {
  accessMode: "registered",
  username: "teachertest",
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  accountStatus: "ACTIVE",
  accountRole: "teacher",
  isTeacher: true,
  consentApprovedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  supabaseUserId: "33333333-3333-3333-3333-333333333333",
  learnerEmail: "teachertest@example.com",
};

test.use({ viewport: { width: 390, height: 844 } });

test("en dash renders in the class track font", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [SESSION_KEY, TEACHER_SESSION] as const,
  );
  await page.goto("/dashboard/class/preview");
  const track = page.getByText(/ages/);
  await expect(track).toBeVisible({ timeout: 15_000 });

  const shape = await track.evaluate((node) => {
    const style = getComputedStyle(node);
    const font = `${style.fontWeight} 64px ${style.fontFamily}`;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText("\u2013", 8, 48);
    const data = ctx.getImageData(0, 0, 320, 96).data;
    let minX = 320;
    let maxX = 0;
    let minY = 96;
    let maxY = 0;
    for (let y = 0; y < 96; y += 1) {
      for (let x = 0; x < 320; x += 1) {
        const i = (y * 320 + x) * 4;
        if ((data[i] ?? 255) < 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const failed = [...document.fonts].filter((face) => face.status === "error");
    return {
      fontFamily: style.fontFamily,
      ink: { minX, minY, maxX, maxY },
      failed: failed.map((face) => face.family),
    };
  });

  expect(shape).toBeTruthy();
  expect(shape!.fontFamily).toContain("NgaInter");
  expect(shape!.failed).toEqual([]);
  const inkWidth = shape!.ink.maxX - shape!.ink.minX;
  const inkHeight = shape!.ink.maxY - shape!.ink.minY;
  expect(inkWidth).toBeGreaterThan(20);
  expect(inkHeight).toBeGreaterThan(1);
  expect(inkHeight).toBeLessThan(inkWidth / 2);

  const line = page.getByText(/ages/);
  await line.evaluate((node) => {
    node.textContent = "Explorer \u00b7 ages 10\u201312";
  });
  await expect(line).toHaveText("Explorer · ages 10–12");
  await line.screenshot({
    path: "/opt/cursor/artifacts/class-track-en-dash.png",
  });
});
