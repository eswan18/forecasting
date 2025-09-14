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
    <div className="flex items-center">
      {loggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              {user.is_admin ? (
                <UserRoundPen className="h-4 w-4" />
              ) : (
                <User2 className="h-4 w-4" />
              )}
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.is_admin ? "Administrator" : "User"}
                </p>
              </div>
            </DropdownMenuLabel>
            <Link href="/account">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : isLoading ? (
        <Button disabled variant="outline" size="sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="sr-only">Loading...</span>
        </Button>
      ) : (
        <Link href="/login">
          <Button size="sm">Log in</Button>
        </Link>
      )}
    </div>
  );
}
