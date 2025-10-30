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
  | "ended";

/**
 * Get the status of a competition based on current date
 * Returns "upcoming", "forecasts-open", "forecasts-closed", or "ended"
 */
export function getCompetitionStatus(
  forecastsOpenDate: Date,
  forecastsCloseDate: Date,
  endDate: Date,
  currentDate: Date = new Date(),
): CompetitionStatus {
  if (currentDate < forecastsOpenDate) {
    return "upcoming";
  } else if (currentDate < forecastsCloseDate) {
    return "forecasts-open";
  } else if (currentDate <= endDate) {
    return "forecasts-closed";
  } else {
    return "ended";
  }
}

/**
 * Get the status of a competition from a competition object
 * Returns "upcoming", "forecasts-open", "forecasts-closed", or "ended"
 */
export function getCompetitionStatusFromObject(
  competition: {
    forecasts_open_date: Date;
    forecasts_close_date: Date;
    end_date: Date;
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
