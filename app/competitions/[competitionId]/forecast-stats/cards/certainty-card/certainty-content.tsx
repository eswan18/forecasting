"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface AvgCertaintyForUser {
  userId: number;
  userName: string;
  avgCertainty: number;
}

export default function CertaintyContent({
  certainties,
}: {
  certainties: AvgCertaintyForUser[];
}) {
  const [reversed, setReversed] = useState(false);
  // Sort a copy (most-certain first by default) so we don't mutate props.
  const sorted = [...certainties].sort((a, b) =>
    reversed
      ? a.avgCertainty - b.avgCertainty
      : b.avgCertainty - a.avgCertainty,
  );
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Forecaster
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setReversed(!reversed)}
          className="h-7 gap-x-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          {reversed ? "Least" : "Most"} certain <ArrowUpDown size={14} />
        </Button>
      </div>
      <ScrollArea className="h-[13rem] px-1" type="auto">
        <div className="divide-y">
          {sorted.map(({ userId, userName, avgCertainty }) => (
            <div
              key={userId}
              className="flex items-center justify-between gap-3 py-1.5 text-sm"
            >
              <span className="truncate text-muted-foreground">{userName}</span>
              <span className="font-mono tabular-nums text-foreground">
                {avgCertainty.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Certainty is the average distance from 0.5.
      </p>
    </>
  );
}
