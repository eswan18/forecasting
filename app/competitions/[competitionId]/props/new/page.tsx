import { getCompetitionById } from "@/lib/db_actions";
import { getCurrentUserRole } from "@/lib/db_actions/competition-members";
import { getCategories } from "@/lib/db_actions/categories";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { NewPropForm } from "@/components/forms/new-prop-form";

export default async function NewPropPage({
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

  const user = await getUserFromCookies();
  if (!user) {
    return (
      <InaccessiblePage
        title="Not Logged In"
        message="You must be logged in to create propositions."
      />
    );
  }

  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;

  // Only allow prop creation for private competitions via this page
  if (!competition.is_private) {
    return (
      <InaccessiblePage
        title="Not Available"
        message="This page is only available for private competitions."
      />
    );
  }

  // Check if user is an admin of this competition
  const roleResult = await getCurrentUserRole(competitionId);
  if (!roleResult.success) {
    return <ErrorPage title={roleResult.error} />;
  }

  const userRole = roleResult.data;
  if (userRole !== "admin") {
    return (
      <InaccessiblePage
        title="Unauthorized"
        message="Only competition admins can create propositions."
      />
    );
  }

  // Fetch categories
  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <NewPropForm
      target={{
        kind: "competition",
        id: competitionId,
        name: competition.name,
      }}
      categories={categories}
      userId={user.id}
    />
  );
}
