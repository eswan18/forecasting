"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VUser } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { UserNameCell } from "./user-name-cell";
import { UserStatusCell } from "./user-status-cell";

export function getColumns(): ColumnDef<VUser>[] {
  return [
    {
      accessorKey: "name",
      header: () => <div className="px-2">Name</div>,
      cell: ({ row }) => <UserNameCell user={row.original} />,
    },
    {
      accessorKey: "deactivated_at",
      header: "Status",
      cell: ({ row }) => <UserStatusCell user={row.original} />,
    },
    {
      accessorKey: "is_admin",
      header: "Admin",
      cell: ({ row }) => (
        <div className="px-2">
          {row.original.is_admin ? (
            <Badge variant="outline" className="text-xs">
              Admin
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">User</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email && (
          <div
            className="px-2 truncate text-xs sm:text-sm"
            title={row.original.email}
          >
            {row.original.email}
          </div>
        ),
    },
  ];
}
