"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";

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
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const competitionForForm = {
    id: competitionId,
    name: competitionName,
    is_private: isPrivate,
    forecasts_open_date: null,
    forecasts_close_date: null,
    end_date: null,
  };

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
              {isPrivate ? (
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Competition Settings
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/competitions"
                    className="flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Competition Settings
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogTitle>Edit Competition</DialogTitle>
              <CreateEditCompetitionForm
                initialCompetition={competitionForForm}
                onSubmit={() => {
                  setEditOpen(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
