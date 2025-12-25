"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VPasswordResetToken } from "@/types/db_types";

function TokenActionsCell({
  token,
  username,
}: {
  token: string;
  username: string | null;
}) {
  const { toast } = useToast();
  const abbreviatedToken = token.substring(0, 8) + "...";

  const makeResetLink = (resetToken: string, user: string | null) => {
    if (!resetToken || !user) return "";
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}/reset-password?username=${user}&token=${resetToken}`;
  };

  const handleCopyResetLink = async () => {
    const resetLink = makeResetLink(token, username);
    if (!resetLink) {
      toast({
        title: "Error",
        description: "Cannot create reset link without username.",
        variant: "destructive",
      });
      return;
    }
    await navigator.clipboard.writeText(resetLink);
    toast({
      title: "Link copied!",
      description: "The password reset link has been copied to your clipboard.",
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
        onClick={handleCopyResetLink}
        className="h-6 w-6 p-0"
        title="Copy password reset link"
      >
        <Clipboard className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function getColumns(): ColumnDef<VPasswordResetToken>[] {
  return [
    {
      accessorKey: "initiated_at",
      header: "Initiated",
      cell: ({ row }) => {
        const date = row.original.initiated_at;
        return (
          <div className="text-xs sm:text-sm text-muted-foreground">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        );
      },
    },
    {
      accessorKey: "expires_at",
      header: "Expires",
      cell: ({ row }) => {
        const date = row.original.expires_at;
        const now = new Date();
        const expired = date < now;
        return (
          <div className="flex flex-col gap-1">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </div>
            <Badge
              variant={expired ? "destructive" : "outline"}
              className="text-xs w-fit"
            >
              {expired ? "Expired" : "Active"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => {
        const username = row.original.username;
        const name = row.original.name;
        return (
          <div className="flex flex-col gap-1">
            <div className="text-xs sm:text-sm font-medium font-mono">
              {username || "—"}
            </div>
            <div className="text-xs text-muted-foreground">{name || "—"}</div>
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
          username={row.original.username}
        />
      ),
    },
  ];
}
