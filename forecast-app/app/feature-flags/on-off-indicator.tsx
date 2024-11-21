"use client";

import { Switch } from "@/components/ui/switch";

export function OnOffIndicator(
  { name, onOff }: { name?: string; onOff?: boolean },
) {
  return (
    <div className="flex flex-col gap-1 items-center">
      {name && <span className="text-muted-foreground">{name}</span>}
      <div className="flex flex-row items-center gap-2">
        {onOff === undefined ? <span>None</span> : (
          <>
            <Switch checked={onOff} disabled />
            <span>{onOff ? "On" : "Off"}</span>
          </>
        )}
      </div>
    </div>
  );
}
