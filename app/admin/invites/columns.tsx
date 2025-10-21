"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clipboard } from "lucide-react";
import { InviteToken } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
      cell: ({ row }) => <TokenCell token={row.original.token} />,
    },
  ];
}

function TokenCell({ token }: { token: string }) {
  const { toast } = useToast();
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

  return (
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
    </div>
  );
}
