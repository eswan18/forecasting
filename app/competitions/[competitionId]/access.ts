import { getCompetitionById } from "@/lib/db_actions";
import { getCurrentUserRole } from "@/lib/db_actions/competition-members";
import { getUserFromCookies } from "@/lib/get-user";
import { getCompetitionStatus } from "@/lib/competition-status";
import type { Competition, VUser } from "@/types/db_types";

export type CompetitionAccess =
  | { ok: true; competition: Competition; user: VUser; isAdmin: boolean }
  | { ok: false; kind: "error"; title: string }
  | { ok: false; kind: "forbidden"; title: string; message: string };

/**
 * The gate every competition route shares: parse the id, load the competition,
 * and apply the two visibility rules — a private competition is members-only,
 * and an upcoming public one is admin-only.
 *
 * Lives here rather than in each route because it used to be written once in
 * the page that owned all the tabs; splitting the tabs into real routes would
 * otherwise have copied it five times.
 */
export async function competitionAccess(
  competitionIdString: string,
): Promise<CompetitionAccess> {
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return {
      ok: false,
      kind: "error",
      title: `Invalid competition ID '${competitionIdString}'`,
    };
  }

  const [user, competitionResult] = await Promise.all([
    getUserFromCookies(),
    getCompetitionById(competitionId),
  ]);

  if (!competitionResult.success) {
    return { ok: false, kind: "error", title: competitionResult.error };
  }
  const competition = competitionResult.data;

  if (competition.is_private) {
    const roleResult = await getCurrentUserRole(competitionId);
    if (!roleResult.success) {
      return { ok: false, kind: "error", title: roleResult.error };
    }
    if (roleResult.data === null) {
      return {
        ok: false,
        kind: "forbidden",
        title: "Private Competition",
        message: "You are not a member of this competition.",
      };
    }
    return {
      ok: true,
      competition,
      user: user!,
      isAdmin: roleResult.data === "admin",
    };
  }

  const status = getCompetitionStatus(
    competition.forecasts_open_date,
    competition.forecasts_close_date,
    competition.end_date,
  );
  if (status === "upcoming" && !user!.is_admin) {
    return {
      ok: false,
      kind: "forbidden",
      title: "Competition Not Available",
      message: "This competition is not currently visible to users.",
    };
  }

  return { ok: true, competition, user: user!, isAdmin: user!.is_admin };
}
