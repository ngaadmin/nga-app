import type { ScriptedSheet } from "@/lib/launchpad/content/scripted-sheet";

/** Level 6 workbook page. Jar rows and the earned field are drawn by the shared scripted sheet. */
export function budgetSplitSheet(): ScriptedSheet {
  return {
    id: "budget-split",
    largeScribble: "jar",
    blocks: [{ kind: "budget", heading: "My budget split", earnedLabel: "Money I earned" }],
  };
}
