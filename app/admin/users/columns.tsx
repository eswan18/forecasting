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
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function getColumns({
  mutateUser,
}: {
  mutateUser: () => void;
}): ColumnDef<VUser>[] {
  return [
    {
      accessorKey: "username",
      header: () => <div className="px-2">Username</div>,
      cell: ({ row }) => {
        const username = row.original.username;
        const name = row.original.name;
        const handleImpersonate = username
          ? async () => {
              await loginViaImpersonation(username)
                .then(async () => {
                  mutateUser();
                })
                .then(() => {
                  redirect("/");
                });
            }
          : null;
        // Admins have a little badge next to their name; everyone else has an "Impersonate" button.
        const button = row.original.is_admin ? (
          <Badge variant="outline">Admin</Badge>
        ) : (
          handleImpersonate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="h-5 text-[0.6rem]">
                  Impersonate
                </Button>
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
          )
        );
        return (
          <div className="px-2">
            <div className="flex flex-row gap-x-2 items-center text-lg">
              {username ? (
                <p>{username}</p>
              ) : (
                <p className="text-muted-foreground">&lt;no username&gt;</p>
              )}
              {button}
            </div>
            <div className="text-sm text-muted-foreground">{name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email && <div>{row.original.email}</div>,
    },
    {
      accessorKey: "login_id",
      header: "Login",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.login_id}</div>
      ),
    },
    {
      accessorKey: "id",
      header: "User",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.id}</div>
      ),
    },
  ];
}
