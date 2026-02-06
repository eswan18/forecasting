"use client";

import { VUser } from "@/types/db_types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Copy, Shield, User, UserCheck, UserX } from "lucide-react";
import { setUserActive } from "@/lib/db_actions/users";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { formatDate, formatDateTime } from "@/lib/time-utils";
import { startImpersonation } from "@/lib/auth/impersonation";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserDetailCardProps {
  user: VUser;
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
    <div className="flex flex-col items-center">
      {/* Avatar above card */}
      {user.picture_url && (
        <div className="mb-4">
          <Image
            src={user.picture_url}
            alt={`${user.name}'s avatar`}
            width={144}
            height={144}
            className="rounded-full object-cover border-4 border-background shadow-lg"
          />
        </div>
      )}

      <Card className="w-full">
        <CardHeader className="flex flex-row">
          {/* Badges at top */}
          {user.is_admin ? (
            <Badge variant="default" className="bg-red-100 text-red-800">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          ) : (
            <Badge variant="secondary">Regular User</Badge>
          )}
          <Badge
            className={
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
            variant="outline"
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Username
              </span>
              <div className="flex items-center gap-2">
                {user.username ? (
                  <>
                    <span className="text-sm">{user.username}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(user.username!);
                        toast({
                          title: "Copied",
                          description: "Username copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Email
              </span>
              <span className="text-sm">{user.email || "None"}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Photo
              </span>
              {user.picture_url ? (
                <a
                  href={user.picture_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate max-w-48"
                >
                  {user.picture_url}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Created
              </span>
              <span className="text-sm">
                {formatDate(new Date(user.created_at), timezone)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Updated
              </span>
              <span className="text-sm">
                {formatDate(new Date(user.updated_at), timezone)}
              </span>
            </div>

            {!isActive && user.deactivated_at && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Deactivated
                </span>
                <span className="text-sm">
                  {formatDateTime(new Date(user.deactivated_at), timezone)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                User ID
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {user.id}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(user.id.toString());
                    toast({
                      title: "Copied",
                      description: "User ID copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                IDP User ID
              </span>
              <div className="flex items-center gap-2">
                {user.idp_user_id ? (
                  <>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-48">
                      {user.idp_user_id}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(user.idp_user_id!);
                        toast({
                          title: "Copied",
                          description: "IDP User ID copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>

          </div>
        </CardContent>

      {/* Actions Section */}
      <CardFooter className="flex flex-row gap-4 justify-center mt-10">
        {canImpersonate && (
          <Dialog
            open={isImpersonateDialogOpen}
            onOpenChange={setIsImpersonateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <User className="h-4 w-4 mr-2" />
                Impersonate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Impersonate User?</DialogTitle>
                <DialogDescription>
                  You will view the app as {user.name}. Your admin session
                  remains active - click &quot;Stop Impersonating&quot; in
                  the banner to return to your own view.
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

        <Dialog
          open={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant={isActive ? "destructive" : "outline"}
              size="sm"
              disabled={isLoading}
            >
              {isActive ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
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
      </CardFooter>
      </Card>
    </div>
  );
}
