"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

type Invite = {
  id: number;
  token: string;
  used: boolean;
  notes: string | null;
  created_at: Date;
};

export function getColumns(): ColumnDef<Invite>[] {
  return [
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
    {
      accessorKey: "used",
      header: "Status",
      cell: ({ row }) => {
        const used = row.original.used;
        return (
          <div className="px-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={used ? "default" : "secondary"}
                className="text-xs"
              >
                {used ? "Used" : "Unused"}
              </Badge>
              {used ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-purple-500" />
              )}
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
          <div className="px-2">
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
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.created_at;
        return (
          <div className="px-2 text-xs sm:text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
  ];
}
