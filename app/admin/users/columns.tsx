"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VUser } from "@/types/db_types";
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
import { ExternalLink, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { setUserActive } from "@/lib/db_actions/users";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function getColumns({
  mutateUser,
}: {
  mutateUser: () => void;
}): ColumnDef<VUser>[] {
  return [
    {
      accessorKey: "username",
      header: () => <div className="px-2">Username</div>,
      cell: ({ row }) => {
        const username = row.original.username;
        const name = row.original.name;
        return (
          <div className="px-2">
            <div className="flex flex-row gap-x-1 sm:gap-x-2 items-center text-sm sm:text-lg">
              <div className="flex items-center gap-x-1 min-w-0 flex-1">
                <Link
                  href={`/admin/users/${row.original.id}`}
                  className="flex items-center gap-x-1 hover:text-primary transition-colors min-w-0"
                >
                  {username ? (
                    <span className="truncate">{username}</span>
                  ) : (
                    <span className="text-muted-foreground truncate">
                      &lt;no username&gt;
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </Link>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              {name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "deactivated_at",
      header: "Status",
      cell: ({ row }) => <UserStatusCell user={row.original} />,
    },
    {
      accessorKey: "is_admin",
      header: "Admin",
      cell: ({ row }) => (
        <div className="px-2">
          {row.original.is_admin ? (
            <Badge variant="outline" className="text-xs">
              Admin
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">User</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email && (
          <div
            className="px-2 truncate text-xs sm:text-sm"
            title={row.original.email}
          >
            {row.original.email}
          </div>
        ),
    },
  ];
}

function UserStatusCell({ user }: { user: VUser }) {
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
                  ? `Are you sure you want to deactivate ${user.username || user.name}? They will no longer be able to access the system.`
                  : `Are you sure you want to activate ${user.username || user.name}? They will regain access to the system.`}
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
