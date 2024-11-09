"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LogOut, User2, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useLogout } from "@/hooks/useLogout";

export function UserStatus() {
  const { user, loading, error } = useCurrentUser();
  const logout = useLogout("/login");
  const loggedIn = user && !loading && !error;
  return (
    <div className="lg:w-48 flex justify-end items-end gap-2 pb-1">
      {loggedIn
        ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {user.is_admin ? <UserRoundPen /> : <User2 size={20} />} {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  {user.name} {user.is_admin ? "(Admin)" : ""}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={logout}>
                  <LogOut size={14} className="mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )
        : loading
        ? <span>Loading...</span>
        : (
          <Link href="/login">
            <Button>Log in</Button>
          </Link>
        )}
    </div>
  );
}
