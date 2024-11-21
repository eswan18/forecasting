"use client";

import { Separator } from "@/components/ui/separator";
import { FeatureToggle } from "./feature-toggle";
import { VFeatureFlag } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { updateFeatureFlag } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";

export function UserLevelFlagsContainer({ flags }: { flags: VFeatureFlag[] }) {
  const { toast } = useToast();
  const setFlagEnabled = async (flagId: number, enabled: boolean) => {
    await updateFeatureFlag({ id: flagId, enabled });
    toast({
      title: "Feature flag updated",
      description: `The feature flag is now *${enabled ? "on" : "off"}*`,
    })
  };
  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag, index) => (
        <div key={flag.user_id} className="flex flex-col gap-2">
          {index > 0 && <Separator />}
          <div className="flex flex-row justify-between px-2">
            <span>{flag.user_id} ({flag.user_name})</span>
            <FeatureToggle
              checked={flag.enabled}
              onCheckedChange={(checked) => setFlagEnabled(flag.id, checked)}
            />
          </div>
        </div>
      ))}
      <Button variant="outline" className="mt-3 mx-2 gap-x-2">
        Add User-Level Flag<CirclePlus />
      </Button>
    </div>
  );
}
