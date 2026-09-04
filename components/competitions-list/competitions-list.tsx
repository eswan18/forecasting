import { Fragment } from "react";
import Link from "next/link";

import {
  CompetitionStamp,
  type SeasonState,
} from "@/components/competition-stamp/competition-stamp";
import { LocalDate } from "@/components/local-date";
import { sheetCss } from "@/components/prop-list/sheet";
import type { CompetitionStatus } from "@/lib/competition-status";
import type { Competition } from "@/types/db_types";

const ownCss = `
/* One table, not four. The phases group the rows, but the columns run the
   whole page: a list that gains a row a year is only scannable if every date
   sits under the one above it. */
.hxp .seasons {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 11rem 11rem;
  /* No column gap, and cells that stretch: each cell draws its own share of
     the row's hairline, so a gap would break that rule into three pieces and
     a baseline alignment would leave the three pieces at three heights. The
     air between columns is padding inside them instead. */
  gap: 0;
  align-items: stretch;
}
/* Every row hands its cells straight to the grid, so the columns are the
   page's and not each row's. */
.hxp .seasons > * { display: contents; }

.hxp .seasonhead > span {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 1.25rem 0 0.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .seasonhead > span + span,
.hxp .season .cell { padding-left: 1.5rem; }

/* The phase is a marker between runs of rows, not a section of its own: the
   stamp carries it, separated by air rather than by another rule. */
.hxp .phase > span:first-child {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 2rem 0 0.625rem;
}
.hxp .phase > span .n {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.hxp .season > * {
  padding: 0.75rem 0;
  /* one line box for every cell, so the name and the dates beside it sit on
     one baseline despite the difference in size */
  line-height: 1.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .season .name { font-size: 0.9375rem; }
.hxp .season .name a { color: inherit; text-decoration: none; }
.hxp .season:hover .name a {
  color: var(--red-text);
  border-bottom: 1px solid var(--red-text);
}
.hxp .season .cell {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--ink-muted);
}
/* How long is left is the only thing on this page anyone acts on. */
.hxp .season .cell .left {
  display: block;
  color: var(--red-text);
  padding-top: 0.25rem;
}
.hxp .season .cell .none { color: var(--ink-faint); }
.hxp .season .lock {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-left: 0.75rem;
}

@media (max-width: 46rem) {
  .hxp .seasons { grid-template-columns: minmax(0, 1fr) 9rem; }
  /* the season names the row; its two dates sit on the line below */
  .hxp .season .name {
    grid-column: 1 / -1;
    border-bottom: 0;
    padding-bottom: 0.125rem;
  }
  .hxp .seasonhead > span:first-child { grid-column: 1 / -1; }
  .hxp .seasonhead > span:not(:first-child) { display: none; }
}
`;

/** The order a reader wants them in: what is live, what is being scored, what is done. */
const GROUPS: { status: CompetitionStatus[]; state: SeasonState }[] = [
  { status: ["forecasts-open", "private"], state: "open" },
  { status: ["forecasts-closed"], state: "scoring" },
  { status: ["ended"], state: "final" },
  // Admins only: nobody else is shown a season that has not opened.
  { status: ["upcoming"], state: "upcoming" },
];

export interface SeasonRow {
  id: number;
  name: string;
  status: CompetitionStatus;
  isPrivate: boolean;
  forecastsClose: Date | null;
  end: Date | null;
}

/**
 * How long is left to forecast, for the near deadlines where that is the
 * useful reading. A date three months out says everything a countdown would.
 */
function timeLeft(due: Date | null, now: Date): string | null {
  if (!due) return null;
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (days < 0 || days > 30) return null;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/**
 * Every season, grouped by where it is in its life.
 *
 * The grouping is the page's structure and it earns that: which seasons you
 * can still forecast, which are waiting on results, and which are settled is
 * the question this page is opened to answer. The columns, though, run past
 * the groups — one date column for the whole page, so a list that gains a row
 * a year stays readable down its length and not just across each row.
 */
export function CompetitionsList({
  seasons,
  now = new Date(),
}: {
  seasons: SeasonRow[];
  /** Injectable so a story can pin the countdown. */
  now?: Date;
}) {
  const groups = GROUPS.map((group) => ({
    state: group.state,
    rows: seasons.filter((s) => group.status.includes(s.status)),
  })).filter((group) => group.rows.length > 0);

  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + ownCss }} />
      <div className="col">
        <header className="masthead">
          <h1>Competitions</h1>
        </header>

        <h2 className="kicker">
          <span>
            All seasons
            <span className="aside num"> · {seasons.length}</span>
          </span>
        </h2>

        {seasons.length === 0 ? (
          <p className="lede">There are no competitions to show yet.</p>
        ) : (
          <div className="seasons">
            <div className="seasonhead">
              <span>Season</span>
              <span>Forecasts due</span>
              <span>Ends</span>
            </div>
            {groups.map((group) => (
              <Fragment key={group.state}>
                <div className="phase">
                  <span>
                    <CompetitionStamp state={group.state} />
                    <span className="n">{group.rows.length}</span>
                  </span>
                  <span />
                  <span />
                </div>
                {group.rows.map((season) => {
                  const left = timeLeft(season.forecastsClose, now);
                  return (
                    <div className="season" key={season.id}>
                      <span className="name">
                        <Link href={`/competitions/${season.id}`}>
                          {season.name}
                        </Link>
                        {season.isPrivate && (
                          <span className="lock">private</span>
                        )}
                      </span>
                      <span className="cell">
                        {season.isPrivate ? (
                          "Per-prop"
                        ) : season.forecastsClose ? (
                          <>
                            <LocalDate date={season.forecastsClose} />
                            {left && <span className="left">{left}</span>}
                          </>
                        ) : (
                          <span className="none">—</span>
                        )}
                      </span>
                      <span className="cell">
                        {season.end ? (
                          <LocalDate date={season.end} />
                        ) : (
                          <span className="none">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The view model, built from what the route already has. */
export function toSeasonRows(
  competitions: Competition[],
  statusOf: (c: Competition) => CompetitionStatus,
): SeasonRow[] {
  return competitions.map((c) => ({
    id: c.id,
    name: c.name,
    status: statusOf(c),
    isPrivate: c.is_private,
    forecastsClose: c.forecasts_close_date,
    end: c.end_date,
  }));
}
