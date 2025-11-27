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
import { ClipboardCheck } from "lucide-react";

export default async function ForecastProgressPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return <ErrorPage title="Invalid competition ID" />;
  }
  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return (
      <InaccessiblePage
        title="Competition not found"
        message={competitionResult.error}
      />
    );
  }
  const competition = competitionResult.data;
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

  const unforecastedPropsResults = await Promise.all(
    users.map(async (user) => {
      const result = await getUnforecastedProps({ userId: user.id, competitionId });
      return {
        userId: user.id,
        result,
      };
    }),
  );
  const forecastedPropsResults = await Promise.all(
    users.map(async (user) => {
      const result = await getForecasts({ userId: user.id, competitionId });
      return {
        userId: user.id,
        result,
      };
    }),
  );
  const metrics: UserProgressMetrics[] = users.map((user) => {
    const unforecasted = unforecastedPropsResults.find((u) => u.userId === user.id);
    const unforecastedCount = unforecasted?.result.success
      ? unforecasted.result.data.length
      : 0;
    const forecasted = forecastedPropsResults.find((u) => u.userId === user.id);
    const forecastedCount = forecasted?.result.success
      ? forecasted.result.data.length
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
      <div className="w-full">
        <PageHeading
          title={`${competition?.name}: Forecast Progress`}
          breadcrumbs={{
            Home: "/",
            Admin: "/admin",
            "Forecast Progress": "/admin/forecast-progress",
            [competition?.name || "Competition"]:
              `/admin/forecast-progress/${competitionId}`,
          }}
          icon={ClipboardCheck}
          iconGradient="bg-gradient-to-br from-cyan-500 to-blue-600"
        />
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
            {metrics.map((m) => (
              <UserMetricsRow key={m.user.id} metrics={m} />
            ))}
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
