import { getUserFromCookies } from "@/lib/get-user";
import { getForecasts } from "@/lib/db_actions";
import { isBinaryForecast } from "@/lib/binary-forecast";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { Container } from "@/components/ui/container";
import PageHeading from "@/components/page-heading";
import { CalibrationView, type CalibrationForecast } from "./calibration-view";

export default async function CalibrationPage() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <InaccessiblePage
        title="Not logged in"
        message="You must be logged in to see your calibration."
      />
    );
  }

  const result = await getForecasts({ userId: user.id });
  const forecasts: CalibrationForecast[] = result.success
    ? result.data
        // Choice props are binary-only here for now; see docs/superpowers/specs/2026-09-01-choice-props-design.md §4.4
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

  return (
    <main className="py-10 lg:py-14">
      <Container className="max-w-3xl">
        <PageHeading
          title="Calibration"
          subtitle="How your forecasts have matched reality — bucketed by predicted probability and compared against what actually happened."
        />
        <CalibrationView forecasts={forecasts} />
      </Container>
    </main>
  );
}
