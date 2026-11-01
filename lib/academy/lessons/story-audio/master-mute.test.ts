import { afterEach, describe, expect, it, vi } from "vitest";

import { MASTER_MUTED_KEY, readMasterMuted, writeMasterMuted } from "@/lib/academy/lessons/story-audio/master-mute";

const LEGACY_KEY = "nga_story_audio_muted";

function installStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("master mute preference", () => {
  it("starts unmuted when nothing is stored", () => {
    installStorage();
    expect(readMasterMuted()).toBe(false);
  });

  it("keeps a learner who had muted the voiceover muted, and drops the old key", () => {
    const store = installStorage({ [LEGACY_KEY]: "1" });
    expect(readMasterMuted()).toBe(true);
    expect(store.get(MASTER_MUTED_KEY)).toBe("1");
    expect(store.has(LEGACY_KEY)).toBe(false);
  });

  it("remembers the master switch across reads", () => {
    const store = installStorage();
    writeMasterMuted(true);
    expect(readMasterMuted()).toBe(true);
    expect(store.get(MASTER_MUTED_KEY)).toBe("1");
    expect(store.has(LEGACY_KEY)).toBe(false);
    writeMasterMuted(false);
    expect(readMasterMuted()).toBe(false);
  });
});
