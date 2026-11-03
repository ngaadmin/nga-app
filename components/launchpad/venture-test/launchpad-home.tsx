"use client";

import { useRef, useState } from "react";
import {
  LAUNCHPAD_HOME_COPY,
  categoryPillOpacity,
  flatLaunchpadTiles,
  type LaunchpadTile,
} from "@/lib/launchpad/venture-test/launchpad-home-data";
import {
  LIVE_ICON_TONES,
  LOCKED_ICON_TONES,
  LiveShopFrontArt,
  LockBadgeArt,
  LockedShopFrontArt,
  SHOP_ICONS,
} from "@/components/launchpad/venture-test/launchpad-home-art";
import { BTN_ORANGE } from "@/components/launchpad/venture-test/venture-test-ui";

export type InProgressVenture = {
  ventureId: string;
  name: string;
  level: number;
  floorName: string;
  done: number;
  total: number;
};

const TILES = flatLaunchpadTiles();

function IdeaTile({
  tile,
  pill,
  pillOpacity,
  onOpen,
  onLocked,
}: {
  tile: Extract<LaunchpadTile, { kind: "idea" }>;
  pill: string | null;
  pillOpacity: number;
  onOpen: (ventureId: string) => void;
  onLocked: (name: string) => void;
}) {
  const live = tile.ventureId !== null;
  return (
    <button
      type="button"
      aria-disabled={!live}
      aria-label={live ? `${tile.name}. Open` : `${tile.name}. Locked`}
      onClick={() => (live ? onOpen(tile.ventureId!) : onLocked(tile.name))}
      className={`relative block w-[100px] flex-none text-left ${live ? "" : "cursor-default"}`}
    >
      {pill && (
        <span
          className="absolute left-0 top-[-24px] z-raised whitespace-nowrap rounded-full bg-nga-ink px-[9px] py-[3px] font-heading text-[10.5px] font-bold leading-[1.5] text-white transition-opacity duration-150"
          style={{ opacity: pillOpacity }}
          aria-hidden={pillOpacity === 0}
        >
          {pill}
        </span>
      )}
      <span className="relative block h-[84px] w-[100px] overflow-hidden rounded-2xl">
        {live ? <LiveShopFrontArt awning={tile.awning} /> : <LockedShopFrontArt />}
        <span className="absolute left-[26px] block size-12" style={{ top: live ? 20 : 23 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            {SHOP_ICONS[tile.icon](live ? LIVE_ICON_TONES : LOCKED_ICON_TONES)}
          </svg>
        </span>
      </span>
      {tile.featured && (
        <span className="absolute left-1/2 top-[66px] -translate-x-1/2 whitespace-nowrap rounded-full bg-nga-ink px-2 py-[3px] font-heading text-[10px] font-bold leading-[1.5] text-white">
          {LAUNCHPAD_HOME_COPY.featured}
        </span>
      )}
      {!live && (
        <span className="absolute right-[7px] top-[7px] flex size-5 items-center justify-center rounded-full bg-white">
          <LockBadgeArt />
        </span>
      )}
      <span
        className="-mx-1 mt-[7px] line-clamp-2 block w-[108px] px-px text-center font-heading text-[11px] font-bold leading-[1.25] tracking-[-0.1px]"
        style={{ color: live ? "#031f82" : "rgba(3,31,130,.45)" }}
      >
        {tile.name}
      </span>
    </button>
  );
}

function MoreTile({ pill, pillOpacity }: { pill: string | null; pillOpacity: number }) {
  return (
    <div className="relative w-[100px] flex-none">
      {pill && (
        <span className="absolute left-0 top-[-24px] rounded-full bg-nga-ink px-[9px] py-[3px] font-heading text-[10.5px] font-bold text-white" style={{ opacity: pillOpacity }}>
          {pill}
        </span>
      )}
      <div className="box-border flex h-[84px] w-[100px] items-center justify-center rounded-2xl border-2 border-dashed border-nga-panel bg-white px-2.5 text-center font-heading text-xs font-semibold leading-[1.3] text-[#8a9bb0]">
        {LAUNCHPAD_HOME_COPY.moreIdeas}
      </div>
    </div>
  );
}

/** TEST-ONLY Launchpad landing page (Jasper's r12 home). */
export function LaunchpadHome({
  inProgress,
  onOpenVenture,
}: {
  inProgress: InProgressVenture[];
  onOpenVenture: (ventureId: string) => void;
}) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [lockedNote, setLockedNote] = useState<string | null>(null);
  const frame = useRef<number | null>(null);

  return (
    <section className="px-5 pb-6 pt-2">
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-2xl font-bold leading-[35px] text-nga-ink">Launchpad</h1>
        <span
          className="flex size-6 items-center justify-center rounded-full bg-nga-mist font-heading text-[13px] font-extrabold text-nga-ink"
          aria-hidden="true"
        >
          i
        </span>
      </div>

      <h2 className="mb-3 mt-[22px] font-heading text-lg font-bold text-nga-ink">Business Ideas</h2>
      <div
        className="-mr-5 overflow-x-auto pt-[26px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Business Ideas"
        data-testid="lp-carousel"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (frame.current !== null) cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => setScrollLeft(el.scrollLeft));
        }}
      >
        <div className="flex w-max items-start gap-2.5 pr-5">
          {TILES.map(({ tile, pill, x }) => {
            const op = pill ? categoryPillOpacity(x, scrollLeft) : 1;
            return (
              <div role="listitem" key={tile.key}>
                {tile.kind === "more" ? (
                  <MoreTile pill={pill} pillOpacity={op} />
                ) : (
                  <IdeaTile
                    tile={tile}
                    pill={pill}
                    pillOpacity={op}
                    onOpen={onOpenVenture}
                    onLocked={(name) => setLockedNote(LAUNCHPAD_HOME_COPY.lockedNote(name))}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className={`text-[13px] leading-[17px] text-nga-slate ${lockedNote ? "mt-2" : ""}`} role="status">
        {lockedNote}
      </p>

      <h2 className={`mb-3 font-heading text-lg font-bold text-nga-ink ${lockedNote ? "mt-3" : "mt-[22px]"}`}>In Progress</h2>
      {inProgress.length === 0 ? (
        <p className="rounded-2xl bg-nga-mist p-[18px] text-base font-medium text-nga-slate">{LAUNCHPAD_HOME_COPY.emptyInProgress}</p>
      ) : (
        inProgress.map((v) => (
          <div key={v.ventureId} className="mb-2 flex items-center gap-3 rounded-2xl bg-nga-mist p-3">
            <span className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-nga-secondary font-heading text-[13px] font-bold text-white">
              L{v.level}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[15px] font-bold text-nga-ink">{v.name}</p>
              <p className="mt-0.5 text-[13px] font-medium leading-[1.35] text-nga-slate">
                L{v.level} · {v.floorName} · {v.done} of {v.total} milestones
              </p>
              <div className="mt-[7px] h-1.5 overflow-hidden rounded-[3px] bg-white">
                <i className="block h-full rounded-[3px] bg-nga-secondary" style={{ width: `${Math.round((v.done / Math.max(1, v.total)) * 100)}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenVenture(v.ventureId)}
              className={`${BTN_ORANGE} flex-none !px-3.5 !py-2 !text-sm shadow-[0_3px_0_#c88202]`}
            >
              Continue
            </button>
          </div>
        ))
      )}
    </section>
  );
}
