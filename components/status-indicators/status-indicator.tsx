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
  // Environment-identity banners: deliberately distinct hues so local/dev are
  // instantly recognizable. No semantic token maps to these, so they stay as
  // explicit colors.
  info: "bg-blue-500 text-white",
  warning: "bg-amber-500 text-black",
  // Brand / mode banner (admin, staging): indigo, on-palette with `--primary`.
  accent: "bg-primary text-primary-foreground",
  // Status banners use the shared semantic tokens.
  danger: "bg-destructive text-destructive-foreground",
  success: "bg-success text-success-foreground",
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
