"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Shield, User, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";
import {
  removeCompetitionMember,
  updateMemberRole,
  type CompetitionRole,
} from "@/lib/db_actions/competition-members";
import type { VCompetitionMember } from "@/types/db_types";
import { cn } from "@/lib/utils";

interface MembersTableProps {
  members: VCompetitionMember[];
  competitionId: number;
  currentUserId: number;
  isAdmin: boolean;
}

function RoleBadge({ role }: { role: CompetitionRole }) {
  if (role === "admin") {
    return (
      <Badge
        variant="secondary"
        className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
      >
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <User className="h-3 w-3 mr-1" />
      Forecaster
    </Badge>
  );
}

interface MemberRowProps {
  member: VCompetitionMember;
  competitionId: number;
  currentUserId: number;
  isAdmin: boolean;
  isOnlyAdmin: boolean;
}

function MemberRow({
  member,
  competitionId,
  currentUserId,
  isAdmin,
  isOnlyAdmin,
}: MemberRowProps) {
  const router = useRouter();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const canManage = isAdmin && !isCurrentUser;
  const isMemberAdmin = member.role === "admin";

  const handleSuccess = () => {
    router.refresh();
  };

  const removeMemberAction = useServerAction(removeCompetitionMember, {
    successMessage: "Member removed",
    onSuccess: handleSuccess,
  });

  const updateRoleAction = useServerAction(updateMemberRole, {
    successMessage: "Role updated",
    onSuccess: handleSuccess,
  });

  const handleRemove = async () => {
    await removeMemberAction.execute({
      competitionId,
      userId: member.user_id,
    });
    setShowRemoveDialog(false);
  };

  const handleRoleChange = async (newRole: CompetitionRole) => {
    await updateRoleAction.execute({
      competitionId,
      userId: member.user_id,
      newRole,
    });
  };

  const isLoading = removeMemberAction.isLoading || updateRoleAction.isLoading;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
          isCurrentUser && "bg-primary/5",
        )}
      >
        {/* Avatar / Initial */}
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium shrink-0">
          {member.user_name.charAt(0).toUpperCase()}
        </div>

        {/* Name and email */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground flex items-center gap-2">
            {member.user_name}
            {isCurrentUser && (
              <span className="text-xs text-muted-foreground">(you)</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {member.user_email}
          </div>
        </div>

        {/* Role badge */}
        <div className="shrink-0">
          <RoleBadge role={member.role} />
        </div>

        {/* Actions */}
        {canManage && (
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  {isLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isMemberAdmin ? (
                  <DropdownMenuItem
                    onClick={() => handleRoleChange("forecaster")}
                    disabled={isOnlyAdmin}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Demote to Forecaster
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleRoleChange("admin")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Promote to Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-destructive focus:text-destructive"
                  disabled={isMemberAdmin && isOnlyAdmin}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.user_name} from this
              competition? They will lose access to all competition content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberAction.isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMemberAction.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberAction.isLoading && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function MembersTable({
  members,
  competitionId,
  currentUserId,
  isAdmin,
}: MembersTableProps) {
  // Count admins to prevent removing the last one
  const adminCount = members.filter((m) => m.role === "admin").length;
  const isOnlyAdmin = adminCount <= 1;

  if (members.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No members yet</p>
      </div>
    );
  }

  // Sort: admins first, then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return a.user_name.localeCompare(b.user_name);
  });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-sm font-medium text-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
      <div className="divide-y divide-border">
        {sortedMembers.map((member) => (
          <MemberRow
            key={member.membership_id}
            member={member}
            competitionId={competitionId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isOnlyAdmin={isOnlyAdmin}
          />
        ))}
      </div>
    </div>
  );
}
