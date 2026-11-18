import type { ReactNode } from "react";
import { WORKBOOK_ANSWER } from "@/components/launchpad/venture/handbook/paper-art";

/**
 * A learner's pick, typed words, or a calculated figure on a workbook page.
 * Bold navy at the shared body size, with no underline and no caret.
 */
export function ChosenValue({ children }: { children: ReactNode; block?: boolean }) {
  return (
    <span className={WORKBOOK_ANSWER} data-chosen-value="">
      {children}
    </span>
  );
}
