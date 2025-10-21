/**
 * Format a date for display (date only)
 * Uses browser locale for proper internationalization
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Format a full datetime for tooltips
 * Uses browser locale for proper internationalization with 24-hour time
 */
export function formatDateTime(date: Date): string {
  const dateStr = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

  return `${dateStr} at ${timeStr} UTC`;
}
