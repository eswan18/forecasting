"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/logout-button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { User2 } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function UserStatus() {
  const { user, loading, error } = useCurrentUser();
  const loggedIn = user && !loading && !error;
  return (
    <div className="lg:w-48 flex justify-end items-end gap-2 pb-1">
      {loggedIn
        ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-end gap-2 text-sm">
                <User2 size={22} className="pb-0.5" />
                <span className="hidden lg:inline">{user.user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="lg:hidden">
                  Logged in as {user.user.name}
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <LogoutButton />
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
