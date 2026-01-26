import { getCompetitionById } from "@/lib/db_actions";
import { getCurrentUserRole } from "@/lib/db_actions/competition-members";
import { getCategories } from "@/lib/db_actions/categories";
import { getUserFromCookies } from "@/lib/get-user";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { NewPropForm } from "./new-prop-form";
import PageHeading from "@/components/page-heading";

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
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full max-w-4xl mx-auto">
      <PageHeading
        title="New Proposition"
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competitionId}`,
        }}
        className="mb-6"
      />

      <NewPropForm
        competitionId={competitionId}
        competitionName={competition.name}
        categories={categories}
        userId={user.id}
      />
    </main>
  );
}
