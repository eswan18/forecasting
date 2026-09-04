import { PropListPage } from "../prop-list-page";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  return <PropListPage competitionIdString={competitionId} bucket="resolved" />;
}
