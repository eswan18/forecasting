import type { VForecast } from "@/types/db_types";

// Shared mock data for the prop-view stories (forecasts list + distribution
// chart). Fixed dates keep everything deterministic.
const NOW = new Date("2026-06-01T00:00:00Z");

export function makeForecast(overrides: Partial<VForecast> = {}): VForecast {
  return {
    category_id: 1,
    category_name: "Economics",
    competition_id: 1,
    competition_name: "2026 Predictions",
    competition_is_private: false,
    competition_forecasts_close_date: NOW,
    competition_forecasts_open_date: NOW,
    forecast_id: 1,
    forecast: 0.6,
    forecast_created_at: NOW,
    forecast_updated_at: NOW,
    prop_id: 1,
    prop_text: "Will the proposition resolve yes?",
    prop_notes: null,
    prop_user_id: null,
    prop_forecasts_due_date: NOW,
    prop_resolution_due_date: NOW,
    prop_created_by_user_id: null,
    resolution_id: null,
    resolution: null,
    resolution_user_id: null,
    resolution_notes: null,
    resolution_created_at: null,
    resolution_updated_at: null,
    score: null,
    user_id: 1,
    user_name: "Forecaster",
    ...overrides,
  };
}

// A spread of forecasters across the probability range. User id 3 ("Dana") is
// treated as the current user in the stories.
const SAMPLE = [
  { user_id: 1, user_name: "Alex", forecast: 0.08 },
  { user_id: 2, user_name: "Bo", forecast: 0.27 },
  { user_id: 3, user_name: "Dana", forecast: 0.52 },
  { user_id: 4, user_name: "Erin", forecast: 0.55 },
  { user_id: 5, user_name: "Frankie", forecast: 0.66 },
  { user_id: 6, user_name: "Gale", forecast: 0.78 },
  { user_id: 7, user_name: "Harper", forecast: 0.91 },
];

export const sampleForecasts: VForecast[] = SAMPLE.map((s, i) =>
  makeForecast({ ...s, forecast_id: i + 1 }),
);

export const CURRENT_USER_ID = 3;

export function average(forecasts: VForecast[]): number | null {
  if (forecasts.length === 0) return null;
  return forecasts.reduce((a, f) => a + f.forecast, 0) / forecasts.length;
}
