import { cn } from "@/lib/utils/cn";

/** Shared pickable circle + label — Launchpad, Community, Vault jars. */

export const pickableCircleClass =
  "flex size-[3.8125rem] shrink-0 items-center justify-center rounded-full text-3xl leading-none";

export const pickableCircleActiveClass = "bg-[#EEF9FF] text-nga-primary";

export const pickableCircleMutedClass = "bg-gray-100 text-gray-400 grayscale";

export const pickableLabelClass =
  "mt-1.5 w-full min-w-0 truncate font-heading text-[13px] font-bold leading-tight";

export const pickableLabelActiveClass = "text-[#031F82]";

export const pickableLabelMutedClass = "text-nga-primary/45";

export const pickableMetaClass =
  "mt-0.5 w-full min-w-0 truncate font-heading text-[12px] font-extrabold leading-tight tabular-nums";

export const pickableMetaActiveClass = "text-[#031F82]";

export const pickableMetaMutedClass = "text-nga-primary/30";

export const pickableItemClass =
  "flex min-w-0 flex-col items-center bg-transparent px-1 py-1 text-center";

export const pickableCarouselItemClass = cn(
  pickableItemClass,
  "w-[calc((100cqi-1.5rem)/3.3)] shrink-0 snap-start",
);

export const pickableCarouselTrackClass =
  "flex w-max snap-x snap-mandatory gap-2";

export const pickableCarouselScrollerClass =
  "@container w-full min-w-0 overflow-x-auto overscroll-x-contain py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
