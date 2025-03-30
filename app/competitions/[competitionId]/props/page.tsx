import { getCompetitions, getProps } from "@/lib/db_actions";
import PropTable from "@/components/tables/prop-table";
import PageHeading from "@/components/page-heading";
import CompetitionSelector from "./competition-selector";
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
  async function makeRedirectLink(id: number) {
    "use server";
    return `/competitions/${id}/props`;
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-3xl">
        <PageHeading
          title={`${thisCompetition.name}: Props`}
          className="flex flex-row flex-wrap gap-x-4 lg:gap-x-8 items-end mb-4 sm:mb-8"
        >
          <CompetitionSelector
            competitions={competitions}
            selectedCompetitionId={competitionId}
            redirectOnSelect={makeRedirectLink}
          />
        </PageHeading>
        <PropTable data={propsAndResolutions} editable={allowEdits} />
      </div>
    </main>
  );
}
