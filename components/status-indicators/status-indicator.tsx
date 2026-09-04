import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type StatusIndicatorVariant =
  "info" | "warning" | "danger" | "accent" | "success";

interface StatusIndicatorProps {
  children: ReactNode;
  variant: StatusIndicatorVariant;
  className?: string;
}

/*
 * Five hues became two inks. A banner is a plate of ink with paper text, and
 * the second ink is spent only where mistaking your context does damage: you
 * are not in production, or you are acting as someone else. Everything else —
 * "you are on an admin page" — is merely true, and prints in ink.
 *
 * The variant names are kept so callers need not change; what they map to is
 * now a weight, not a colour.
 */
const variantStyles: Record<StatusIndicatorVariant, string> = {
  info: "riso-banner",
  warning: "riso-banner alarm",
  accent: "riso-banner",
  danger: "riso-banner alarm",
  success: "riso-banner",
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
        className,
      )}
    >
      {children}
    </div>
  );
}
