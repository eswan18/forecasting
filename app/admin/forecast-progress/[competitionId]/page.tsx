import PageHeading from "@/components/page-heading";
import {
  getCompetitionById,
  getForecasts,
  getUnforecastedProps,
  getUsers,
} from "@/lib/db_actions";
import { VUser } from "@/types/db_types";
import { InaccessiblePage } from "@/components/inaccessible-page";
import ErrorPage from "@/components/pages/error-page";
import { handleServerActionResult } from "@/lib/server-action-helpers";

export default async function ForecastProgressPage(
  { params }: { params: Promise<{ competitionId: string }> },
) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return <ErrorPage title="Invalid competition ID" />;
  }
  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return (
      <InaccessiblePage
        title="Competition not found"
        message="The competition you are looking for does not exist."
      />
    );
  }
  const usersResult = await getUsers();
  const users = handleServerActionResult(usersResult);
  
  const unforecastedProps = await Promise.all(
    users.map(async (user) => {
      return {
        userId: user.id,
        props: await getUnforecastedProps({ userId: user.id, competitionId }),
      };
    }),
  );
  const forecastedProps = await Promise.all(
    users.map(async (user) => {
      return {
        userId: user.id,
        forecasts: await getForecasts({ userId: user.id, competitionId }),
      };
    }),
  );
  const metrics: UserProgressMetrics[] = users.map((user) => {
    const unforecasted = unforecastedProps.find((u) => u.userId === user.id);
    const unforecastedCount = unforecasted?.props
      ? unforecasted.props.length
      : 0;
    const forecasted = forecastedProps.find((u) => u.userId === user.id);
    const forecastedCount = forecasted?.forecasts
      ? forecasted.forecasts.length
      : 0;
    return {
      user,
      unforecasted: unforecastedCount,
      forecasted: forecastedCount,
      percentComplete: forecastedCount / (forecastedCount + unforecastedCount),
    };
  });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`${competition?.name}: Forecast Progress`} />
        <table className="w-full mt-8">
          <thead>
            <tr>
              <th>User</th>
              <th className="text-right">Unforecasted</th>
              <th className="text-right">Forecasted</th>
              <th className="text-right">Progress</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => <UserMetricsRow key={m.user.id} metrics={m} />)}
          </tbody>
        </table>
      </div>
    </main>
  );
}

interface UserProgressMetrics {
  user: VUser;
  unforecasted: number;
  forecasted: number;
  percentComplete: number;
}

async function UserMetricsRow({ metrics }: { metrics: UserProgressMetrics }) {
  return (
    <tr>
      <td>{metrics.user.name}</td>
      <td className="text-right">{metrics.unforecasted}</td>
      <td className="text-right">{metrics.forecasted}</td>
      <td className="text-right">
        {(metrics.percentComplete * 100).toFixed(0)}%
      </td>
    </tr>
  );
}
