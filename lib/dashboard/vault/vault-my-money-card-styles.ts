/** Typography and layout tokens for the Vault My Money card. */

/** Header label (“My Money”). */
export const vaultCardMainTitleClass =
  "font-heading text-[16px] font-bold leading-tight tracking-normal text-[#031F82]";

/** Net-worth amount — only this may be larger/bolder than the label. */
export const vaultCardBalanceClass =
  "font-heading text-xl font-extrabold leading-none tabular-nums text-[#031F82]";

/** Manage-jars gear — end of the header row. */
export const vaultManageJarsButtonClass =
  "z-raised flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-lg text-[#031F82] transition-colors hover:bg-[#031F82]/8 active:bg-[#031F82]/12";

/** Budget jars grid viewport — grows with wrapped rows. */
export const vaultJarsGridViewportClass =
  "w-full min-w-0";

/** @deprecated Card now grows with extra jar rows instead of scrolling. */
export const vaultJarsGridViewportScrollClass =
  "";

/** Even 4-column track on phone width. */
export const vaultJarsGridTrackClass =
  "grid w-full gap-x-1 gap-y-1";

/** Compact jar tile. */
export const vaultJarGridTileClass =
  "flex min-w-0 w-full flex-col items-center rounded-lg border-2 px-0.5 py-0.5 transition-colors";

/** @deprecated Prefer {@link vaultJarGridTileClass}. */
export const vaultJarCarouselTileClass = vaultJarGridTileClass;

/** @deprecated Prefer {@link vaultJarsGridViewportClass}. */
export const vaultJarsCarouselViewportClass = vaultJarsGridViewportClass;

/** @deprecated Prefer {@link vaultJarsGridTrackClass}. */
export const vaultJarsCarouselTrackClass = vaultJarsGridTrackClass;

/** Jar name on grid tile. */
export const vaultJarTileNameClass =
  "mt-0.5 line-clamp-2 w-full text-center font-heading text-[12px] font-bold leading-tight text-[#031F82]";

/** Jar balance on grid tile. */
export const vaultJarTileBalanceClass =
  "w-full break-all text-center font-heading text-[12px] font-extrabold leading-tight tabular-nums text-[#031F82]";

/** Section title on light Vault surfaces (deposit, expanded panels). */
export const vaultLightSectionTitleClass =
  "font-heading text-[17px] font-extrabold leading-snug tracking-normal text-[#031F82]";

/** Muted helper copy for virtual-money simulator disclaimers. */
export const vaultSimulatorDisclaimerClass =
  "font-sans text-[14px] leading-relaxed text-[#1E3A5F]/70";
