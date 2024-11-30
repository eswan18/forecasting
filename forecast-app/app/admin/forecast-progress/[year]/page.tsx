import PageHeading from "@/components/page-heading";
import { getForecasts, getUnforecastedProps, getUsers } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { VUser } from "@/types/db_types";

export default async function ForecastProgressPage(
  { params }: { params: Promise<{ year: number }> },
) {
  const { year } = await params;
  const user = await getUserFromCookies();
  if (!user || !user.is_admin) {
    return (
      <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
        <div className="w-full max-w-lg">
          <h1>Unauthorized</h1>
        </div>
      </main>
    );
  }
  const users = await getUsers();
  const unforecastedProps = await Promise.all(
    users.map(async (user) => {
      return {
        userId: user.id,
        props: await getUnforecastedProps({ userId: user.id, year }),
      };
    }),
  );
  const forecastedProps = await Promise.all(
    users.map(async (user) => {
      return {
        userId: user.id,
        forecasts: await getForecasts({ userId: user.id, year }),
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
        <PageHeading title={`${year} Forecast Progress`} />
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
      <td className="text-right">{(metrics.percentComplete * 100).toFixed(0)}%</td>
    </tr>
  );
}
