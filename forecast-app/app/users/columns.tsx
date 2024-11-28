"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VUser } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { loginViaImpersonation } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { redirect } from "next/navigation";

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
    cell: ({ row }) => {
      const username = row.original.username;
      if (!username) {
        return null;
      }
      const { mutate } = useCurrentUser();
      const handleImpersonate = async () => {
        await loginViaImpersonation(username).then(async () => {
          await mutate();
        }).then(() => {
          redirect("/");
        });
      };
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost">{username}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonate User?</DialogTitle>
              <DialogDescription>
                Impersonating this user will log you out of your current
                session. You will remain logged in as the impersonated user
                until logging out.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleImpersonate}>Impersonate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    },
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
