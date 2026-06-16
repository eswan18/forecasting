"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  computeCalibration,
  type CalibrationBucket,
  type ResolvedForecast,
} from "@/lib/calibration";
import { CalibrationChart } from "./calibration-chart";

/** The per-forecast data the page hands to the view (already reduced + resolved). */
export interface CalibrationForecast {
  forecast: number;
  resolvedYes: boolean;
  /** Forecast creation time, as a ms timestamp (serializable across the RSC boundary). */
  createdAt: number;
  competitionId: number | null;
  competitionName: string | null;
}

type Period = "all" | "year" | "90d" | "30d";

const PERIOD_LABELS: Record<Period, string> = {
  all: "All time",
  year: "Last 12 months",
  "90d": "Last 90 days",
  "30d": "Last 30 days",
};

const PERIOD_MS: Record<Period, number> = {
  all: Infinity,
  year: 365 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function CalibrationView({
  forecasts,
}: {
  forecasts: CalibrationForecast[];
}) {
  const [competition, setCompetition] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  // The period cutoff is computed in the change handler (an event, where reading
  // the clock is allowed) and stored, so render stays pure.
  const [cutoff, setCutoff] = useState(-Infinity);

  const handlePeriodChange = (value: string) => {
    const next = value as Period;
    setPeriod(next);
    setCutoff(next === "all" ? -Infinity : Date.now() - PERIOD_MS[next]);
  };

  // Distinct named competitions present in the data, for the filter.
  const competitions = useMemo(() => {
    const map = new Map<number, string>();
    for (const f of forecasts) {
      if (f.competitionId !== null && f.competitionName !== null) {
        map.set(f.competitionId, f.competitionName);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [forecasts]);

  const filtered = useMemo(() => {
    return forecasts.filter((f) => {
      if (competition !== "all" && String(f.competitionId) !== competition) {
        return false;
      }
      return f.createdAt >= cutoff;
    });
  }, [forecasts, competition, cutoff]);

  const result = useMemo(() => {
    const resolved: ResolvedForecast[] = filtered.map((f) => ({
      forecast: f.forecast,
      resolvedYes: f.resolvedYes,
    }));
    return computeCalibration(resolved);
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={competition} onValueChange={setCompetition}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All competitions</SelectItem>
            {competitions.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERIOD_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {result.total === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No resolved forecasts
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once props you forecasted are resolved, your calibration will show
            up here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Resolved forecasts" value={result.total} />
            <StatCard
              label="Brier score"
              value={result.brierScore!.toFixed(3)}
              hint="Lower is better"
            />
            <StatCard
              label="Buckets"
              value={result.buckets.length}
              hint="Non-empty 10% bins"
            />
          </div>

          {/* Reliability diagram */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Reliability diagram
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Points on the dashed line are perfectly calibrated. Above the line,
              events happened more often than you predicted; below, less often.
              Point size reflects how many forecasts fell in each bucket.
            </p>
            <CalibrationChart buckets={result.buckets} />
          </div>

          {/* Per-bucket breakdown */}
          <BucketsTable buckets={result.buckets} />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const KICKER =
  "font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

function BucketsTable({ buckets }: { buckets: CalibrationBucket[] }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          By bucket
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className={KICKER}>Predicted range</TableHead>
              <TableHead className={`${KICKER} text-right`}>Forecasts</TableHead>
              <TableHead className={`${KICKER} text-right`}>
                Avg predicted
              </TableHead>
              <TableHead className={`${KICKER} text-right`}>
                Resolved yes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buckets.map((b) => (
              <TableRow key={b.binStart} className="hover:bg-muted/30">
                <TableCell className="py-3 font-mono text-sm tabular-nums">
                  {Math.round(b.binStart * 100)}–{Math.round(b.binEnd * 100)}%
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
                  {b.count}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-sm tabular-nums">
                  {(b.meanPredicted * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-sm tabular-nums">
                  {(b.observedFrequency * 100).toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
