"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { InviteToken } from "@/types/db_types";

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
