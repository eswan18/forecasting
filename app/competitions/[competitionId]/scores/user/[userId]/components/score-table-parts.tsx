import Link from "next/link";
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

function ResolutionLabel({ resolution }: { resolution: boolean | null }) {
  if (resolution === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="font-mono text-foreground">
      {resolution ? "Yes" : "No"}
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
        <Link
          href={`/props/${forecast.propId}`}
          className="block truncate text-foreground transition-colors hover:text-primary"
        >
          {forecast.propText}
        </Link>
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-foreground">
        {(forecast.forecast * 100).toFixed(1)}%
      </TableCell>
      <TableCell className="text-right text-sm">
        <ResolutionLabel resolution={forecast.resolution} />
      </TableCell>
      <TableCell className="text-right font-mono font-medium tabular-nums text-foreground">
        {forecast.score !== null ? forecast.score.toFixed(3) : "—"}
      </TableCell>
    </TableRow>
  );
}
