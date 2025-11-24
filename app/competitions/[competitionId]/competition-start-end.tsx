"use client";

import { Competition } from "@/types/db_types";
import { formatInTimeZone } from "date-fns-tz";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";

const DATE_FORMAT = "MMM d, yyyy";

export default function CompetitionStartEnd({
  competition,
}: {
  competition: Competition;
}) {
  const status = getCompetitionStatusFromObject(competition);
  return (
    <div className="flex flex-row flex-wrap items-center justify-start gap-x-4 sm:gap-x-8 gap-y-2 mb-4 text-sm">
      {status === "upcoming" && (
        <>
          <p>
            <span className="text-muted-foreground">Forecasts open</span>{" "}
            {formatInTimeZone(
              competition.forecasts_open_date,
              "UTC",
              DATE_FORMAT,
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Forecasts close</span>{" "}
            {formatInTimeZone(
              competition.forecasts_close_date,
              "UTC",
              DATE_FORMAT,
            )}
          </p>
        </>
      )}
      {status === "forecasts-open" && (
        <>
          <p>
            <span className="text-muted-foreground">Forecasts opened</span>{" "}
            {formatInTimeZone(
              competition.forecasts_open_date,
              "UTC",
              DATE_FORMAT,
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Forecasts close</span>{" "}
            {formatInTimeZone(
              competition.forecasts_close_date,
              "UTC",
              DATE_FORMAT,
            )}
          </p>
        </>
      )}
      {status === "forecasts-closed" && (
        <>
          <p>
            <span className="text-muted-foreground">Forecasts closed</span>{" "}
            {formatInTimeZone(
              competition.forecasts_close_date,
              "UTC",
              DATE_FORMAT,
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Competition Ends</span>{" "}
            {formatInTimeZone(competition.end_date, "UTC", DATE_FORMAT)}
          </p>
        </>
      )}
      {status === "ended" && (
        <p>
          <span className="text-muted-foreground">Ended</span>{" "}
          {formatInTimeZone(competition.end_date, "UTC", DATE_FORMAT)}
        </p>
      )}
    </div>
  );
}
