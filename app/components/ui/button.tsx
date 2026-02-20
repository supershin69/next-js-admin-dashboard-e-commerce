import * as React from "react";
import { cn } from "@/app/lib/utils";

type ButtonVariant = "default" | "outline" | "destructive" | "ghost";
type ButtonSize = "default" | "sm";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-black text-white hover:bg-black/85",
  outline:
    "border border-gray-300 bg-background text-foreground hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-foreground hover:bg-gray-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button };
