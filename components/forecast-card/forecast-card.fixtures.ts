import type { PropWithUserForecast } from "@/types/db_types";

// Shared mock data for the forecast-card stories.
// Fixed dates so prop status (open / closed / resolved) is deterministic.
export const FUTURE = new Date("2030-06-01T00:00:00Z");
export const PAST = new Date("2020-01-01T00:00:00Z");

export function makeProp(
  overrides: Partial<PropWithUserForecast> = {},
): PropWithUserForecast {
  return {
    prop_id: 1,
    prop_text: "Will the temperature exceed 30°C tomorrow?",
    prop_notes: "Based on the local weather station's midday reading.",
    prop_user_id: null,
    prop_forecasts_due_date: FUTURE,
    prop_resolution_due_date: FUTURE,
    prop_created_by_user_id: null,
    category_id: 1,
    category_name: "Weather",
    competition_id: 1,
    competition_name: "2026 Predictions",
    competition_is_private: false,
    competition_forecasts_close_date: FUTURE,
    competition_forecasts_open_date: PAST,
    resolution_id: null,
    resolution: null,
    resolution_user_id: null,
    resolution_notes: null,
    user_forecast: 0.72,
    user_forecast_id: 10,
    community_average: 0.58,
    ...overrides,
  };
}
