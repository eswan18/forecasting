import { getForecasts } from "@/lib/db_actions";
import { isBinaryForecast } from "@/lib/binary-forecast";
import ErrorPage from "@/components/pages/error-page";
import { buildForecastStats } from "@/components/forecast-stats/build-stats";
import { ForecastStats } from "@/components/forecast-stats/forecast-stats";
import { TAB_IDS, type Tab } from "@/components/forecast-stats/types";
import { competitionAccess } from "../access";
import { AccessDenied } from "../access-denied";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ competitionId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { competitionId: idString } = await params;
  const { view } = await searchParams;
  const tab: Tab = TAB_IDS.includes(view as Tab) ? (view as Tab) : "divisive";
  const access = await competitionAccess(idString);
  if (!access.ok) return <AccessDenied access={access} />;

  const { competition, user } = access;
  const forecastsResult = await getForecasts({ competitionId: competition.id });
  if (!forecastsResult.success) {
    return <ErrorPage title={forecastsResult.error} />;
  }

  return (
    <ForecastStats
      tab={tab}
      data={buildForecastStats({
        // Choice props have no single probability to place on the axis, so
        // every reading here is over binary forecasts only.
        forecasts: forecastsResult.data.filter(isBinaryForecast),
        competitionId: competition.id,
        competitionName: competition.name,
        currentUserId: user.id,
      })}
    />
  );
}
