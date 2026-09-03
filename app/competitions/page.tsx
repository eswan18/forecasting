import ErrorPage from "@/components/pages/error-page";
import {
  CompetitionsList,
  toSeasonRows,
} from "@/components/competitions-list/competitions-list";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";
import { getCompetitions } from "@/lib/db_actions/competitions";
import { getUserFromCookies } from "@/lib/get-user";

export default async function CompetitionsPage() {
  const user = (await getUserFromCookies())!;

  const result = await getCompetitions();
  if (!result.success) return <ErrorPage title={result.error} />;

  // A season that has not opened is admin-only: there is nothing to forecast
  // and no scores to read.
  const visible = user.is_admin
    ? result.data
    : result.data.filter(
        (c) => getCompetitionStatusFromObject(c) !== "upcoming",
      );

  return (
    <CompetitionsList
      seasons={toSeasonRows(visible, getCompetitionStatusFromObject)}
    />
  );
}
