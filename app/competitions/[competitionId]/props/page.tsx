import { getProps } from "@/lib/db_actions";
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
  const propsAndResolutions = await getProps({ competitionId });

  return <PropsTable props={propsAndResolutions} allowEdits={allowEdits} />;
}
