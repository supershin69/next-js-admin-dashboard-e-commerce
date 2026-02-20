import * as React from "react";
import { cn } from "@/app/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "processing";
}

const variants = {
  default: "border-transparent bg-gray-900 text-white",
  secondary: "border-transparent bg-gray-100 text-gray-800",
  success: "border-transparent bg-green-100 text-green-800",
  warning: "border-transparent bg-yellow-100 text-yellow-800",
  danger: "border-transparent bg-red-100 text-red-800",
  info: "border-transparent bg-blue-100 text-blue-800",
  processing: "border-transparent bg-orange-100 text-orange-800",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
