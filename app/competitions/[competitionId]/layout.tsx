import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { getCompetitions } from "@/lib/db_actions";
import { Separator } from "@/components/ui/separator";
import CompetitionTabs from "./competition-tabs";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import CompetitionStartEnd from "./competition-start-end";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return (
      <ErrorPage title={`Invalid competition ID '${competitionIdString}'`} />
    );
  }
  const competitions = await getCompetitions();
  const competition = competitions.find(
    (competition) => competition.id === competitionId,
  );
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <PageHeading
        title={competition.name}
        className="flex flex-row items-start mb-2"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>All Competitions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {competitions.map((competition) =>
              competitionId === competition.id ? (
                <DropdownMenuItem disabled key={competition.id}>
                  {competition.name}
                </DropdownMenuItem>
              ) : (
                <Link
                  href={`/competitions/${competition.id}/props`}
                  key={competition.id}
                  legacyBehavior
                >
                  <DropdownMenuItem>{competition.name}</DropdownMenuItem>
                </Link>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeading>
      <CompetitionStartEnd competition={competition} />
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
