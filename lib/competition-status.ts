/**
 * Competition status utilities
 *
 * This module provides centralized logic for determining competition status
 * based on forecast due dates and end dates.
 */

export type CompetitionStatus =
  | "upcoming"
  | "forecasts-open"
  | "forecasts-closed"
  | "ended"
  | "private"; // Private competitions don't have competition-level dates

/**
 * Where a competition sits relative to now.
 *
 * Null dates mean a private competition, whose deadlines live on each prop
 * rather than the season — so it has no timeline of its own to place.
 */
export function getCompetitionStatus(
  forecastsOpenDate: Date | null,
  forecastsCloseDate: Date | null,
  endDate: Date | null,
  currentDate: Date = new Date(),
): CompetitionStatus {
  // Private competitions have null dates - they use per-prop dates instead
  if (
    forecastsOpenDate === null ||
    forecastsCloseDate === null ||
    endDate === null
  ) {
    return "private";
  }

  if (currentDate < forecastsOpenDate) {
    return "upcoming";
  } else if (currentDate < forecastsCloseDate) {
    return "forecasts-open";
  } else if (currentDate < endDate) {
    return "forecasts-closed";
  } else {
    return "ended";
  }
}

/**
 * `getCompetitionStatus` for a competition-shaped object rather than loose dates.
 */
export function getCompetitionStatusFromObject(
  competition: {
    forecasts_open_date: Date | null;
    forecasts_close_date: Date | null;
    end_date: Date | null;
  },
  currentDate: Date = new Date(),
): CompetitionStatus {
  return getCompetitionStatus(
    competition.forecasts_open_date,
    competition.forecasts_close_date,
    competition.end_date,
    currentDate,
  );
}
