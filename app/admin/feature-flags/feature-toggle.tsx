"use client";

import { Switch } from "@/components/ui/switch";

export function FeatureToggle({
  name,
  checked,
  onCheckedChange,
}: {
  name?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {name && (
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {name}
        </span>
      )}
      <div className="flex flex-row items-center gap-2">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={onCheckedChange === undefined}
        />
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {checked ? "On" : "Off"}
        </span>
      </div>
    </div>
  );
}
