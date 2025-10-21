"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Trash } from "lucide-react";
import { InviteToken } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteInviteToken } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function getColumns(): ColumnDef<InviteToken>[] {
  return [
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.created_at;
        return (
          <div className="text-xs sm:text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "used_at",
      header: "Status",
      cell: ({ row }) => {
        const used = row.original.used_at !== null;
        return (
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={used ? "outline" : "default"} className="text-xs">
                {used ? "Used" : "Unused"}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <div>
            {notes ? (
              <span className="text-xs sm:text-sm">{notes}</span>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground italic">
                No notes
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "token",
      header: () => <div className="px-2">Token</div>,
      cell: ({ row }) => (
        <TokenActionsCell
          token={row.original.token}
          id={row.original.id}
          used={row.original.used_at !== null}
        />
      ),
    },
  ];
}

function TokenActionsCell({
  token,
  id,
  used,
}: {
  token: string;
  id: number;
  used: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const abbreviatedToken = token.substring(0, 8) + "...";

  const makeInviteLink = (code: string) => {
    if (!code) return "";
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}/register?token=${code}`;
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = makeInviteLink(token);
    await navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "The invite link has been copied to your clipboard.",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInviteToken({ id });
      handleServerActionResult(result);
      toast({
        title: "Invite deleted",
        description: "The invite token has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invite token.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="px-2 flex items-center gap-2">
        <code
          className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded"
          title={token}
        >
          {abbreviatedToken}
        </code>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyInviteLink}
          className="h-6 w-6 p-0"
          title="Copy invite link"
        >
          <Clipboard className="h-3 w-3" />
        </Button>
        {!used && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Delete invite"
          >
            <Trash className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invite Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invite token? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
