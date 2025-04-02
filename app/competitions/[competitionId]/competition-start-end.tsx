"use client";

import { Competition } from "@/types/db_types";

export default function CompetitionStartEnd(
  { competition }: { competition: Competition },
) {
  const competitionState = getCompetitionState(competition);
  return (
    <div className="flex flex-col items-center justify-start gap-y-2 mb-4 text-sm">
      <p>
        <span className="text-muted-foreground">
          {competitionState === "unstarted" ? "Begins" : "Began"}
        </span>{" "}
        {Intl.DateTimeFormat(navigator.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(competition.forecasts_due_date)} UTC
      </p>
      <p>
        <span className="text-muted-foreground">
          {competitionState === "ended" ? "Ended" : "Ends"}
        </span>{" "}
        {Intl.DateTimeFormat(navigator.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(competition.end_date)} UTC
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
