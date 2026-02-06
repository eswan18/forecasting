"use client";

import { useCurrentUser } from "./useCurrentUser";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

export function useUserTimezone(): string {
  const { user } = useCurrentUser();
  return user?.timezone ?? DEFAULT_TIMEZONE;
}
