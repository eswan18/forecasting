"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FeatureToggle } from "./feature-toggle";
import { VFeatureFlag, VUser } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { getUsers, updateFeatureFlag } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFeatureFlag } from "@/lib/db_actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UserLevelFlagsContainer(
  { flags, featureName }: { flags: VFeatureFlag[]; featureName: string },
) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const setFlagEnabled = async (flagId: number, enabled: boolean) => {
    await updateFeatureFlag({ id: flagId, enabled });
    toast({
      title: "Feature flag updated",
      description: `The feature flag is now *${enabled ? "on" : "off"}*`,
    });
  };
  const userIdsWithFlags = flags.map((flag) => flag.user_id).filter((id) =>
    id !== null
  );
  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag, index) => (
        <div key={flag.user_id} className="flex flex-col gap-2">
          {index > 0 && <Separator />}
          <div className="flex flex-row justify-between px-2">
            <span>{flag.user_id} ({flag.user_name})</span>
            <FeatureToggle
              checked={flag.enabled}
              onCheckedChange={(checked) =>
                setFlagEnabled(flag.id, checked)}
            />
          </div>
        </div>
      ))}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-3 mx-2 gap-x-2">
            Add User-Level Flag<CirclePlus />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User-level Flag</DialogTitle>
          </DialogHeader>
          <AddUserFeatureFlagWidget
            featureName={featureName}
            onChoice={() => setDialogOpen(false)}
            excludeUserIds={userIdsWithFlags}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddUserFeatureFlagWidget(
  { featureName, onChoice, excludeUserIds }: {
    featureName: string;
    onChoice?: () => void;
    excludeUserIds?: number[];
  },
) {
  const [users, setUsers] = useState<VUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<VUser | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    getUsers().then((result) => {
      if (result.success) {
        setUsers(result.data.filter((user) => !excludeUserIds?.includes(user.id)));
      } else {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    });
  }, [excludeUserIds, toast]);
  const saveUserFlag = async (enabled: boolean) => {
    if (!selectedUser) return;
    const featureFlag = {
      name: featureName,
      user_id: selectedUser.id,
      enabled,
    };
    await createFeatureFlag({ featureFlag }).then(() => {
      toast({
        title: "User-level flag created",
        description: `The user-level flag for "${featureName}" is now *${
          enabled ? "on" : "off"
        }* for user ${selectedUser.name}`,
      });
    });
    onChoice && onChoice();
  };
  return (
    <div className="flex flex-col gap-4 items-start">
      <Select
        value={selectedUser?.id.toString()}
        onValueChange={(userId) => {
          const user = users.find((u) => u.id === parseInt(userId));
          setSelectedUser(user || null);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users.length > 0 && (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <div className="flex flex-row gap-4 items-center">
        <Button variant="secondary" onClick={() => saveUserFlag(false)}>
          Off
        </Button>
        <Button variant="secondary" onClick={() => saveUserFlag(true)}>
          On
        </Button>
      </div>
    </div>
  );
}
