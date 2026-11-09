"use client";

import { createContext, useContext, type ReactNode } from "react";

const TemplateBlanksContext = createContext(false);

/** Home level-scope turns this on so empty slots keep their template underlines. */
export function TemplateBlanks({ on, children }: { on: boolean; children: ReactNode }) {
  return <TemplateBlanksContext.Provider value={on}>{children}</TemplateBlanksContext.Provider>;
}

export function useTemplateBlanks(): boolean {
  return useContext(TemplateBlanksContext);
}

/** Empty fill-in slot: the same aqua underline as a filled answer, with no text. */
export function BlankSlot() {
  return <span className="inline-block min-w-16 border-b-2 border-[#0CC1E0] align-baseline" data-blank-slot="">{"\u00a0"}</span>;
}
