"use client";

import { formatDate, formatDateTime } from "@/lib/time-utils";
import { useUserTimezone } from "@/hooks/useUserTimezone";

interface LocalDateProps {
  date: Date;
  includeTime?: boolean;
}

export function LocalDate({ date, includeTime = false }: LocalDateProps) {
  const timezone = useUserTimezone();
  return <>{includeTime ? formatDateTime(date, timezone) : formatDate(date, timezone)}</>;
}
