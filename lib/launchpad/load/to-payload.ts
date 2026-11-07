import type {
  LaunchpadBronze,
  LaunchpadIdentityWrapUp,
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadTaskScreen,
  LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import type { LaunchpadLoadFile, LoadSilver } from "@/lib/launchpad/load/types";
import { SEED_LOCKED_IDENTITY_SILVER } from "@/lib/launchpad/content/seed/identity-silver";

function loadSilver(s: LoadSilver): LaunchpadSilver {
  const bronzes: LaunchpadBronze[] = s.bronzes.map((b) => ({
    id: b.id,
    title: b.title,
    placeholder: false,
    tasks: b.tasks.map(
      (t): LaunchpadTask => ({
        id: t.id,
        title: t.title,
        placeholder: false,
        paged: t.paged,
        ...(t.kind === "real-world" ? { kind: t.kind } : {}),
        ...(t.canComeBackLater ? { canComeBackLater: true } : {}),
        ...(t.ctaLabel ? { ctaLabel: t.ctaLabel } : {}),
        screens: t.screens.filter((sc) => sc.payload).map((sc) => sc.payload as LaunchpadTaskScreen),
      }),
    ),
  }));
  return {
    id: s.id,
    title: s.title,
    placeholder: false,
    bronzes,
    ...(s.wrapUp?.payload ? { wrapUp: s.wrapUp.payload } : {}),
  };
}

/** Moves a seed silver to a new id: its own id and every bronze, task and screen id under it (answer keys stay). */
function renumberSilver(silver: LaunchpadSilver, from: string, to: string): LaunchpadSilver {
  const re = (id: string) => (id === from || id.startsWith(`${from}-`) ? to + id.slice(from.length) : id);
  return {
    ...silver,
    id: to,
    bronzes: silver.bronzes.map((b) => ({
      ...b,
      id: re(b.id),
      tasks: b.tasks.map((t) => ({ ...t, id: re(t.id), screens: t.screens.map((sc) => ({ ...sc, id: re(sc.id) })) })),
    })),
  };
}

/**
 * Overlays a load file onto a seed payload: each loaded level's silvers
 * replace the seed's (a "locked" silver keeps the seed's build, from any floor and renumbered
 * when seedSilverId says so, and only takes
 * the handbook sections), the gold takes its completion screen, and every
 * level the load does not cover keeps the seed placeholders.
 */
export function overlayLoad(seed: LaunchpadVenturePayload, load: LaunchpadLoadFile): LaunchpadVenturePayload {
  return {
    ...seed,
    floors: seed.floors.map((floor) => {
      const level = load.levels.find((l) => l.level === floor.level);
      if (!level) return floor;
      const silvers = level.silvers.map((s) => {
        if (s.build === "load") return loadSilver(s);
        const from = s.seedSilverId ?? s.id;
        // Prefer the off-floor locked identity over any floor silver that reused id l2-s2 (Pricing).
        const seedSilver =
          (from === SEED_LOCKED_IDENTITY_SILVER.id ? SEED_LOCKED_IDENTITY_SILVER : undefined) ??
          seed.floors.flatMap((f) => f.silvers).find((x) => x.id === from);
        if (!seedSilver) throw new Error(`Locked silver ${from} is not in the seed.`);
        const kept = from === s.id ? seedSilver : renumberSilver(seedSilver, from, s.id);
        // Locked silvers take the load title (e.g. The Brand) when it differs from the seed.
        const titled = s.title && s.title !== kept.title ? { ...kept, title: s.title } : kept;
        if (!s.wrapUp?.handbookSections || titled.wrapUp?.type !== "identity-wrap-up") return titled;
        const wrapUp: LaunchpadIdentityWrapUp = {
          ...titled.wrapUp,
          handbookSections: s.wrapUp.handbookSections,
          ...(s.wrapUp.vision ? { vision: s.wrapUp.vision } : {}),
        };
        return { ...titled, wrapUp };
      });
      // Keep seed silvers this level did not cover (e.g. L2 Pricing). Locked identity
      // lives off-floor (SEED_LOCKED_IDENTITY_SILVER), so it never appears as an extra.
      const covered = new Set(level.silvers.map((s) => s.id));
      const extras = floor.silvers.filter((s) => !covered.has(s.id));
      return {
        ...floor,
        // Outcome statements stay on the seed (Storybird draft / swappable data).
        gold: {
          ...floor.gold,
          ...(level.gold.completion ? { completion: level.gold.completion } : {}),
        },
        silvers: [...silvers, ...extras],
      };
    }),
  };
}
