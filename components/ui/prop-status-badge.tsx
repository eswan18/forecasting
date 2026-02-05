import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { PropStatus, getPropStatusLabel } from "@/lib/prop-status";

const propStatusBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        open: "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
        closed: "border-transparent bg-secondary text-secondary-foreground",
        "resolved-yes":
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        "resolved-no":
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
      },
    },
    defaultVariants: {
      status: "open",
    },
  },
);

export interface PropStatusBadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof propStatusBadgeVariants> {
  status: PropStatus;
  /** Optional custom label (defaults to status label) */
  label?: string;
}

/**
 * Badge component for displaying prop lifecycle status
 *
 * @example
 * <PropStatusBadge status="open" />
 * <PropStatusBadge status="resolved-yes" />
 */
function PropStatusBadge({
  status,
  label,
  className,
  ...props
}: PropStatusBadgeProps) {
  const displayLabel = label ?? getPropStatusLabel(status);

  return (
    <div
      className={cn(propStatusBadgeVariants({ status }), className)}
      {...props}
    >
      {displayLabel}
    </div>
  );
}

export { PropStatusBadge, propStatusBadgeVariants };
