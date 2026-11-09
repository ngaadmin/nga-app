import { Fredoka, Pacifico, Poppins } from "next/font/google";
import type { NameFontId } from "@/lib/launchpad/content/identity";

/*
 * Business-name fonts, loaded with next/font/google and used only by the
 * identity components (the class names are applied to the name text alone;
 * nothing here touches the app-wide font variables).
 */
const poppinsBold = Poppins({ weight: "700", subsets: ["latin"], display: "swap" });
const fredokaSemiBold = Fredoka({ weight: "600", subsets: ["latin"], display: "swap" });
/**
 * Workbook section headings. Cath may switch this to "600".
 * next/font only accepts a written literal, so the Fredoka() weight below must stay equal to this constant.
 */
export const WORKBOOK_HEADING_WEIGHT = "700" as const;
const fredokaHeading = Fredoka({ weight: "700", subsets: ["latin"], display: "swap" });
export const FREDOKA_HEADING_CLASS = fredokaHeading.className;
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], display: "swap" });

export const NAME_FONT_CLASS: Record<NameFontId, string> = {
  "poppins-bold": poppinsBold.className,
  "fredoka-semibold": fredokaSemiBold.className,
  pacifico: pacifico.className,
};

/**
 * Smallest name size per font. Bold faces stay at 19px or more (WCAG large
 * text, so teal at 3.81:1 passes). Pacifico only ships one weight (400), so it
 * stays at 24px or more, the large-text size for regular weight.
 */
export const NAME_FONT_MIN_PX: Record<NameFontId, number> = {
  "poppins-bold": 19,
  "fredoka-semibold": 19,
  pacifico: 24,
};

export const NAME_FONT_LINE_HEIGHT: Record<NameFontId, number> = {
  "poppins-bold": 1.2,
  "fredoka-semibold": 1.2,
  pacifico: 1.45,
};
export const FREDOKA_CLASS = fredokaSemiBold.className;
