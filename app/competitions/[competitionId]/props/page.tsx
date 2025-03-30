import { getCompetitions, getProps } from "@/lib/db_actions";
import PropTable from "@/components/tables/prop-table";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";

export default async function Page(
  { params }: { params: Promise<{ competitionId: string }> },
) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competitions = await getCompetitions();
  const thisCompetition = competitions.find((c) => c.id === competitionId);
  if (isNaN(competitionId) || !thisCompetition) {
    return <ErrorPage title="Competition not found" />;
  }
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;
  // Passing null as the userId gets us only public props.
  const propsAndResolutions = await getProps({ competitionId, userId: null });
  return <PropTable data={propsAndResolutions} editable={allowEdits} />;
}
