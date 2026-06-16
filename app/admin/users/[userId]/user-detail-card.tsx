"use client";

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
import { Copy, User, UserCheck, UserX } from "lucide-react";
import { setUserActive } from "@/lib/db_actions/users";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { formatDate, formatDateTime } from "@/lib/time-utils";
import { startImpersonation } from "@/lib/auth/impersonation";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserRoleBadge, UserStatusBadge } from "../user-badges";

interface UserDetailCardProps {
  user: VUser;
}

/** A label/value row inside the details panel. Label is a mono kicker. */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-2 text-sm">
        {children}
      </div>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 shrink-0 p-0 text-muted-foreground"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast({ title: "Copied", description: `${label} copied to clipboard` });
      }}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

export default function UserDetailCard({ user }: UserDetailCardProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timezone = getBrowserTimezone();
  const isActive = user.deactivated_at === null;
  const canImpersonate = !user.is_admin && isActive;

  const handleStatusChange = async () => {
    setIsLoading(true);
    try {
      const result = await setUserActive({
        userId: user.id,
        active: !isActive,
      });
      const updatedUser = handleServerActionResult(result);

      toast({
        title: "Success",
        description: `User ${updatedUser.name} has been ${!isActive ? "activated" : "deactivated"}`,
      });

      setIsStatusDialogOpen(false);
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

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await startImpersonation(user.id);
      if (result.success) {
        toast({
          title: "Impersonating",
          description: `Now viewing as ${user.name}`,
        });
        setIsImpersonateDialogOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
        {user.picture_url ? (
          <Image
            src={user.picture_url}
            alt={`${user.name}'s avatar`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted text-xl font-medium text-foreground">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {user.name}
          </h2>
          {user.email && (
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <UserRoleBadge isAdmin={user.is_admin} />
            <UserStatusBadge active={isActive} />
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3 sm:px-5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Account Details
          </span>
        </div>
        <div className="divide-y">
          <DetailRow label="Username">
            {user.username ? (
              <>
                <span className="truncate">{user.username}</span>
                <CopyButton value={user.username} label="Username" />
              </>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </DetailRow>

          <DetailRow label="Email">
            <span className="truncate">{user.email || "None"}</span>
          </DetailRow>

          <DetailRow label="Photo">
            {user.picture_url ? (
              <a
                href={user.picture_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary hover:underline"
              >
                {user.picture_url}
              </a>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </DetailRow>

          <DetailRow label="Created">
            <span className="font-mono tabular-nums">
              {formatDate(new Date(user.created_at), timezone)}
            </span>
          </DetailRow>

          <DetailRow label="Updated">
            <span className="font-mono tabular-nums">
              {formatDate(new Date(user.updated_at), timezone)}
            </span>
          </DetailRow>

          {!isActive && user.deactivated_at && (
            <DetailRow label="Deactivated">
              <span className="font-mono tabular-nums">
                {formatDateTime(new Date(user.deactivated_at), timezone)}
              </span>
            </DetailRow>
          )}

          <DetailRow label="User ID">
            <span className="font-mono tabular-nums">{user.id}</span>
            <CopyButton value={user.id.toString()} label="User ID" />
          </DetailRow>

          <DetailRow label="IDP User ID">
            {user.idp_user_id ? (
              <>
                <span className="truncate font-mono">{user.idp_user_id}</span>
                <CopyButton value={user.idp_user_id} label="IDP User ID" />
              </>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </DetailRow>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canImpersonate && (
          <Dialog
            open={isImpersonateDialogOpen}
            onOpenChange={setIsImpersonateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <User className="mr-2 h-4 w-4" />
                Impersonate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Impersonate User?</DialogTitle>
                <DialogDescription>
                  You will view the app as {user.name}. Your admin session
                  remains active - click &quot;Stop Impersonating&quot; in the
                  banner to return to your own view.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsImpersonateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleImpersonate} disabled={isLoading}>
                  {isLoading ? "Starting..." : "Impersonate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={isActive ? "destructive" : "outline"}
              size="sm"
              disabled={isLoading}
            >
              {isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={isLoading}>
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
