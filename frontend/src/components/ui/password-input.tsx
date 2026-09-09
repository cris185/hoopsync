import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={cn(
            "h-11 w-full rounded-sm border border-surface-border bg-bg-sunken px-3.5 pr-11 text-sm text-text-primary transition placeholder:text-text-tertiary focus:border-accent-400 focus:ring-3 focus:ring-accent/25 focus:outline-none",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          tabIndex={-1}
          title={isVisible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-text-tertiary transition hover:text-text-secondary"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  },
);
