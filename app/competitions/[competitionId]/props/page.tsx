import { getCompetitionById, getProps } from "@/lib/db_actions";
import PropTable from "@/components/tables/prop-table";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";

export default async function Page(
  { params }: { params: Promise<{ competitionId: string }> },
) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;
  const propsAndResolutions = await getProps({ competitionId });
  return <PropTable data={propsAndResolutions} editable={allowEdits} />;
}
