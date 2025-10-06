"use client";

import useSWR from "swr";
import type { VUser } from "@/types/db_types";
import { fetchJson, HttpError, isHttpError } from "@/lib/http";

async function fetchCurrentUser(): Promise<VUser | null> {
  try {
    const data = await fetchJson<{ user: VUser | null }>("/api/current-user", {
      cache: "no-store",
    });
    return data.user;
  } catch (error) {
    if (isHttpError(error) && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function useCurrentUser() {
  const { data, isLoading, error, mutate } = useSWR<VUser | null, HttpError>(
    "/api/current-user",
    fetchCurrentUser,
    {
      shouldRetryOnError: false,
    },
  );

  return {
    user: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
