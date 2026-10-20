import { describe, expect, it } from "vitest";
import { hashCredential } from "@/lib/auth/credential-hash";
import {
  assessParentPin,
  PARENT_PIN_GATE_COPY,
} from "@/lib/dashboard/parent-pin-gate";

describe("assessParentPin", () => {
  const hash = hashCredential("2468");

  it("accepts the PIN that matches the stored hash", () => {
    expect(assessParentPin("2468", hash)).toEqual({ ok: true });
  });

  it("rejects a missing hash instead of treating deletion as open", () => {
    expect(assessParentPin("2468", null)).toEqual({
      ok: false,
      error: PARENT_PIN_GATE_COPY.missing,
    });
    expect(assessParentPin("2468", "  ")).toEqual({
      ok: false,
      error: PARENT_PIN_GATE_COPY.missing,
    });
  });

  it("rejects a wrong or incomplete PIN", () => {
    expect(assessParentPin("0000", hash)).toEqual({
      ok: false,
      error: PARENT_PIN_GATE_COPY.wrong,
    });
    expect(assessParentPin("246", hash)).toEqual({
      ok: false,
      error: PARENT_PIN_GATE_COPY.required,
    });
    expect(assessParentPin(undefined, hash)).toEqual({
      ok: false,
      error: PARENT_PIN_GATE_COPY.required,
    });
  });
});
