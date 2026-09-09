import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-sm border border-surface-border bg-bg-sunken px-3.5 pr-9 text-sm text-text-primary transition focus:border-accent-400 focus:ring-3 focus:ring-accent/25 focus:outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-text-tertiary"
        />
      </div>
    );
  },
);
