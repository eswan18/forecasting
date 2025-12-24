"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PasswordReset } from "@/types/db_types";

export function getColumns(): ColumnDef<PasswordReset>[] {
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
            <Badge variant={expired ? "destructive" : "outline"} className="text-xs w-fit">
              {expired ? "Expired" : "Active"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "login_id",
      header: "Login ID",
      cell: ({ row }) => {
        const loginId = row.original.login_id;
        return (
          <div className="text-xs sm:text-sm font-mono">
            {loginId}
          </div>
        );
      },
    },
    {
      accessorKey: "token",
      header: () => <div className="px-2">Token</div>,
      cell: ({ row }) => {
        const token = row.original.token;
        const abbreviatedToken = token.substring(0, 8) + "...";
        return (
          <div className="px-2">
            <code
              className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded"
              title={token}
            >
              {abbreviatedToken}
            </code>
          </div>
        );
      },
    },
  ];
}
