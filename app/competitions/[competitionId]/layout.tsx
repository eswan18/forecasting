import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { getCompetitionById, getCompetitions } from "@/lib/db_actions";
import CompetitionSelector from "./props/competition-selector";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import CompetitionTabs from "./competition-tabs";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competition = await getCompetitionById(competitionId);
  const competitions = await getCompetitions();
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }
  async function makeRedirectLink(id: number) {
    "use server";
    return `/competitions/${id}/props`;
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <PageHeading title={competition.name}>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Label>Other Competitions</Label>
          <CompetitionSelector
            competitions={competitions}
            selectedCompetitionId={competitionId}
            redirectOnSelect={makeRedirectLink}
          />
        </div>
      </PageHeading>
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center justify-start mb-4 gap-y-2">
          <Separator />
          <CompetitionTabs className="w-full" />
        </div>
        {children}
      </div>
    </main>
  );
}
