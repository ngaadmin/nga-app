import type { ReactNode } from "react";

/**
 * A learner's pick, typed words, or a calculated figure on a workbook page.
 * Same look as Wrap-up's "Cash": bold navy with an aqua underline, and no caret.
 * Interactive menus keep their own button. This mark is read-only.
 */
export function ChosenValue({ children, block = false }: { children: ReactNode; block?: boolean }) {
  const line = block
    ? "font-semibold text-[#19347D] underline decoration-[#3FB7DA] decoration-2 underline-offset-[3px]"
    : "border-b-2 border-[#3FB7DA] font-semibold text-[#19347D]";
  return (
    <span className={line} data-chosen-value="">
      {children}
    </span>
  );
}
