import type {
  LaunchpadBronze,
  LaunchpadIdentityWrapUp,
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadTaskScreen,
  LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import type { LaunchpadLoadFile, LoadSilver } from "@/lib/launchpad/load/types";

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

/**
 * Overlays a load file onto a seed payload: each loaded level's silvers
 * replace the seed's (a "locked" silver keeps the seed's build and only takes
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
        const kept = floor.silvers.find((x) => x.id === s.id);
        if (!kept) throw new Error(`Locked silver ${s.id} is not in the seed.`);
        if (!s.wrapUp?.handbookSections || kept.wrapUp?.type !== "identity-wrap-up") return kept;
        const wrapUp: LaunchpadIdentityWrapUp = { ...kept.wrapUp, handbookSections: s.wrapUp.handbookSections };
        return { ...kept, wrapUp };
      });
      return {
        ...floor,
        gold: { ...floor.gold, ...(level.gold.completion ? { completion: level.gold.completion } : {}) },
        silvers,
      };
    }),
  };
}
