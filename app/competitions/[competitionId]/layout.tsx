import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { getCompetitions } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Separator } from "@/components/ui/separator";
import CompetitionTabs from "./competition-tabs";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // Get current user to check admin status
  const user = await getUserFromCookies();
  const isAdmin = user?.is_admin;

  const competitions = await getCompetitions();
  const competition = competitions.find(
    (competition) => competition.id === competitionId,
  );
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }

  // Check if non-admin user is trying to access a non-visible competition
  if (!isAdmin && !competition.visible) {
    return (
      <InaccessiblePage
        title="Competition Not Available"
        message="This competition is not currently visible to users."
      />
    );
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="flex flex-col items-center gap-2 mb-4">
        <PageHeading
          title={competition.name}
          className="flex flex-row items-start mb-0"
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
              {competitions
                .filter((comp) => isAdmin || comp.visible)
                .map((competition) =>
                  competitionId === competition.id ? (
                    <DropdownMenuItem disabled key={competition.id}>
                      <div className="flex items-center gap-2 w-full">
                        {isAdmin &&
                          (competition.visible ? (
                            <Eye size={14} className="text-muted-foreground" />
                          ) : (
                            <EyeOff
                              size={14}
                              className="text-muted-foreground"
                            />
                          ))}
                        <span>{competition.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <Link
                      href={`/competitions/${competition.id}/props`}
                      key={competition.id}
                    >
                      <DropdownMenuItem>
                        <div className="flex items-center gap-2 w-full">
                          {isAdmin &&
                            (competition.visible ? (
                              <Eye
                                size={14}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <EyeOff
                                size={14}
                                className="text-muted-foreground"
                              />
                            ))}
                          <span>{competition.name}</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ),
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeading>
        {!competition.visible && (
          <Badge variant="secondary" className="text-xs">
            Not Visible to Users
          </Badge>
        )}
      </div>
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
