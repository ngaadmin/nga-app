import { spawn, spawnSync } from "node:child_process";
import { openSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_EXPLORER_LESSONS, explicitLessons } from "./uat-explorer-args";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TIER = process.argv[2];
const REST = process.argv.slice(3);
const TSC = path.join(REPO, "node_modules", ".bin", "tsc");
const VITEST = path.join(REPO, "node_modules", ".bin", "vitest");

const FLOW_TESTS = [
  "lib/academy/lessons/payload/explorer-m1/explorer-m1-payload.test.ts",
  "lib/academy/lessons/payload/lesson-payload.validation.test.ts",
  "lib/academy/lessons/payload/module1-playable.test.ts",
  "lib/academy/lessons/story-audio/playback.test.ts",
  "lib/academy/lessons/story-audio/story-audio.test.ts",
  "lib/academy/lessons/story-audio/master-mute.test.ts",
  "lib/academy/lessons/utils.test.ts",
  "tools/uat-explorer-args.test.ts",
  "lib/academy/lessons/lesson-availability.test.ts",
];

function run(label: string, command: string, args: string[]): number {
  const started = Date.now();
  console.log(`\n>> ${label}`);
  const result = spawnSync(command, args, { cwd: REPO, stdio: "inherit", env: process.env });
  const seconds = (Date.now() - started) / 1000;
  if (result.error) console.error(result.error.message);
  const ok = result.status === 0;
  console.log(`<< ${label} ${ok ? "ok" : "FAIL"} in ${seconds.toFixed(1)}s`);
  if (!ok) {
    console.log(`TIER ${TIER} stopped during ${label} after ${seconds.toFixed(1)}s`);
    process.exit(result.status ?? 1);
  }
  return seconds;
}

function demoSupabaseEnv(): Record<string, string> {
  const text = readFileSync(path.join(REPO, "playwright.config.ts"), "utf8");
  const url = text.match(/http:\/\/127\.0\.0\.1:54321/)?.[0];
  const key = text.match(/eyJ[A-Za-z0-9_\-.]+/)?.[0];
  if (!url || !key) {
    throw new Error("Could not read the local demo Supabase settings from playwright.config.ts");
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
  };
}

async function serverUp(): Promise<boolean> {
  try {
    const response = await fetch("http://127.0.0.1:3000/", { redirect: "manual" });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function ensureDev(): Promise<void> {
  if (await serverUp()) {
    console.log("dev server already on port 3000");
    return;
  }
  console.log("starting dev server on port 3000");
  const started = Date.now();
  const logFd = openSync("/tmp/next-dev-tier.log", "a");
  const child = spawn("npm", ["run", "dev", "--", "--port", "3000"], {
    cwd: REPO,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, ...demoSupabaseEnv() },
  });
  child.unref();
  while (Date.now() - started < 120_000) {
    if (await serverUp()) {
      console.log(`dev server ready in ${((Date.now() - started) / 1000).toFixed(1)}s (not counted in the tier total)`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Dev server did not start. See /tmp/next-dev-tier.log");
}

function walker(args: string[]): number {
  return run("lesson walk", "npx", ["tsx", "--tsconfig", "tsconfig.json", "tools/uat-explorer.ts", ...args]);
}

async function main(): Promise<void> {
  if (TIER !== "quick" && TIER !== "flow" && TIER !== "full") {
    console.error("Usage: tsx tools/check-tier.ts quick|flow|full [--lesson=N]");
    process.exit(1);
  }
  await ensureDev();
  const started = Date.now();
  const parts: string[] = [];
  parts.push(`typecheck ${run("typecheck", TSC, ["--noEmit"]).toFixed(1)}s`);

  if (TIER === "quick") {
    const lessons = explicitLessons(REST, process.env.LESSONS);
    if (!lessons) {
      console.error("check:quick needs a lesson. Example: npm run check:quick -- --lesson=2");
      process.exit(1);
    }
    parts.push(`unit tests ${run("unit tests for touched files", VITEST, ["run", "--changed"]).toFixed(1)}s`);
    parts.push(
      `walk ${walker(["--viewport=phone", `--lesson=${lessons.join(",")}`, "--shot"]).toFixed(1)}s`,
    );
  } else if (TIER === "flow") {
    const lessons = explicitLessons(REST, process.env.LESSONS) ?? [...ALL_EXPLORER_LESSONS];
    const spot = ALL_EXPLORER_LESSONS.filter((lesson) => !lessons.includes(lesson));
    const viewport = REST.find((arg) => arg.startsWith("--viewport=")) ?? "--viewport=both";
    parts.push(`lesson-flow tests ${run("lesson-flow tests", VITEST, ["run", ...FLOW_TESTS]).toFixed(1)}s`);
    const walkArgs = ["--chain", viewport, `--lesson=${lessons.join(",")}`];
    if (spot.length > 0) walkArgs.push(`--spot=${spot.join(",")}`);
    parts.push(`walk ${walker(walkArgs).toFixed(1)}s`);
  } else {
    parts.push(`unit tests ${run("full unit tests", VITEST, ["run"]).toFixed(1)}s`);
    parts.push(
      `walk ${walker(["--viewport=both", `--lesson=${ALL_EXPLORER_LESSONS.join(",")}`]).toFixed(1)}s`,
    );
  }

  const total = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\nTIER ${TIER} total ${total}s`);
  console.log(parts.join(" | "));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
