"use client";

import { Competition } from "@/types/db_types";
import { formatInTimeZone } from "date-fns-tz";

const DATE_FORMAT = "MMM d, yyyy";

export default function CompetitionStartEnd(
  { competition }: { competition: Competition },
) {
  const competitionState = getCompetitionState(competition);
  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2 mb-4 text-sm">
      <p>
        <span className="text-muted-foreground">
          {competitionState === "unstarted" ? "Begins" : "Began"}
        </span>{" "}
        {formatInTimeZone(competition.forecasts_due_date, "UTC", DATE_FORMAT)}
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

function getCompetitionState(
  competition: {
    forecasts_due_date: Date;
    end_date: Date;
  },
): "unstarted" | "ongoing" | "ended" {
  const now = new Date();
  if (competition.forecasts_due_date > now) {
    return "unstarted";
  }
  if (competition.end_date < now) {
    return "ended";
  }
  return "ongoing";
}
