import PageHeading from "@/components/page-heading";
import {
  getCompetitions,
  getForecasts,
  getUserById,
  getUsers,
} from "@/lib/db_actions";
import { notFound } from "next/navigation";
import ForecastTable from "./forecast-table";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import { redirect } from "next/navigation";
import UserYearSelector from "./user-year-selector";

export default async function Page(
  { params, searchParams }: {
    params: Promise<{ competitionId: string }>;
    searchParams: Promise<{ user_id?: string }>;
  },
) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const authUser = await getUserFromCookies();
  if (!authUser) {
    loginAndRedirect({ url: `/competitions/${competitionId}/forecasts` });
  }
  // BIG QUESTION: should `user_id` be a query param or a path param?
  // Query param, I'm deciding. This page should still work without a user_id.
  const userIdString = (await searchParams).user_id;
  const userId = userIdString ? parseInt(userIdString, 10) : undefined;
  const forecasts = await getForecasts({ userId, competitionId });
  const scoredForecasts = forecasts.map((forecast) => {
    const resolution = forecast.resolution;
    let penalty = null;
    if (resolution !== null) {
      const resolutionAsNumber = resolution ? 1 : 0;
      penalty = Math.pow(forecast.forecast - resolutionAsNumber, 2) || null;
    }
    return {
      ...forecast,
      penalty,
    };
  });
  // todo – make sure that only some situations are editable – like if the user is looking at their own props.
  // const allUsers = await getUsers({ sort: "name asc" });
  const editable = true;
  return (
    <>
      {
        /*<UserSelector
            users={allUsers}
            selectedUserId={requestedUser.id}
          /> */
      }
      <ForecastTable data={scoredForecasts} editable={editable} />
    </>
  );
}
