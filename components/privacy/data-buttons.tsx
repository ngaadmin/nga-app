import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const base =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-heading text-sm font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40";

export function NavyButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        "border-b-4 border-[#021558] bg-[#031F82] text-white hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2",
      )}
    >
      {children}
    </button>
  );
}

export function NavyOutlineButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        "border-2 border-b-4 border-[#031F82] bg-white text-[#031F82] hover:bg-[#EAF0FF]/40 active:translate-y-[2px] active:border-b-2",
      )}
    >
      {children}
    </button>
  );
}

export function noteClass() {
  return "text-center font-sans text-[12.5px] font-medium leading-snug text-[#4A5675]";
}
