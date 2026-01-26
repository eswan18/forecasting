import { getUserFromCookies } from "@/lib/get-user";
import { getCompetitionById } from "@/lib/db_actions";
import {
  getCurrentUserRole,
  getCompetitionMembers,
} from "@/lib/db_actions/competition-members";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import PageHeading from "@/components/page-heading";
import { MembersPageContent } from "./members-page-content";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return (
      <ErrorPage title={`Invalid competition ID '${competitionIdString}'`} />
    );
  }

  const user = (await getUserFromCookies())!;

  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;

  // Only private competitions have members
  if (!competition.is_private) {
    return (
      <InaccessiblePage
        title="Not Available"
        message="Member management is only available for private competitions."
      />
    );
  }

  // Check if user is a member and get their role
  const roleResult = await getCurrentUserRole(competitionId);
  if (!roleResult.success) {
    return <ErrorPage title={roleResult.error} />;
  }

  const userRole = roleResult.data;
  if (userRole === null) {
    return (
      <InaccessiblePage
        title="Private Competition"
        message="You are not a member of this competition."
      />
    );
  }

  // Only admins can view the members page
  if (userRole !== "admin") {
    return (
      <InaccessiblePage
        title="Admin Only"
        message="Only competition admins can manage members."
      />
    );
  }

  // Fetch all members
  const membersResult = await getCompetitionMembers(competitionId);
  if (!membersResult.success) {
    return <ErrorPage title={membersResult.error} />;
  }

  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full max-w-4xl mx-auto">
      <PageHeading
        title="Manage Members"
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competitionId}`,
        }}
        className="mb-6"
      />

      <MembersPageContent
        members={membersResult.data}
        competitionId={competitionId}
        currentUserId={user.id}
      />
    </main>
  );
}
