'use client';

import LogoutButton from "@/components/logout-button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { User2 } from "lucide-react";

export function UserStatus() {
  const { user, loading, error } = useCurrentUser();
  const loggedIn = user && !loading && !error;
  return (
    <div className="flex justify-center items-center gap-2 w-48 border">
      <User2 size={24} />
      {loggedIn ?
        <>
          <span className="text-sm">{user.user.name}</span>
          <LogoutButton />
        </> : loading ? <span>Loading...</span> : <a href="/login">Login</a>}
    </div>
  );
}