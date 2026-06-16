"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VUser } from "@/types/db_types";
import { UserNameCell } from "./user-name-cell";
import { UserStatusCell } from "./user-status-cell";
import { UserRoleBadge } from "./user-badges";

export function getColumns(): ColumnDef<VUser>[] {
  return [
    {
      accessorKey: "name",
      header: () => <span className="px-2">Name</span>,
      cell: ({ row }) => <UserNameCell user={row.original} />,
    },
    {
      accessorKey: "deactivated_at",
      header: "Status",
      cell: ({ row }) => <UserStatusCell user={row.original} />,
    },
    {
      accessorKey: "is_admin",
      header: "Role",
      cell: ({ row }) => (
        <div className="px-2">
          <UserRoleBadge isAdmin={row.original.is_admin} />
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email && (
          <div
            className="px-2 truncate text-xs text-muted-foreground sm:text-sm"
            title={row.original.email}
          >
            {row.original.email}
          </div>
        ),
    },
  ];
}
