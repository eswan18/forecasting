"use client";

import { VUser } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, User, Mail, Shield, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { setUserActive } from "@/lib/db_actions/users";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface UserDetailCardProps {
  user: VUser;
}

export default function UserDetailCard({ user }: UserDetailCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isActive = user.deactivated_at === null;
  const statusColor = isActive
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
  const statusText = isActive ? "Active" : "Inactive";

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
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* Main user card */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.username
                  ? user.username.charAt(0).toUpperCase()
                  : user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  {user.username || "<no username>"}
                </CardTitle>
                <p className="text-muted-foreground text-lg">{user.name}</p>
              </div>
            </div>
            <Badge
              className={`px-4 py-2 text-sm font-medium ${statusColor}`}
              variant="outline"
            >
              {statusText}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info Card */}
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      User ID
                    </span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {user.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Login ID
                    </span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {user.login_id || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Username
                    </span>
                    <span className="text-sm">
                      {user.username || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Admin Status
                    </span>
                    {user.is_admin ? (
                      <Badge
                        variant="default"
                        className="bg-red-100 text-red-800"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Regular User</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Status Card */}
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact & Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Email
                    </span>
                    <span className="text-sm">
                      {user.email || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                        variant="outline"
                      >
                        {statusText}
                      </Badge>
                      <Dialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            disabled={isLoading}
                          >
                            {isActive ? (
                              <UserX className="h-3 w-3" />
                            ) : (
                              <UserCheck className="h-3 w-3" />
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
                                ? `Are you sure you want to deactivate ${user.username || user.name}? They will no longer be able to access the system.`
                                : `Are you sure you want to activate ${user.username || user.name}? They will regain access to the system.`}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              onClick={handleStatusChange}
                              disabled={isLoading}
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
                  {!isActive && user.deactivated_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Deactivated
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(user.deactivated_at),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
