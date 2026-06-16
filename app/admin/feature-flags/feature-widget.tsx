"use client";

import { useState } from "react";
import { VFeatureFlag } from "@/types/db_types";
import { FeatureToggle } from "./feature-toggle";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFeatureFlag, updateFeatureFlag } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";

interface FeatureWidgetProps {
  featureName: string;
  flags: VFeatureFlag[];
}

export function FeatureWidget({ featureName, flags }: FeatureWidgetProps) {
  const defaultValue = flags.find((flag) => flag.user_id === null);
  const userValues = flags.filter((flag) => flag.user_id !== null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  userValues.sort((a, b) => a.user_id! - b.user_id!);
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="min-w-0 truncate font-mono text-sm font-medium text-foreground">
          {featureName}
        </h2>
        <div className="flex items-center gap-5">
          {defaultValue !== undefined ? (
            <FeatureToggle
              name="Default"
              checked={defaultValue.enabled}
              onCheckedChange={async (checked) => {
                const result = await updateFeatureFlag({
                  id: defaultValue.id,
                  enabled: checked,
                });
                if (result.success) {
                  toast({
                    title: "Feature flag updated",
                    description: `The default value for "${featureName}" is now *${
                      checked ? "on" : "off"
                    }*`,
                  });
                } else {
                  toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                  });
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Default
              </span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 font-normal text-muted-foreground"
                  >
                    None
                    <Edit size={13} />
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
              <Button variant="outline" size="sm">
                <span className="tabular-nums">{userValues.length}</span>
                &nbsp;user-level flag
                {userValues.length != 1 && "s"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <UserLevelFlagsContainer
                featureName={featureName}
                flags={userValues}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function AddDefaultFeatureFlagWidget({
  featureName,
  onChoice,
}: {
  featureName: string;
  onChoice?: () => void;
}) {
  const { toast } = useToast();
  const flag = { name: featureName, user_id: null };
  const saveDefaultFlag = async (enabled: boolean) => {
    const result = await createFeatureFlag({
      featureFlag: { ...flag, enabled },
    });
    if (result.success) {
      toast({
        title: "Default flag created",
        description: `The default value for "${featureName}" is now *${
          enabled ? "on" : "off"
        }*`,
      });
      if (onChoice) {
        onChoice();
      }
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
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
