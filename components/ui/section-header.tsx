import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  /** Small uppercase mono label rendered above/with the title. */
  kicker?: string;
  /** Optional trailing content (links, counts) aligned to the right. */
  action?: React.ReactNode;
}

/**
 * Left-aligned section header with a small uppercase mono "kicker" label.
 * Replaces the centered, icon-led headings used across the app.
 */
function SectionHeader({
  kicker,
  action,
  className,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    >
      <div className="min-w-0">
        {kicker && (
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {kicker}
          </div>
        )}
        {children && (
          <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
            {children}
          </h2>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { SectionHeader };
