"use client";

import { formatDate, formatDateTime } from "@/lib/time-utils";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";

interface LocalDateProps {
  date: Date;
  includeTime?: boolean;
}

export function LocalDate({ date, includeTime = false }: LocalDateProps) {
  const timezone = getBrowserTimezone();
  return <>{includeTime ? formatDateTime(date, timezone) : formatDate(date, timezone)}</>;
}
