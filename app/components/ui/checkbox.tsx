import * as React from "react";
import { cn } from "@/app/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-gray-400 accent-black disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
