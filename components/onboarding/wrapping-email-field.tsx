"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";

type WrappingEmailFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows" | "type" | "inputMode"
> & {
  value: string;
};

/**
 * Email address field that wraps long addresses onto extra lines instead of
 * clipping them. It looks like a one-line input until the address is longer
 * than the box. Enter never adds a line break; it submits the form like an
 * email input does, and only when the form's submit button is enabled.
 */
export function WrappingEmailField({
  value,
  onKeyDown,
  className,
  ...rest
}: WrappingEmailFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  useLayoutEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter") return;
    event.preventDefault();
    const form = event.currentTarget.form;
    const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (form && submit && !submit.disabled) form.requestSubmit(submit);
  }

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      value={value}
      inputMode="email"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      onKeyDown={handleKeyDown}
      className={`${className ?? ""} block min-h-[52px] resize-none overflow-hidden whitespace-pre-wrap break-all leading-6`}
    />
  );
}
