import type { PropOptionSummary, PropWithUserForecast } from "@/types/db_types";

// Shared mock data for the forecast-card stories.
// Fixed dates so prop status (open / unresolved / resolved) is deterministic.
export const FUTURE = new Date("2030-06-01T00:00:00Z");
export const PAST = new Date("2020-01-01T00:00:00Z");

export function makeProp(
  overrides: Partial<PropWithUserForecast> = {},
): PropWithUserForecast {
  return {
    prop_id: 1,
    prop_text: "Will the temperature exceed 30°C tomorrow?",
    prop_notes: "Based on the local weather station's midday reading.",
    prop_kind: "binary",
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
    options: [],
    ...overrides,
  };
}

// A `one_of` prop's options: exactly one team can win, and the user has only
// filled in two of the four (60% entered, 40% still to place).
export const NBA_CHAMPION_OPTIONS: PropOptionSummary[] = [
  {
    option_id: 1,
    text: "Boston Celtics",
    position: 0,
    outcome: null,
    user_forecast: 0.35,
    community_average: 0.32,
  },
  {
    option_id: 2,
    text: "Denver Nuggets",
    position: 1,
    outcome: null,
    user_forecast: 0.25,
    community_average: 0.27,
  },
  {
    option_id: 3,
    text: "Oklahoma City Thunder",
    position: 2,
    outcome: null,
    user_forecast: null,
    community_average: 0.19,
  },
  {
    option_id: 4,
    text: "Any other team",
    position: 3,
    outcome: null,
    user_forecast: null,
    community_average: 0.22,
  },
];

// An `any_of` prop's options: independent, so nothing has to add up. The last
// one has no community average yet.
export const ECONOMY_OPTIONS: PropOptionSummary[] = [
  {
    option_id: 11,
    text: "The Fed cuts rates at least once",
    position: 0,
    outcome: null,
    user_forecast: 0.7,
    community_average: 0.64,
  },
  {
    option_id: 12,
    text: "Unemployment tops 5%",
    position: 1,
    outcome: null,
    user_forecast: 0.2,
    community_average: 0.31,
  },
  {
    option_id: 13,
    text: "Inflation ends the year under 2%",
    position: 2,
    outcome: null,
    user_forecast: 0.45,
    community_average: null,
  },
];
