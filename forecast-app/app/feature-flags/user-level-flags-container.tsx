"use client";

import { Separator } from "@/components/ui/separator";
import { OnOffIndicator } from "./on-off-indicator";
import { VFeatureFlag } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";

export function UserLevelFlagsContainer({ flags }: { flags: VFeatureFlag[] }) {
  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag, index) => (
        <div key={flag.user_id} className="flex flex-col gap-2">
          {index > 0 && <Separator />}
          <div className="flex flex-row justify-between px-2">
            <span>{flag.user_id} ({flag.user_name})</span>
            <OnOffIndicator onOff={flag.enabled} />
          </div>
        </div>
      ))}
        <Button variant="outline" className="mt-3 mx-2 gap-x-2">Add User-Level Flag<CirclePlus /></Button>
    </div>
  );
}
