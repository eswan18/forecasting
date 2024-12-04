"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LogOut, Settings, User2, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useLogout } from "@/hooks/useLogout";

export function UserStatus() {
  const { user, isLoading, error } = useCurrentUser();
  const loggedIn = user && !isLoading && !error;
  const logout = useLogout("/login");
  return (
    <div className="lg:w-48 flex justify-end items-end gap-2 pb-1">
      {loggedIn
        ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {user.is_admin ? <UserRoundPen /> : <User2 size={20} />}{" "}
                  {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  {user.name} {user.is_admin ? "(Admin)" : ""}
                </DropdownMenuLabel>
                <Link href="/account">
                  <DropdownMenuItem className="px-4">
                    <Settings size={14} className="mr-2" />
                    <span>Account</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={logout} className="px-4">
                  <LogOut size={14} className="mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )
        : isLoading
        ? <Button disabled variant="outline">Loading...</Button>
        : (
          <Link href="/login">
            <Button>Log in</Button>
          </Link>
        )}
    </div>
  );
}
