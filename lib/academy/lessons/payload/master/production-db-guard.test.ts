import { isValidElement, type ReactElement, type ReactNode } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  loadBundledLessonPayload,
  loadExplorerM1Payload,
  loadMasterLessonTrio,
  assertLessonPayloadAssets,
} = vi.hoisted(() => ({
  loadBundledLessonPayload: vi.fn(),
  loadExplorerM1Payload: vi.fn(),
  loadMasterLessonTrio: vi.fn(),
  assertLessonPayloadAssets: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: vi.fn(async () => {}),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    notFound: () => {
      throw new Error("notFound");
    },
  };
});

vi.mock("@/lib/academy/lessons/payload/load-lesson-payload", () => ({
  loadBundledLessonPayload,
}));

vi.mock("@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload", () => ({
  loadExplorerM1Payload,
}));

vi.mock("@/lib/academy/lessons/payload/master/fetch-published", () => ({
  loadMasterLessonTrio,
  academyLessonLog: vi.fn(),
}));

vi.mock("@/lib/academy/lessons/payload/validate-lesson-assets", () => ({
  assertLessonPayloadAssets,
}));

vi.mock("@/components/academy/lesson/academy-lesson-player", () => ({
  AcademyLessonPlayer: () => null,
}));

import AcademyLessonPage from "@/app/dashboard/academy/lesson/[milestoneId]/page";
import { LessonUnavailable } from "@/components/academy/lesson/lesson-unavailable";
import {
  academyLessonMustUseDatabase,
  academyMasterPayloadEnabled,
  academyProductionRequiresDatabase,
  lessonOneMapIntroSrc,
} from "@/lib/academy/lessons/payload/master/master-flag";

const ENV_KEYS = [
  "VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_ENV",
  "ACADEMY_MASTER_PAYLOAD",
  "NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_ACADEMY_MEDIA_BASE",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const bundledPayload = { lessonTitle: "bundled", screens: [{ screenLabel: "1" }] };
const explorerPayload = { lessonTitle: "explorer", screens: [{ screenLabel: "1" }] };

const currentLoad = {
  ok: true as const,
  trio: {
    explorer: { lessonTitle: "db-explorer" },
    pathfinder: { lessonTitle: "db-pathfinder" },
    maverick: { lessonTitle: "db-maverick" },
  },
  versionId: "version-1",
  contentHash: "hash",
  mediaBase: "https://example.test/storage/v1/object/public/academy-media",
  source: "current" as const,
};

function asElement(node: ReactNode): ReactElement {
  if (!isValidElement(node)) throw new Error("expected an element");
  return node;
}

function propsOf(node: ReactNode): Record<string, unknown> {
  return asElement(node).props as Record<string, unknown>;
}

async function withEnv(
  values: Partial<Record<EnvKey, string | undefined>>,
  run: () => Promise<void> | void,
): Promise<void> {
  const previous = new Map<EnvKey, string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    const value = key in values ? values[key] : undefined;
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function openModuleOne() {
  return AcademyLessonPage({
    params: Promise.resolve({ milestoneId: "1" }),
    searchParams: Promise.resolve({}),
  });
}

beforeEach(() => {
  loadBundledLessonPayload.mockReset();
  loadExplorerM1Payload.mockReset();
  loadMasterLessonTrio.mockReset();
  assertLessonPayloadAssets.mockReset();
  loadBundledLessonPayload.mockImplementation(() => {
    throw new Error("loadBundledLessonPayload must not run");
  });
  loadExplorerM1Payload.mockImplementation(() => {
    throw new Error("loadExplorerM1Payload must not run");
  });
  loadMasterLessonTrio.mockResolvedValue(currentLoad);
});

describe("academyLessonMustUseDatabase", () => {
  it("requires the database in production when the flag is unset", () => {
    const env = { VERCEL_ENV: "production" };
    expect(academyMasterPayloadEnabled(env)).toBe(false);
    expect(academyProductionRequiresDatabase(env)).toBe(true);
    expect(academyLessonMustUseDatabase(1, env)).toBe(true);
  });

  it("requires the database in production when the flag is 0 or false", () => {
    expect(
      academyLessonMustUseDatabase(1, {
        VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "0",
      }),
    ).toBe(true);
    expect(
      academyLessonMustUseDatabase(1, {
        NEXT_PUBLIC_VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "false",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "false",
      }),
    ).toBe(true);
    expect(academyMasterPayloadEnabled({ VERCEL_ENV: "production", ACADEMY_MASTER_PAYLOAD: "0" })).toBe(
      false,
    );
  });

  it("treats either Vercel env as production", () => {
    expect(academyProductionRequiresDatabase({ NEXT_PUBLIC_VERCEL_ENV: "production" })).toBe(true);
    expect(
      academyProductionRequiresDatabase({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_VERCEL_ENV: "production",
      }),
    ).toBe(true);
    expect(
      academyProductionRequiresDatabase({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_VERCEL_ENV: "development",
      }),
    ).toBe(true);
  });

  it("keeps the bundled path outside production when the flag is off", () => {
    expect(academyLessonMustUseDatabase(1, {})).toBe(false);
    expect(
      academyLessonMustUseDatabase(1, { VERCEL_ENV: "development", ACADEMY_MASTER_PAYLOAD: "0" }),
    ).toBe(false);
    expect(academyLessonMustUseDatabase(1, { ACADEMY_MASTER_PAYLOAD: "1" })).toBe(true);
    expect(academyLessonMustUseDatabase(1, { VERCEL_ENV: "preview" })).toBe(true);
    expect(
      academyLessonMustUseDatabase(1, { VERCEL_ENV: "preview", ACADEMY_MASTER_PAYLOAD: "0" }),
    ).toBe(false);
  });

  it("does not pull a module that is not database-led onto the database path", () => {
    expect(
      academyLessonMustUseDatabase(2, { VERCEL_ENV: "production", ACADEMY_MASTER_PAYLOAD: "1" }),
    ).toBe(false);
  });
});

describe("lesson page production guard", () => {
  it("production env and an unset flag does not load bundled Module 1", async () => {
    await withEnv({ VERCEL_ENV: "production" }, async () => {
      const page = asElement(await openModuleOne());
      expect(propsOf(page)["data-lesson-source"]).toBe("current");
      expect(propsOf(page)["data-lesson-version"]).toBe("version-1");
      const player = asElement(propsOf(page).children as ReactNode);
      expect(propsOf(player).payload).toEqual(currentLoad.trio.pathfinder);
      expect(propsOf(player).explorerPayload).toEqual(currentLoad.trio.explorer);
      expect(propsOf(player).mediaBase).toBe(currentLoad.mediaBase);
      expect(loadMasterLessonTrio).toHaveBeenCalledWith(1, 1, { draft: undefined });
      expect(loadBundledLessonPayload).not.toHaveBeenCalled();
      expect(loadExplorerM1Payload).not.toHaveBeenCalled();
    });
  });

  it("production env and flag 0 does not load bundled Module 1", async () => {
    await withEnv(
      {
        VERCEL_ENV: "production",
        NEXT_PUBLIC_VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "0",
      },
      async () => {
        const page = asElement(await openModuleOne());
        expect(propsOf(page)["data-lesson-source"]).toBe("current");
        expect(loadBundledLessonPayload).not.toHaveBeenCalled();
        expect(loadExplorerM1Payload).not.toHaveBeenCalled();
      },
    );
  });

  it("production env seen only on NEXT_PUBLIC_VERCEL_ENV still skips bundled content", async () => {
    await withEnv(
      {
        NEXT_PUBLIC_VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "0",
      },
      async () => {
        const page = asElement(await openModuleOne());
        expect(propsOf(page)["data-lesson-source"]).toBe("current");
        expect(loadBundledLessonPayload).not.toHaveBeenCalled();
        expect(loadExplorerM1Payload).not.toHaveBeenCalled();
      },
    );
  });

  it("production env and a failed database read shows LessonUnavailable, never bundled content", async () => {
    loadMasterLessonTrio.mockResolvedValue({ ok: false, reason: "No current version for module 1." });
    await withEnv(
      {
        VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "0",
      },
      async () => {
        const page = asElement(await openModuleOne());
        expect(page.type).toBe(LessonUnavailable);
        expect(propsOf(page).milestoneId).toBe(1);
        expect(loadBundledLessonPayload).not.toHaveBeenCalled();
        expect(loadExplorerM1Payload).not.toHaveBeenCalled();
      },
    );
  });

  it("production env and a rejected database lesson shows LessonUnavailable, never bundled content", async () => {
    assertLessonPayloadAssets.mockImplementation(() => {
      throw new Error("bad shape");
    });
    await withEnv({ VERCEL_ENV: "production", ACADEMY_MASTER_PAYLOAD: "0" }, async () => {
      const page = asElement(await openModuleOne());
      expect(page.type).toBe(LessonUnavailable);
      expect(loadBundledLessonPayload).not.toHaveBeenCalled();
      expect(loadExplorerM1Payload).not.toHaveBeenCalled();
    });
  });

  it("local and dev with the flag off still load the bundled authoring files", async () => {
    loadBundledLessonPayload.mockReturnValue(bundledPayload);
    loadExplorerM1Payload.mockReturnValue(explorerPayload);
    await withEnv({}, async () => {
      const page = asElement(await openModuleOne());
      expect(propsOf(page)["data-lesson-source"]).toBeUndefined();
      const player = asElement(propsOf(page).children as ReactNode);
      expect(propsOf(player).payload).toBe(bundledPayload);
      expect(propsOf(player).explorerPayload).toBe(explorerPayload);
      expect(loadBundledLessonPayload).toHaveBeenCalledWith(1, 1);
      expect(loadExplorerM1Payload).toHaveBeenCalledWith(1);
      expect(loadMasterLessonTrio).not.toHaveBeenCalled();
    });
    loadBundledLessonPayload.mockReturnValue(bundledPayload);
    loadExplorerM1Payload.mockReturnValue(explorerPayload);
    await withEnv({ VERCEL_ENV: "development", ACADEMY_MASTER_PAYLOAD: "0" }, async () => {
      await openModuleOne();
      expect(loadBundledLessonPayload).toHaveBeenCalledWith(1, 1);
      expect(loadExplorerM1Payload).toHaveBeenCalledWith(1);
      expect(loadMasterLessonTrio).not.toHaveBeenCalled();
    });
  });

  it("a preview with the flag unset still reads the database", async () => {
    await withEnv({ VERCEL_ENV: "preview" }, async () => {
      const page = asElement(await openModuleOne());
      expect(propsOf(page)["data-lesson-source"]).toBe("current");
      expect(loadBundledLessonPayload).not.toHaveBeenCalled();
      expect(loadExplorerM1Payload).not.toHaveBeenCalled();
    });
  });
});

describe("lesson 1 map intro", () => {
  it("does not play the bundled Explorer clip in production when the flag is 0", async () => {
    await withEnv(
      {
        VERCEL_ENV: "production",
        ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_ACADEMY_MASTER_PAYLOAD: "0",
        NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
      },
      () => {
        const src = lessonOneMapIntroSrc("explorer");
        expect(src).toContain("/storage/v1/object/public/academy-media/audio/");
        expect(src).toContain("explorer-m1-intro-beat1-3cb1a9a8.mp3");
        expect(src?.startsWith("/academy-audio/")).toBe(false);
      },
    );
  });

  it("keeps the shipped Explorer clip outside production when the flag is off", async () => {
    await withEnv({}, () => {
      const src = lessonOneMapIntroSrc("explorer");
      expect(src?.startsWith("/academy-audio/explorer-m1/")).toBe(true);
    });
  });
});
