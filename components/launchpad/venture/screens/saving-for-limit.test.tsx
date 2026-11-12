// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LaunchpadTextField } from "@/lib/launchpad/content/types";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { DOG_WALKING_LOAD_PATH } from "@/lib/launchpad/load/paths";

afterEach(cleanup);

/** The Make money goal's "I'm saving for" field, as committed in the dog walking load. */
function savingForField(): LaunchpadTextField {
  const raw = readFileSync(path.resolve(process.cwd(), DOG_WALKING_LOAD_PATH), "utf8");
  let found: LaunchpadTextField | undefined;
  JSON.parse(raw, (key, value) => {
    if (value && typeof value === "object" && value.name === "savingFor" && value.input === "text") found = value;
    return value;
  });
  if (!found) throw new Error("savingFor field not found in the load");
  return found;
}

describe("Make money goal: I'm saving for (V6)", () => {
  it("is capped at 60 characters in the committed load", () => {
    expect(savingForField().maxLength).toBe(60);
  });

  it("the box has maxlength 60 and cuts a longer paste to 60", () => {
    let value: string | number = "";
    const field = savingForField();
    const { rerender } = render(<FieldControl field={field} value={value} onChange={(v) => (value = v)} idPrefix="t" />);
    const box = screen.getByLabelText("Saving for");
    expect(box.getAttribute("maxlength")).toBe("60");
    fireEvent.change(box, { target: { value: "x".repeat(75) } });
    expect(String(value)).toHaveLength(60);
    rerender(<FieldControl field={field} value={value} onChange={(v) => (value = v)} idPrefix="t" />);
    expect((box as HTMLInputElement).value).toHaveLength(60);
  });
});
