import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "corner-cut bg-accent text-accent-ink hover:brightness-110",
  secondary: "corner-cut bg-surface-tint-strong text-text-primary hover:bg-white/10",
  ghost: "bg-transparent text-text-secondary hover:bg-white/[0.06] hover:text-text-primary",
  danger: "corner-cut bg-status-live text-white hover:brightness-110",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 px-[18px] font-display text-[13px] font-extrabold tracking-wide uppercase transition active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-surface-border bg-surface-tint-strong text-text-secondary transition hover:border-accent-400",
          className,
        )}
        {...props}
      />
    );
  },
);
