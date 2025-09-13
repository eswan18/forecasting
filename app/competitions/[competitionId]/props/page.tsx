import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
import { PropsTable } from "./props-table";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  const propsWithForecasts = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId,
  });

  return (
    <PropsTable
      props={propsWithForecasts}
      allowEdits={allowEdits}
      competitionId={competitionId}
    />
  );
}
