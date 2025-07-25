import { getUsers } from "@/lib/db_actions";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import { SearchParams } from "./search-params";
import ForecastTable from "./forecast-table";
import { handleServerActionResult } from "@/lib/server-action-helpers";

export default async function Page(
  { params, searchParams }: {
    params: Promise<{ competitionId: string }>;
    searchParams: Promise<SearchParams>;
  },
) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const authUser = await getUserFromCookies();
  if (!authUser) {
    await loginAndRedirect({ url: `/competitions/${competitionId}/forecasts` });
  }
  const usersResult = await getUsers();
  const users = handleServerActionResult(usersResult);
  
  return (
    <ForecastTable
      competitionId={competitionId}
      searchParams={await searchParams}
      users={users}
    />
  );
}
