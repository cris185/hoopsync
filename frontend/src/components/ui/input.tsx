import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-sm border border-surface-border bg-bg-sunken px-3.5 text-sm text-text-primary transition placeholder:text-text-tertiary focus:border-accent-400 focus:ring-3 focus:ring-accent/25 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
