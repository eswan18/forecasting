/**
 * Prop status utilities
 *
 * This module provides centralized logic for determining prop lifecycle status
 * based on deadlines and resolution state.
 */

export type PropStatus =
  | "open" // Can still forecast
  | "closed" // Past deadline, awaiting resolution
  | "resolved-yes" // Resolved as true
  | "resolved-no"; // Resolved as false

export interface PropStatusOptions {
  /** Current date for testing (default: new Date()) */
  currentDate?: Date;
}

/**
 * Get the status of a prop based on its deadline and resolution
 *
 * @param closeDate - The deadline for forecasts (forecasts_due_date for private, competition_forecasts_close_date for public)
 * @param resolution - The resolution value (null if unresolved, true/false if resolved)
 * @param options - Optional configuration
 * @returns The prop status
 *
 * @example
 * // Open prop with no deadline
 * getPropStatus(null, null) // "open"
 *
 * // Prop closing in 12 hours
 * const soon = new Date(Date.now() + 12 * 60 * 60 * 1000);
 * getPropStatus(soon, null) // "closing-soon"
 *
 * // Resolved prop
 * getPropStatus(pastDate, true) // "resolved-yes"
 */
export function getPropStatus(
  closeDate: Date | null,
  resolution: boolean | null,
  options?: PropStatusOptions,
): PropStatus {
  const currentDate = options?.currentDate ?? new Date();

  // Check resolution first - resolved props have a definitive status regardless of dates
  if (resolution !== null) {
    return resolution ? "resolved-yes" : "resolved-no";
  }

  // No deadline means always open
  if (closeDate === null) {
    return "open";
  }

  const timeUntilClose = closeDate.getTime() - currentDate.getTime();

  // Past deadline
  if (timeUntilClose <= 0) {
    return "closed";
  }

  return "open";
}

/**
 * Helper to get prop status from a VProp-like object
 * Automatically determines the correct close date based on competition type
 */
export function getPropStatusFromProp(
  prop: {
    prop_forecasts_due_date?: Date | null;
    competition_forecasts_close_date?: Date | null;
    competition_is_private?: boolean | null;
    resolution: boolean | null;
  },
  options?: PropStatusOptions,
): PropStatus {
  // For private competitions, use prop-level deadline
  // For public competitions, use competition-level deadline
  const closeDate = prop.competition_is_private
    ? (prop.prop_forecasts_due_date ?? null)
    : (prop.competition_forecasts_close_date ?? null);

  return getPropStatus(closeDate, prop.resolution, options);
}

/**
 * Get human-readable label for a prop status
 */
export function getPropStatusLabel(status: PropStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "resolved-yes":
      return "Yes";
    case "resolved-no":
      return "No";
  }
}
