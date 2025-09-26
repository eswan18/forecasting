"use client";

import useSWR from "swr";
import type { VUser } from "@/types/db_types";

const fetcher = async (url: string): Promise<VUser | null> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as VUser | null;
};

export function useCurrentUser() {
  const { data, isLoading, error, mutate } = useSWR<VUser | null>(
    "/api/me",
    fetcher,
  );
  return { user: data, isLoading, error, mutate };
}
