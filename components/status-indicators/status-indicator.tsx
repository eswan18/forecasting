import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type StatusIndicatorVariant =
  | "info"
  | "warning"
  | "danger"
  | "accent"
  | "success";

interface StatusIndicatorProps {
  children: ReactNode;
  variant: StatusIndicatorVariant;
  className?: string;
}

const variantStyles: Record<StatusIndicatorVariant, string> = {
  info: "bg-blue-500 text-white",
  warning: "bg-amber-500 text-black",
  danger: "bg-red-500 text-white",
  accent: "bg-accent text-accent-foreground",
  success: "bg-green-500 text-white",
};

/**
 * Base component for status indicators that appear at the top of the page.
 * Provides consistent styling across all status banners.
 */
export function StatusIndicator({
  children,
  variant,
  className,
}: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "w-full py-1.5 text-center text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
