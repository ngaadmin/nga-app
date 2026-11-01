export type ViewportName = "phone" | "desktop";

export type UatArgs = {
  lessons: number[];
  spot: number[];
  viewports: ViewportName[];
  chain: boolean;
  webkit: boolean;
  shot: boolean;
};

export const ALL_EXPLORER_LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Accessible name of the Academy map control that opens a lesson. Node 9 is the module milestone. */
export function academyLaunchName(lesson: number): string {
  if (lesson % 9 === 0) return `Level ${Math.ceil(lesson / 9)} milestone`;
  return `Academy step ${lesson}`;
}

export function parseLessonList(value: string): number[] {
  const lessons = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((lesson) => Number.isInteger(lesson) && lesson >= 1 && lesson <= 9);
  if (lessons.length === 0 || lessons.length !== value.split(",").filter((part) => part.trim()).length) {
    throw new Error(`Lesson list must be numbers 1-9, for example --lesson=2 or --lesson=1,2. Got "${value}".`);
  }
  return lessons;
}

export function explicitLessons(argv: readonly string[], envLessons?: string): number[] | null {
  const flag = argv.find((arg) => arg.startsWith("--lesson="));
  if (flag) return parseLessonList(flag.slice("--lesson=".length));
  const positional = argv.find((arg) => /^\d+(,\d+)*$/.test(arg));
  if (positional) return parseLessonList(positional);
  if (envLessons) return parseLessonList(envLessons);
  return null;
}

/** Flags for tools/uat-explorer.ts. WebKit stays off unless --webkit is passed. */
export function parseUatArgs(
  argv: readonly string[],
  env: { LESSONS?: string; SKIP_WEBKIT?: string } = {},
): UatArgs {
  const options: UatArgs = {
    lessons: [],
    spot: [],
    viewports: ["phone", "desktop"],
    chain: false,
    webkit: false,
    shot: false,
  };
  for (const arg of argv) {
    if (arg === "--chain") {
      options.chain = true;
    } else if (arg === "--webkit") {
      options.webkit = true;
    } else if (arg === "--shot") {
      options.shot = true;
    } else if (arg.startsWith("--lesson=")) {
      options.lessons = parseLessonList(arg.slice("--lesson=".length));
    } else if (arg.startsWith("--spot=")) {
      options.spot = parseLessonList(arg.slice("--spot=".length));
    } else if (arg.startsWith("--viewport=")) {
      const value = arg.slice("--viewport=".length);
      if (value === "phone") options.viewports = ["phone"];
      else if (value === "desktop") options.viewports = ["desktop"];
      else if (value === "both") options.viewports = ["phone", "desktop"];
      else throw new Error(`Unknown --viewport=${value}. Use phone, desktop, or both.`);
    } else if (/^\d+(,\d+)*$/.test(arg)) {
      options.lessons = parseLessonList(arg);
    } else {
      throw new Error(`Unknown argument ${arg}. Use --lesson=N, --viewport=phone|desktop|both, --chain, --spot=N, --shot.`);
    }
  }
  if (options.lessons.length === 0 && env.LESSONS) options.lessons = parseLessonList(env.LESSONS);
  if (options.lessons.length === 0) options.lessons = [...ALL_EXPLORER_LESSONS];
  if (env.SKIP_WEBKIT === "1") options.webkit = false;
  return options;
}
