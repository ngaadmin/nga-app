import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const accountKey = vi.hoisted(() => ({ value: "guest:one" as string | null }));

vi.mock("@/lib/onboarding/account-local-key", () => ({
  currentAccountLocalKey: () => accountKey.value,
}));
vi.mock("@/lib/dashboard/account-progress-dirty", () => ({
  markAccountProgressDirty: () => {},
}));

import {
  GUEST_MEDALS_TIP_DISMISSED_KEY,
  hasAccountSeenMedalsIntro,
  markAccountMedalsIntroSeen,
  PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
} from "@/lib/dashboard/page-intro-seen";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("guest Achievements tip", () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    (globalThis as { window?: unknown }).window = { localStorage: memoryStorage() };
    accountKey.value = "guest:one";
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = originalWindow;
  });

  it("stays dismissed for the next guest visit, even if the intro store is wiped", () => {
    expect(hasAccountSeenMedalsIntro()).toBe(false);
    markAccountMedalsIntroSeen();
    const storage = (globalThis as unknown as { window: { localStorage: Storage } })
      .window.localStorage;
    expect(storage.getItem(GUEST_MEDALS_TIP_DISMISSED_KEY)).toBe("1");

    storage.removeItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY);
    accountKey.value = "guest:two";
    expect(hasAccountSeenMedalsIntro()).toBe(true);
  });

  it("does not hide the tip for a signed-in account", () => {
    markAccountMedalsIntroSeen();
    accountKey.value = "user:abc";
    expect(hasAccountSeenMedalsIntro()).toBe(false);
  });
});
