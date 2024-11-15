"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VUser } from "@/types/db_types";

export const columns: ColumnDef<VUser>[] = [
  {
    accessorKey: "login_id",
    header: "Login ID",
  },
  {
    accessorKey: "id",
    header: "User ID",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "is_admin",
    header: "Admin",
    cell: ({ row }) => row.original.is_admin && "Y",
  },
  {
    accessorKey: "is_salted",
    header: "Salted",
    cell: ({ row }) => row.original.is_salted && "Y",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) =>
      row.original.email && <div className="text-xs">{row.original.email}</div>,
  },
];
