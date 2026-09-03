import { InaccessiblePage } from "@/components/inaccessible-page";
import { competitionAccess } from "../access";
import { AccessDenied } from "../access-denied";
import { MembersPanel } from "./members-panel";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: idString } = await params;
  const access = await competitionAccess(idString);
  if (!access.ok) return <AccessDenied access={access} />;

  const { competition, user, isAdmin } = access;

  // Only a private competition has a membership; a public one is open to
  // everyone, so there is no roster to show.
  if (!competition.is_private) {
    return (
      <InaccessiblePage
        title="No membership list"
        message="This competition is public, so it has no members list."
      />
    );
  }

  return (
    <MembersPanel
      competitionId={competition.id}
      competitionName={competition.name}
      currentUserId={user.id}
      // `competitionAccess` resolves this from the membership role for a
      // private competition, which is exactly who may manage the roster.
      canManage={isAdmin}
      backHref={`/competitions/${competition.id}`}
    />
  );
}
