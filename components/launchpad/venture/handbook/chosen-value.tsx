import type { ReactNode } from "react";

/**
 * A learner's pick, typed words, or a calculated figure on a workbook page.
 * Same look as Wrap-up's "Cash": bold navy with an aqua underline, and no caret.
 * Interactive menus keep their own button. This mark is read-only.
 */
export function ChosenValue({ children }: { children: ReactNode; block?: boolean }) {
  return (
    <span className="font-semibold text-[#19347D]" data-chosen-value="">
      {children}
    </span>
  );
}
