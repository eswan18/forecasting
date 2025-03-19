"use client";

import { Switch } from "@/components/ui/switch";

export function FeatureToggle(
  { name, checked, onCheckedChange }: {
    name?: string;
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
  },
) {
  return (
    <div className="flex flex-col gap-1 items-center">
      {name && <span className="text-muted-foreground">{name}</span>}
      <div className="flex flex-row items-center gap-2">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={onCheckedChange === undefined}
        />
        <span>{checked ? "On" : "Off"}</span>
      </div>
    </div>
  );
}
