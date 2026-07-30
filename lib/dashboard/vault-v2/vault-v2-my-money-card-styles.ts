/** Typography and layout tokens for the Vault V2 My Money card — delete with vault-v2/ on cutover. */

/** Primary section title (“My Money”) on the gradient card. */
export const vaultV2CardMainTitleClass =
  "font-heading text-lg font-extrabold leading-tight tracking-normal text-white sm:text-xl";

/** Primary wealth total under the My Money title. */
export const vaultV2CardBalanceClass =
  "mt-2 font-heading text-2xl font-extrabold leading-none tabular-nums text-white sm:text-[1.75rem]";

/** Manage-jars gear — top-right of card, 20px icon in touch target. */
export const vaultV2ManageJarsButtonClass =
  "absolute right-3 top-3 flex size-9 shrink-0 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15";

/** Horizontal carousel viewport for budget jar tiles. */
export const vaultV2JarsCarouselViewportClass =
  "w-full min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Snap track — jars stay in a single horizontal row. */
export const vaultV2JarsCarouselTrackClass =
  "flex w-max min-w-full snap-x snap-mandatory gap-2.5";

/** Fixed-width jar tile — prevents vertical growth when many jars exist. */
export const vaultV2JarCarouselTileClass =
  "flex w-[5.75rem] shrink-0 snap-start flex-col items-center rounded-xl border-2 px-1.5 py-2 transition-colors";

/** Jar name on carousel tile. */
export const vaultV2JarTileNameClass =
  "mt-1.5 line-clamp-2 min-h-[2rem] text-center font-heading text-xs font-bold leading-tight text-white/90";

/** Jar balance on carousel tile. */
export const vaultV2JarTileBalanceClass =
  "font-heading text-sm font-extrabold tabular-nums text-white";

/** Section title on light Vault V2 surfaces (deposit, expanded panels). */
export const vaultV2LightSectionTitleClass =
  "font-heading text-base font-extrabold leading-snug tracking-normal text-[#031F82]";
