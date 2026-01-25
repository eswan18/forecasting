"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersTable, InviteMemberDialog } from "@/components/members";
import type { VCompetitionMember } from "@/types/db_types";

interface MembersPageContentProps {
  members: VCompetitionMember[];
  competitionId: number;
  currentUserId: number;
}

export function MembersPageContent({
  members,
  competitionId,
  currentUserId,
}: MembersPageContentProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Manage who has access to this private competition.
        </p>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <MembersTable
        members={members}
        competitionId={competitionId}
        currentUserId={currentUserId}
        isAdmin={true}
      />

      <InviteMemberDialog
        competitionId={competitionId}
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </div>
  );
}
