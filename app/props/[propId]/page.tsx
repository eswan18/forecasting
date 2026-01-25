import { getForecasts, getPropById } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Suspense } from "react";
import ErrorPage from "@/components/pages/error-page";
import { Spinner } from "@/components/ui/spinner";
import PropPageHeader from "./prop-page-header";
import PropStatsRow from "./prop-stats-row";
import ForecastDistributionChart from "./forecast-distribution-chart";
import ForecastsList from "./forecasts-list";

export default function PropPage({
  params,
}: {
  params: Promise<{ propId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Spinner className="w-24 h-24 text-muted-foreground" />
        </div>
      }
    >
      <PropPageContent params={params} />
    </Suspense>
  );
}

async function PropPageContent({
  params,
}: {
  params: Promise<{ propId: string }>;
}) {
  const { propId: propIdString } = await params;
  const propId = parseInt(propIdString, 10);

  if (isNaN(propId)) {
    return <ErrorPage title={`Invalid prop ID '${propIdString}'`} />;
  }

  const user = (await getUserFromCookies())!;

  // Get the prop details
  const propResult = await getPropById(propId);
  if (!propResult.success) {
    return <ErrorPage title={propResult.error} />;
  }
  const prop = propResult.data;
  if (!prop) {
    return <ErrorPage title="Prop not found" />;
  }

  // Get all forecasts for this prop
  const forecastsResult = await getForecasts({ propId });
  if (!forecastsResult.success) {
    return <ErrorPage title={forecastsResult.error} />;
  }
  const forecasts = forecastsResult.data;

  // Find user's forecast
  const userForecast = forecasts.find((f) => f.user_id === user.id);

  // Calculate stats
  const forecastValues = forecasts.map((f) => f.forecast);
  const average =
    forecastValues.length > 0
      ? forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length
      : null;
  const min = forecastValues.length > 0 ? Math.min(...forecastValues) : null;
  const max = forecastValues.length > 0 ? Math.max(...forecastValues) : null;

  return (
    <main className="min-h-screen bg-muted/30 py-8 px-8 lg:px-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <PropPageHeader
          prop={prop}
          canResolve={user.is_admin || prop.prop_user_id === user.id}
        />

        {/* Stats Row */}
        <PropStatsRow
          userForecast={userForecast?.forecast ?? null}
          average={average}
          forecasterCount={forecasts.length}
          min={min}
          max={max}
        />

        {/* Distribution Chart */}
        <div className="mb-6">
          <ForecastDistributionChart
            forecasts={forecasts}
            userForecast={userForecast?.forecast ?? null}
            average={average}
          />
        </div>

        {/* Forecasts List */}
        <ForecastsList forecasts={forecasts} currentUserId={user.id} />
      </div>
    </main>
  );
}
