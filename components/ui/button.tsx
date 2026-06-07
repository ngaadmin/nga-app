import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

const base =
  "inline-flex h-touch min-h-touch items-center justify-center rounded-nga-lg px-6 font-heading text-base font-bold transition-all disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-nga-primary text-white hover:bg-nga-primary-hover shadow-nga-pop active:scale-[0.98]",
  cta: [
    "bg-nga-cta text-nga-ink uppercase tracking-wide",
    "border-b-4 border-nga-cta-shadow",
    "hover:brightness-[1.02]",
    "active:translate-y-0.5 active:border-b-2",
  ].join(" "),
  secondary:
    "bg-nga-secondary text-nga-ink hover:brightness-95 shadow-nga-pop active:scale-[0.98]",
  "secondary-outline": [
    "bg-white text-nga-secondary uppercase tracking-wide",
    "border-2 border-nga-secondary border-b-4 border-b-nga-secondary-shadow",
    "hover:bg-nga-mist/40",
    "active:translate-y-0.5 active:border-b-2",
  ].join(" "),
  outline:
    "bg-nga-surface text-nga-primary border-2 border-nga-primary hover:bg-nga-mist active:scale-[0.98]",
  ghost:
    "bg-transparent text-nga-primary hover:bg-nga-primary/10 active:scale-[0.98]",
} as const;

type ButtonVariant = keyof typeof variants;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], fullWidth && "w-full", className)}
      {...props}
    />
  );
}

export type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function ButtonLink({
  className,
  variant = "primary",
  fullWidth,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], fullWidth && "w-full", className)}
      {...props}
    />
  );
}
