import { InaccessiblePage } from "@/components/inaccessible-page";
import { isBinaryForecast } from "@/lib/binary-forecast";
import { getForecasts } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import {
  CalibrationSheet,
  type CalibrationForecast,
} from "./calibration-sheet";

export default async function CalibrationPage() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <InaccessiblePage
        title="Not signed in"
        message="You must be signed in to see your calibration."
      />
    );
  }

  const result = await getForecasts({ userId: user.id });
  const forecasts: CalibrationForecast[] = result.success
    ? result.data
        // Choice props carry no single probability to bucket; see
        // docs/superpowers/specs/2026-09-01-choice-props-design.md §4.4
        .filter(isBinaryForecast)
        .filter((f) => f.resolution !== null)
        .map((f) => ({
          forecast: f.forecast,
          resolvedYes: f.resolution === true,
          createdAt: new Date(f.forecast_created_at).getTime(),
          competitionId: f.competition_id,
          competitionName: f.competition_name,
        }))
    : [];

  return <CalibrationSheet forecasts={forecasts} />;
}
