/** Typography and layout tokens for the Vault My Money card. */

/** Primary section title (“My Money”) on the gradient card. */
export const vaultCardMainTitleClass =
  "font-heading text-[18px] font-extrabold leading-tight tracking-normal text-white sm:text-[20px]";

/** Primary wealth total under the My Money title. */
export const vaultCardBalanceClass =
  "mt-2 font-heading text-2xl font-extrabold leading-none tabular-nums text-white sm:text-[1.75rem]";

/** Manage-jars gear — top-right of card, 20px icon in touch target. */
export const vaultManageJarsButtonClass =
  "absolute right-3 top-3 z-raised flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/25 transition-colors hover:bg-white/25 hover:text-white active:bg-white/30";

/**
 * Budget jars grid viewport.
 * When more than one row (5+ jars), height caps to ~one row and scrolls vertically.
 */
export const vaultJarsGridViewportClass =
  "w-full min-w-0";

/** Applied when jars wrap to a second row — keep the card from growing downward. */
export const vaultJarsGridViewportScrollClass =
  "max-h-[9rem] overflow-y-auto overscroll-y-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/35";

/** Even grid track — column count set inline (1–4). */
export const vaultJarsGridTrackClass =
  "grid w-full gap-x-2 gap-y-2";

/** Jar tile — fills its grid cell; allows large balance strings. */
export const vaultJarGridTileClass =
  "flex min-w-0 w-full flex-col items-center rounded-xl border-2 px-1 py-2 transition-colors";

/** @deprecated Prefer {@link vaultJarGridTileClass}. */
export const vaultJarCarouselTileClass = vaultJarGridTileClass;

/** @deprecated Prefer {@link vaultJarsGridViewportClass}. */
export const vaultJarsCarouselViewportClass = vaultJarsGridViewportClass;

/** @deprecated Prefer {@link vaultJarsGridTrackClass}. */
export const vaultJarsCarouselTrackClass = vaultJarsGridTrackClass;

/** Jar name on grid tile. */
export const vaultJarTileNameClass =
  "mt-1.5 line-clamp-2 min-h-[2.25rem] w-full text-center font-heading text-[16px] font-bold leading-tight text-white/90";

/** Jar balance — slightly smaller so large amounts keep breathing room. */
export const vaultJarTileBalanceClass =
  "mt-0.5 w-full break-all text-center font-heading text-[16px] font-extrabold leading-tight tabular-nums text-white";

/** Section title on light Vault surfaces (deposit, expanded panels). */
export const vaultLightSectionTitleClass =
  "font-heading text-[17px] font-extrabold leading-snug tracking-normal text-[#031F82]";

/** Muted helper copy for virtual-money simulator disclaimers. */
export const vaultSimulatorDisclaimerClass =
  "font-sans text-[14px] leading-relaxed text-[#1E3A5F]/70";
