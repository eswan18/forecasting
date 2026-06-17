"use client";

import { CircleDashed } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Marks a forecaster who hasn't forecasted every proposition — their score is
 * based on a partial set. A muted dashed circle reads as "partial" at a glance;
 * the tooltip spells it out. Render it OUTSIDE any truncating name span so it
 * never clips.
 */
export function IncompleteIndicator({ className }: { className?: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex shrink-0 items-center text-muted-foreground",
              className,
            )}
          >
            <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">
              Incomplete — hasn&apos;t forecasted every proposition
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>Hasn&apos;t forecasted every proposition</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
