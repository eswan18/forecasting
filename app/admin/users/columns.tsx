"use client";

import { ColumnDef } from "@tanstack/react-table";

import { VUser } from "@/types/db_types";

import type { UsersTableFeatures } from "./table-features";
import { UserActionsCell } from "./user-actions-cell";
import { UserNameCell } from "./user-name-cell";
import { UserAccessMark, UserRoleMark } from "./user-badges";

/**
 * The ledger's four columns.
 *
 * Every cell renders exactly one element, because the roster is one CSS grid
 * for the whole page rather than a stack of rows: the cells are handed
 * straight to that grid so a mark in the Role column sits under the mark above
 * it all the way down. The email that used to have a column of its own now
 * sits under the name it belongs to, the way the members roster sets it, and
 * the search reads both.
 */
export function getColumns(): ColumnDef<UsersTableFeatures, VUser>[] {
  return [
    {
      id: "account",
      accessorFn: (user) => user.name,
      header: "Account",
      // The one search box filters this column, but an admin looking for
      // someone types either half of what they know, so the address counts as
      // part of the account.
      filterFn: (row, _columnId, filterValue) => {
        const needle = String(filterValue).trim().toLowerCase();
        if (!needle) return true;
        const user = row.original;
        return (
          user.name.toLowerCase().includes(needle) ||
          (user.email?.toLowerCase().includes(needle) ?? false)
        );
      },
      cell: ({ row }) => <UserNameCell user={row.original} />,
    },
    {
      id: "role",
      // Sorted on the fact, not on the word: the cell prints nothing at all
      // for the four rows in five that are not admins.
      accessorFn: (user) => (user.is_admin ? 1 : 0),
      header: "Role",
      // The exception is what anyone sorts this column to find, so one click
      // brings it to the top rather than burying it.
      sortDescFirst: true,
      cell: ({ row }) => (
        <span className="role">
          <UserRoleMark isAdmin={row.original.is_admin} />
        </span>
      ),
    },
    {
      id: "access",
      accessorFn: (user) => (user.deactivated_at === null ? 0 : 1),
      header: "Access",
      sortDescFirst: true,
      cell: ({ row }) => (
        <span className="access">
          <UserAccessMark active={row.original.deactivated_at === null} />
        </span>
      ),
    },
    {
      id: "act",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <UserActionsCell user={row.original} />,
    },
  ];
}
