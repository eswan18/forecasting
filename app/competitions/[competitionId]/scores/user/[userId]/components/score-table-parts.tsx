import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserForecastScore } from "@/lib/db_actions";

const kickerHeadClass =
  "h-9 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

/** Shared column header for the forecast-score tables (mono kicker labels). */
export function ScoreTableHead() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className={kickerHeadClass}>Proposition</TableHead>
        <TableHead className={`${kickerHeadClass} text-right`}>
          Forecast
        </TableHead>
        <TableHead className={`${kickerHeadClass} text-right`}>
          Resolution
        </TableHead>
        <TableHead className={`${kickerHeadClass} text-right`}>
          Penalty
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** The options of a choice prop that resolved true, in position order. */
function realizedOptions(forecast: UserForecastScore) {
  return forecast.options.filter((option) => option.outcome);
}

/**
 * The user's headline probability: their forecast on a binary prop, the
 * probability they gave the winner on a `one_of` prop, and a dash for `any_of`,
 * where a ballot of independent probabilities has no single number.
 */
function forecastLabel(forecast: UserForecastScore): string {
  switch (forecast.kind) {
    case "binary":
      return forecast.forecast === null
        ? "—"
        : `${(forecast.forecast * 100).toFixed(1)}%`;
    case "one_of": {
      const winner = realizedOptions(forecast)[0];
      return winner === undefined
        ? "—"
        : `${(winner.userForecast * 100).toFixed(1)}%`;
    }
    case "any_of":
      return "—";
  }
}

function ResolutionLabel({ forecast }: { forecast: UserForecastScore }) {
  if (forecast.kind === "binary") {
    if (forecast.resolution === null) {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <span className="font-mono text-foreground">
        {forecast.resolution ? "Yes" : "No"}
      </span>
    );
  }
  const realized = realizedOptions(forecast);
  if (realized.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }
  // A long ballot would blow the column out, so the labels truncate and the
  // full list lives in the title.
  const labels = realized.map((option) => option.text).join(", ");
  return (
    <span className="block truncate text-foreground" title={labels}>
      {labels}
    </span>
  );
}

/** A single forecast row, shared by the by-category and by-penalty tables. */
export function ForecastScoreRow({
  forecast,
}: {
  forecast: UserForecastScore;
}) {
  return (
    <TableRow>
      <TableCell className="max-w-md">
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate text-foreground">
            {forecast.propText}
          </div>
          <Link
            href={`/props/${forecast.propId}`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-foreground">
        {forecastLabel(forecast)}
      </TableCell>
      <TableCell className="max-w-[12rem] text-right text-sm">
        <ResolutionLabel forecast={forecast} />
      </TableCell>
      <TableCell className="text-right font-mono font-medium tabular-nums text-foreground">
        {forecast.score !== null ? forecast.score.toFixed(3) : "—"}
      </TableCell>
    </TableRow>
  );
}
