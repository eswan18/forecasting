"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "@/components/logout-button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { User2, UserCircle, UserRoundPen } from "lucide-react";
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
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  {user.is_admin ? <UserRoundPen /> : <User2 />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="lg:hidden">
                  Logged in as {user.name}
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
