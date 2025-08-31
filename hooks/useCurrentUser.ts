"use client";

import { getUserFromCookies } from "@/lib/get-user";
import useSWR from "swr";

export function useCurrentUser() {
  const { data, isLoading, error, mutate } = useSWR(
    "currentUser",
    getUserFromCookies,
  );
  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}
