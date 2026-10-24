import { describe, expect, it } from "vitest";
import { suppliedRemoteProgress } from "@/lib/dashboard/supplied-remote-progress";

describe("suppliedRemoteProgress", () => {
  it("fetches when the caller did not pass a progress payload", () => {
    expect(suppliedRemoteProgress(undefined)).toEqual({ supplied: false, payload: null });
    expect(suppliedRemoteProgress({})).toEqual({ supplied: false, payload: null });
  });

  it("keeps a null payload so sign-in does not look the row up twice", () => {
    expect(suppliedRemoteProgress({ remotePayload: null })).toEqual({
      supplied: true,
      payload: null,
    });
  });
});
