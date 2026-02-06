"use client";

import { Competition } from "@/types/db_types";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { formatDate } from "@/lib/time-utils";

export default function CompetitionStartEnd({
  competition,
}: {
  competition: Competition;
}) {
  const timezone = getBrowserTimezone();
  const status = getCompetitionStatusFromObject(competition);
  return (
    <div className="flex flex-row flex-wrap items-center justify-start gap-x-4 sm:gap-x-8 gap-y-2 mb-4 text-sm">
      {status === "upcoming" &&
        competition.forecasts_open_date &&
        competition.forecasts_close_date && (
          <>
            <p>
              <span className="text-muted-foreground">Forecasts open</span>{" "}
              {formatDate(competition.forecasts_open_date, timezone)}
            </p>
            <p>
              <span className="text-muted-foreground">Forecasts close</span>{" "}
              {formatDate(competition.forecasts_close_date, timezone)}
            </p>
          </>
        )}
      {status === "forecasts-open" &&
        competition.forecasts_open_date &&
        competition.forecasts_close_date && (
          <>
            <p>
              <span className="text-muted-foreground">Forecasts opened</span>{" "}
              {formatDate(competition.forecasts_open_date, timezone)}
            </p>
            <p>
              <span className="text-muted-foreground">Forecasts close</span>{" "}
              {formatDate(competition.forecasts_close_date, timezone)}
            </p>
          </>
        )}
      {status === "forecasts-closed" &&
        competition.forecasts_close_date &&
        competition.end_date && (
          <>
            <p>
              <span className="text-muted-foreground">Forecasts closed</span>{" "}
              {formatDate(competition.forecasts_close_date, timezone)}
            </p>
            <p>
              <span className="text-muted-foreground">Competition Ends</span>{" "}
              {formatDate(competition.end_date, timezone)}
            </p>
          </>
        )}
      {status === "ended" && competition.end_date && (
        <p>
          <span className="text-muted-foreground">Ended</span>{" "}
          {formatDate(competition.end_date, timezone)}
        </p>
      )}
      {status === "private" && (
        <p className="text-muted-foreground">
          Private competition — deadlines are set per proposition
        </p>
      )}
    </div>
  );
}
