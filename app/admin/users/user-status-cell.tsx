"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { setUserActive } from "@/lib/db_actions/users";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { VUser } from "@/types/db_types";

interface UserStatusCellProps {
  user: VUser;
}

export function UserStatusCell({ user }: UserStatusCellProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isActive = user.deactivated_at === null;

  const handleStatusChange = async () => {
    setIsLoading(true);
    try {
      const result = await setUserActive({
        userId: user.id,
        active: !isActive, // Toggle the current status
      });
      const updatedUser = handleServerActionResult(result);

      toast({
        title: "Success",
        description: `User ${updatedUser.name} has been ${!isActive ? "activated" : "deactivated"}`,
      });

      // Close the dialog
      setIsDialogOpen(false);

      // No need to manually refresh - revalidatePath handles it
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-2">
      <div className="flex flex-row gap-x-1 sm:gap-x-2 items-center">
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
          {isActive ? "Active" : "Inactive"}
        </Badge>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-5 w-5 p-0 flex-shrink-0"
              disabled={isLoading}
            >
              {isActive ? (
                <UserX className="h-3 w-3" />
              ) : (
                <UserCheck className="h-3 w-3" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isActive ? "Deactivate User?" : "Activate User?"}
              </DialogTitle>
              <DialogDescription>
                {isActive
                  ? `Are you sure you want to deactivate ${user.name}? They will no longer be able to access the system.`
                  : `Are you sure you want to activate ${user.name}? They will regain access to the system.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading
                  ? "Updating..."
                  : isActive
                    ? "Deactivate"
                    : "Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
