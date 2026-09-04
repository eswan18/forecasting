"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { startImpersonation } from "@/lib/auth/impersonation";
import { setUserActive } from "@/lib/db_actions/users";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { VUser } from "@/types/db_types";

/**
 * Everything an admin can do to one account, behind the row's own mark.
 *
 * The roster used to carry two icon buttons in two different columns — one to
 * impersonate, one to toggle access. Both are the same kind of thing (an act
 * on this account) and neither is a fact about the account, so they moved into
 * the one menu the members roster already uses, and the columns went back to
 * carrying only what they name.
 *
 * The confirmations stay as they were: shadcn dialogs, same words, same
 * consequences. Because the menu unmounts when an item is chosen, each dialog
 * is opened from state rather than from a trigger inside the menu.
 */
export function UserActionsCell({ user }: { user: VUser }) {
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isActive = user.deactivated_at === null;
  // Unchanged from the icon-button era: there is nothing to see as an admin,
  // and a deactivated account cannot be signed in as.
  const canImpersonate = !user.is_admin && isActive;

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await startImpersonation(user.id);
      if (result.success) {
        toast({
          title: "Impersonating",
          description: `Now viewing as ${user.name}`,
        });
        setImpersonateOpen(false);
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to impersonate user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to impersonate user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      // No need to manually refresh - revalidatePath handles it
      setStatusOpen(false);
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
    <span className="rowact">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="menu"
            disabled={isLoading}
            aria-label={`Manage ${user.name}`}
          >
            {isLoading ? "·" : "⋯"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* The menu opens at the right edge of the column, a good way from
              the name it acts on, and both its items are verbs with no subject.
              It says whose account it is before it offers to deactivate it. */}
          <DropdownMenuLabel className="riso-menu-heading">
            {user.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="riso-menu-sep" />
          {canImpersonate && (
            <>
              <DropdownMenuItem onClick={() => setImpersonateOpen(true)}>
                Impersonate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="riso-menu-sep" />
            </>
          )}
          <DropdownMenuItem
            className={isActive ? "danger" : undefined}
            onClick={() => setStatusOpen(true)}
          >
            {isActive ? "Deactivate account" : "Activate account"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Impersonate User?</DialogTitle>
            <DialogDescription>
              You will view the app as {user.name}. Your admin session remains
              active - click &quot;Stop Impersonating&quot; in the banner to
              return to your own view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="hxf">
            <button
              type="button"
              className="quit"
              onClick={() => setImpersonateOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="submit"
              onClick={handleImpersonate}
              disabled={isLoading}
            >
              {isLoading ? "Starting…" : "Impersonate"}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
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
          <DialogFooter className="hxf">
            <button
              type="button"
              className="quit"
              onClick={() => setStatusOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            {/* Deactivating takes someone's access away, so it is the second
                ink, like every other undoing on these sheets. */}
            <button
              type="button"
              className={isActive ? "submit danger" : "submit"}
              onClick={handleStatusChange}
              disabled={isLoading}
            >
              {isLoading ? "Updating…" : isActive ? "Deactivate" : "Activate"}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
}
