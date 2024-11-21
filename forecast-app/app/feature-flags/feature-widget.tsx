"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VFeatureFlag } from "@/types/db_types";
import { OnOffIndicator } from "./on-off-indicator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserLevelFlagsContainer } from "./user-level-flags-container";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { createFeatureFlag } from "@/lib/db_actions";

interface FeatureWidgetProps {
  featureName: string;
  flags: VFeatureFlag[];
}

export function FeatureWidget({ featureName, flags }: FeatureWidgetProps) {
  const defaultValue = flags.find((flag) => flag.user_id === null);
  const userValues = flags.filter((flag) => flag.user_id !== null);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{featureName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row justify-between items-end">
          {defaultValue !== undefined
            ? (
              <OnOffIndicator
                name="Default Value"
                onOff={defaultValue.enabled}
              />
            )
            : (
              <div className="flex flex-col gap-1 items-center">
                <span className="text-muted-foreground">Default Value</span>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 font-normal"
                    >
                      <span className="text-sm">None</span>
                      <Edit size={14} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{featureName}</DialogTitle>
                      <DialogDescription>Add a default value</DialogDescription>
                    </DialogHeader>
                    <AddDefaultFeatureFlagWidget
                      featureName={featureName}
                      onChoice={() => setDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-row justify-end gap-2"
              >
                {userValues.length}{" "}
                user-level flag{userValues.length != 1 && "s"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <UserLevelFlagsContainer flags={userValues} />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}

function AddDefaultFeatureFlagWidget(
  { featureName, onChoice }: { featureName: string; onChoice?: () => void },
) {
  const flag = { name: featureName, user_id: null };
  const saveDefaultFlag = (enabled: boolean) => {
    createFeatureFlag({ featureFlag: { ...flag, enabled } });
    onChoice && onChoice();
  };
  return (
    <div className="flex flex-row gap-4 items-center">
      <Button variant="secondary" onClick={() => saveDefaultFlag(false)}>
        Off
      </Button>
      <Button variant="secondary" onClick={() => saveDefaultFlag(true)}>
        On
      </Button>
    </div>
  );
}
