"use client";

import { Competition } from "@/types/db_types";
import { formatInTimeZone } from "date-fns-tz";
import { getCompetitionState } from "@/lib/competition-status";

const DATE_FORMAT = "MMM d, yyyy";

export default function CompetitionStartEnd({
  competition,
}: {
  competition: Competition;
}) {
  const competitionState = getCompetitionState(competition);
  return (
    <div className="flex flex-row flex-wrap items-center justify-start gap-x-4 sm:gap-x-8 gap-y-2 mb-4 text-sm">
      <p>
        <span className="text-muted-foreground">
          {competitionState === "unstarted" ? "Begins" : "Began"}
        </span>{" "}
        {formatInTimeZone(competition.forecasts_close_date, "UTC", DATE_FORMAT)}
      </p>
      <p>
        <span className="text-muted-foreground">
          {competitionState === "ended" ? "Ended" : "Ends"}
        </span>{" "}
        {formatInTimeZone(competition.end_date, "UTC", DATE_FORMAT)}
      </p>
    </div>
  );
}
