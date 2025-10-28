/**
 * Competition status utilities
 *
 * This module provides centralized logic for determining competition status
 * based on forecast due dates and end dates.
 */

export type CompetitionStatus = "upcoming" | "active" | "ended";

/**
 * Get the status of a competition based on current date
 * Returns "upcoming", "active", or "ended"
 */
export function getCompetitionStatus(
  forecastsDueDate: Date,
  endDate: Date,
  currentDate: Date = new Date(),
): CompetitionStatus {
  if (currentDate < forecastsDueDate) {
    return "upcoming";
  } else if (currentDate <= endDate) {
    return "active";
  } else {
    return "ended";
  }
}

/**
 * Get the status of a competition from a competition object
 * Returns "upcoming", "active", or "ended"
 */
export function getCompetitionStatusFromObject(
  competition: {
    forecasts_due_date: Date;
    end_date: Date;
  },
  currentDate: Date = new Date(),
): CompetitionStatus {
  return getCompetitionStatus(
    competition.forecasts_due_date,
    competition.end_date,
    currentDate,
  );
}

/**
 * Legacy compatibility function for components using "unstarted/ongoing/ended" terminology
 * @deprecated Use getCompetitionStatus or getCompetitionStatusFromObject instead
 */
export function getCompetitionState(competition: {
  forecasts_due_date: Date;
  end_date: Date;
}): "unstarted" | "ongoing" | "ended" {
  const status = getCompetitionStatusFromObject(competition);

  switch (status) {
    case "upcoming":
      return "unstarted";
    case "active":
      return "ongoing";
    case "ended":
      return "ended";
  }
}
