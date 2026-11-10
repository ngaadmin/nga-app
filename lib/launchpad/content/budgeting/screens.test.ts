import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { budgetingDoor } from "@/lib/launchpad/content/budgeting/screens";

const CLIPS = [
  { id: "s1", src: "/launchpad/budgeting/l6-s1-vo.mp3", durationMs: 15073, bytes: 361743 },
  { id: "s2", src: "/launchpad/budgeting/l6-s2-vo.mp3", durationMs: 20820, bytes: 499670 },
  { id: "s3", src: "/launchpad/budgeting/l6-s3-vo.mp3", durationMs: 24346, bytes: 584306 },
] as const;

describe("Budgeting voice-overs", () => {
  it("each page resolves its narration file", () => {
    const screen = budgetingDoor().tasks[0]!.screens[0]!;
    if (screen.type !== "picture") throw new Error("expected a picture screen");
    expect(screen.pages.map((page) => page.id)).toEqual(["s1", "s2", "s3"]);
    for (const clip of CLIPS) {
      const page = screen.pages.find((item) => item.id === clip.id);
      expect(page?.audio).toEqual({ src: clip.src, durationMs: clip.durationMs });
      const file = path.join(process.cwd(), "public", clip.src.slice(1));
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBe(clip.bytes);
    }
    expect(screen.pages[0]?.credit).toBe("Voice created with Grok");
    expect(screen.pages[1]?.credit).toBeUndefined();
    expect(screen.pages[2]?.credit).toBeUndefined();
  });
});
