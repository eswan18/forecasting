"use client";

import Link from "next/link";
import { MoreVertical, Plus, Settings, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CompetitionHeaderProps {
  competitionId: number;
  competitionName: string;
  isPrivate: boolean;
  isAdmin: boolean;
  memberCount?: number; // Only for private competitions
  forecasterCount?: number; // For public competitions
  onAddProp?: () => void;
}

export function CompetitionHeader({
  competitionId,
  competitionName,
  isPrivate,
  isAdmin,
  memberCount,
  forecasterCount,
  onAddProp,
}: CompetitionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {competitionName}
          </h1>
          {isPrivate && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-0"
            >
              Private
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isPrivate && memberCount !== undefined
            ? `${memberCount} members`
            : forecasterCount !== undefined
              ? `${forecasterCount} forecasters`
              : null}
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          {onAddProp && (
            <Button onClick={onAddProp} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Prop
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPrivate && (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/competitions/${competitionId}/members`}
                      className="flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/competitions/${competitionId}/members`}
                      className="flex items-center"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/competitions`}
                  className="flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Competition Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
