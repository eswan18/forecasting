"use client";

import { useMemo, useState } from "react";

import { sheetCss } from "@/components/prop-list/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  computeCalibration,
  type CalibrationBucket,
  type ResolvedForecast,
} from "@/lib/calibration";

/** The per-forecast data the page hands the sheet (already reduced and resolved). */
export interface CalibrationForecast {
  forecast: number;
  resolvedYes: boolean;
  /** Forecast creation time as a ms timestamp, serializable across the RSC boundary. */
  createdAt: number;
  competitionId: number | null;
  competitionName: string | null;
}

type Period = "all" | "year" | "90d" | "30d";

const PERIOD_LABEL: Record<Period, string> = {
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

const ownCss = `
.hxp .filters {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1rem 2rem;
  padding-top: 1.5rem;
}
/* the filter controls are styled in globals.css as .riso-pick */

/* The diagram is square because both axes carry the same 0–100% scale; drawn
   at any other ratio the diagonal stops being a 45° line and stops meaning
   "perfect". Every cell is placed explicitly — auto-placement puts the axis
   labels wherever they fall and the plot loses its column. */
.hxp .diagram {
  display: grid;
  grid-template-columns: 1.25rem 2.75rem minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  max-width: 30rem;
  padding-top: 1.75rem;
}
.hxp .diagram .ytitle { grid-column: 1; grid-row: 1; }
.hxp .diagram .yaxis { grid-column: 2; grid-row: 1; }
.hxp .diagram .plotbox { grid-column: 3; grid-row: 1; }
.hxp .diagram .xaxis { grid-column: 3; grid-row: 2; }
.hxp .diagram .xtitle { grid-column: 3; grid-row: 3; }

.hxp .diagram .plotbox {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-left: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
}
.hxp .diagram svg { display: block; width: 100%; height: 100%; }
.hxp .diagram .yaxis {
  position: relative;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
.hxp .diagram .yaxis span {
  position: absolute;
  right: 0.5rem;
  transform: translateY(-50%);
}
.hxp .diagram .xaxis {
  position: relative;
  height: 1.5rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
.hxp .diagram .xaxis span { position: absolute; top: 0.375rem; transform: translateX(-50%); }
.hxp .diagram .xaxis span:last-child { transform: translateX(-90%); }
.hxp .axistitle {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hxp .diagram .ytitle {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  justify-self: center;
  align-self: center;
}
.hxp .diagram .xtitle { padding-top: 0.25rem; }

.hxp .bands {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 6rem 6rem 6rem;
  gap: 0;
  align-items: stretch;
}
.hxp .bands > * { display: contents; }
.hxp .bandhead > span {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 1.25rem 0 0.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .band > * {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.5rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--rule);
}
.hxp .bandhead > span:not(:first-child),
.hxp .band > *:not(:first-child) { text-align: right; padding-left: 1.5rem; }
.hxp .band .said { color: var(--red-text); }

@media (max-width: 46rem) {
  .hxp .bands { grid-template-columns: minmax(0, 1fr) 4rem 4.5rem 4.5rem; }
  .hxp .diagram { grid-template-columns: 0 2.25rem minmax(0, 1fr); }
  .hxp .diagram .ytitle { display: none; }
}
`;

/**
 * The reliability diagram, drawn rather than charted.
 *
 * Each band is a square whose area is how many forecasts fell in it, placed at
 * what you said (across) against what happened (up). The dashed diagonal is
 * perfect calibration: a mark above it means the thing happened more often
 * than you said, below means less.
 */
function Diagram({ buckets }: { buckets: CalibrationBucket[] }) {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className="diagram">
      <span className="axistitle ytitle">What happened</span>
      <div className="yaxis">
        {[0, 25, 50, 75, 100].map((v) => (
          <span key={v} style={{ top: `${100 - v}%` }}>
            {v}%
          </span>
        ))}
      </div>
      <div className="plotbox">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[25, 50, 75].map((v) => (
            <g key={v}>
              <line
                x1={v}
                y1={0}
                x2={v}
                y2={100}
                stroke="var(--ink)"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={0}
                y1={v}
                x2={100}
                y2={v}
                stroke="var(--ink)"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
          {/* perfect calibration */}
          <line
            x1={0}
            y1={100}
            x2={100}
            y2={0}
            stroke="var(--ink)"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {buckets.map((b) => {
          // Area in proportion to the count, so two marks compare by area the
          // way the eye reads them, with a floor so a single forecast is still
          // visible.
          const share = total > 0 ? b.count / total : 0;
          const side = Math.max(9, Math.min(26, 9 + Math.sqrt(share) * 34));
          return (
            <span
              key={b.binStart}
              title={`${Math.round(b.binStart * 100)}–${Math.round(
                b.binEnd * 100,
              )}%: ${b.count} forecast${b.count === 1 ? "" : "s"}`}
              style={{
                position: "absolute",
                left: `${b.meanPredicted * 100}%`,
                bottom: `${b.observedFrequency * 100}%`,
                width: side,
                height: side,
                marginLeft: -side / 2,
                marginBottom: -side / 2,
                background: "var(--red)",
              }}
            />
          );
        })}
      </div>
      <div className="xaxis">
        {[0, 25, 50, 75, 100].map((v) => (
          <span key={v} style={{ left: `${v}%` }}>
            {v}%
          </span>
        ))}
      </div>
      <span className="axistitle xtitle">What you said</span>
    </div>
  );
}

/**
 * How well your numbers have matched the world.
 *
 * The page answers one question — when you say 70%, does it happen 70% of the
 * time? — so it leads with the diagram that shows it and follows with the
 * bands the diagram is made of.
 */
export function CalibrationSheet({
  forecasts,
}: {
  forecasts: CalibrationForecast[];
}) {
  const [competition, setCompetition] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  // The cutoff is computed in the change handler — an event, where reading the
  // clock is allowed — and stored, so render stays pure.
  const [cutoff, setCutoff] = useState(-Infinity);

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

  const result = useMemo(() => {
    const resolved: ResolvedForecast[] = forecasts
      .filter(
        (f) =>
          (competition === "all" || String(f.competitionId) === competition) &&
          f.createdAt >= cutoff,
      )
      .map((f) => ({ forecast: f.forecast, resolvedYes: f.resolvedYes }));
    return computeCalibration(resolved);
  }, [forecasts, competition, cutoff]);

  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + ownCss }} />
      <div className="col">
        <header className="masthead">
          <h1>Calibration</h1>
        </header>

        <h2 className="kicker">
          <span>
            Your record
            <span className="aside num">
              {" "}
              · {result.total}{" "}
              {result.total === 1 ? "resolved forecast" : "resolved forecasts"}
              {result.brierScore !== null &&
                ` · Brier ${result.brierScore.toFixed(3)}`}
            </span>
          </span>
        </h2>

        <div className="filters">
          {competitions.length > 1 && (
            <Select value={competition} onValueChange={setCompetition}>
              <SelectTrigger className="riso-pick" aria-label="Competition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="riso-pick-list">
                <SelectItem value="all">All competitions</SelectItem>
                {competitions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={period}
            onValueChange={(next) => {
              setPeriod(next as Period);
              setCutoff(
                next === "all"
                  ? -Infinity
                  : Date.now() - PERIOD_MS[next as Period],
              );
            }}
          >
            <SelectTrigger className="riso-pick" aria-label="Period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="riso-pick-list">
              {(Object.keys(PERIOD_LABEL) as Period[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PERIOD_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {result.total === 0 ? (
          <p className="lede">
            Nothing you have forecasted has resolved yet, so there is no
            calibration to read. It appears here as props settle.
          </p>
        ) : (
          <>
            <Diagram buckets={result.buckets} />
            <p className="lede">
              A mark on the dashed line is perfectly calibrated. Above it,
              things happened more often than you said; below, less often. A
              mark&apos;s size is how many forecasts fell in that band.
            </p>

            <h2 className="kicker">
              <span>
                By band
                <span className="aside num"> · {result.buckets.length}</span>
              </span>
            </h2>
            <div className="bands">
              <div className="bandhead">
                <span>Band</span>
                <span>Forecasts</span>
                <span>You said</span>
                <span>Happened</span>
              </div>
              {result.buckets.map((b) => (
                <div className="band" key={b.binStart}>
                  <span>
                    {Math.round(b.binStart * 100)}–{Math.round(b.binEnd * 100)}%
                  </span>
                  <span>{b.count}</span>
                  <span className="said">
                    {Math.round(b.meanPredicted * 100)}%
                  </span>
                  <span>{Math.round(b.observedFrequency * 100)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
