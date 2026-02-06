const DEFAULT_TIMEZONE = "UTC";

/**
 * Format a date for display (date only)
 * Uses browser locale for proper internationalization
 */
export function formatDate(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

/**
 * Format a full datetime for tooltips
 * Uses browser locale for proper internationalization with 24-hour time
 */
export function formatDateTime(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateStr = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date);

  const timeStr = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);

  // Get the timezone abbreviation (e.g., EST, PST, UTC)
  const tzAbbr = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
    timeZone: timezone,
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value ?? timezone;

  return `${dateStr} at ${timeStr} ${tzAbbr}`;
}
