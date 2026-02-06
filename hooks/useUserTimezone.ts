"use client";

const DEFAULT_TIMEZONE = "UTC";

export function useUserTimezone(): string {
  if (typeof window === "undefined") return DEFAULT_TIMEZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
