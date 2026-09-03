import Link from "next/link";

import { sheetCss } from "@/components/prop-list/sheet";
import { getCompetitions, getProps } from "@/lib/db_actions";

import CompetitionRow from "./competition-row";
import { statusCss } from "./competition-status-badge";
import CreateCompetitionButton from "./create-competition-button";

/**
 * The admin table, built the way the public list of seasons is built: one grid
 * for the whole page with `display: contents` rows, so every date and every
 * count sits under the one above it however long the list gets. What this one
 * adds is the management the public list has no business showing — the counts,
 * and a menu per row.
 */
const ownCss = `
.hxp .comps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 8.5rem 8.5rem 4.5rem 6rem 2.5rem;
  /* No column gap, and cells that stretch: each cell draws its own share of the
     row's hairline, so a gap would break that rule into six pieces. The air
     between columns is padding inside them instead. */
  gap: 0;
  align-items: stretch;
}
.hxp .comps > * { display: contents; }

.hxp .comphead > span {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 1.25rem 0 0.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .comphead > span + span,
.hxp .comp .cell { padding-left: 1.5rem; }
.hxp .comphead > span.n,
.hxp .comp .cell.n { text-align: right; }

.hxp .comp > * {
  padding: 0.75rem 0;
  /* one line box for every cell, so the name, the dates and the counts beside
     it sit on one baseline despite the difference in size */
  line-height: 1.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .comp .name { font-size: 0.9375rem; }
.hxp .comp .name a { color: inherit; text-decoration: none; }
.hxp .comp:hover .name a {
  color: var(--red-text);
  border-bottom: 1px solid var(--red-text);
}
.hxp .comp .name .st { margin-left: 0.75rem; }
.hxp .comp .cell {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--ink-muted);
}
/* The counts are figures to be read against each other, not labels. */
.hxp .comp .cell.n { font-size: 0.8125rem; letter-spacing: 0; color: var(--ink); }
.hxp .comp .cell .none { color: var(--ink-faint); }

.hxp .comp .act {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 1rem;
  color: var(--ink-faint);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  text-align: right;
}
.hxp .comp .act:hover,
.hxp .comp .act[data-state="open"] { color: var(--red-text); }

/* The page's one action, set in the section head beside the way back. */
.hxp h2.kicker .tools {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
}
.hxp h2.kicker .make {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
}
.hxp h2.kicker .make:hover { color: var(--red-text); }
.hxp h2.kicker .make:focus-visible { outline: 2px solid var(--red); outline-offset: 3px; }

@media (max-width: 46rem) {
  .hxp .comps { grid-template-columns: minmax(0, 1fr) 3.5rem 5rem 2.5rem; }
  /* the competition names the row; its dates and counts sit on the line below */
  .hxp .comp .name {
    grid-column: 1 / -1;
    border-bottom: 0;
    padding-bottom: 0.125rem;
  }
  .hxp .comp .due { padding-left: 0; }
  .hxp .comp .ends { display: none; }
  .hxp .comphead > span:first-child { grid-column: 1 / -1; }
  .hxp .comphead > span:not(:first-child) { display: none; }
}
`;

export default async function Page() {
  const competitionsResult = await getCompetitions();
  if (!competitionsResult.success) {
    throw new Error(competitionsResult.error);
  }
  const competitions = competitionsResult.data;

  const propsResult = await getProps({});
  if (!propsResult.success) {
    throw new Error(propsResult.error);
  }
  const props = propsResult.data;

  // Count the number of props for each competition.
  const propCountsByCompetitionId = props.reduce(
    (acc, prop) => {
      const competitionId = prop.competition_id;
      if (competitionId === null) {
        return acc;
      }
      if (!acc[competitionId]) {
        acc[competitionId] = 0;
      }
      acc[competitionId]++;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Count the number of resolved props for each competition.
  const resolvedPropCountsByCompetitionId = props.reduce(
    (acc, prop) => {
      const competitionId = prop.competition_id;
      // `resolution_id`: a resolved choice prop has no resolution boolean.
      if (competitionId === null || prop.resolution_id === null) {
        return acc;
      }
      if (!acc[competitionId]) {
        acc[competitionId] = 0;
      }
      acc[competitionId]++;
      return acc;
    },
    {} as Record<number, number>,
  );

  return (
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{ __html: sheetCss + statusCss + ownCss }}
      />
      <div className="col">
        <header className="masthead">
          <h1>Competitions</h1>
        </header>

        <h2 className="kicker">
          <span>
            All competitions
            <span className="aside num"> · {competitions.length}</span>
          </span>
          <span className="tools">
            <Link className="aside" href="/admin">
              ← Admin
            </Link>
            <CreateCompetitionButton />
          </span>
        </h2>

        {competitions.length === 0 ? (
          <p className="lede">No competitions yet.</p>
        ) : (
          <div className="comps">
            <div className="comphead">
              <span>Competition</span>
              <span>Forecasts due</span>
              <span>Ends</span>
              <span className="n">Props</span>
              <span className="n">Resolved</span>
              <span />
            </div>
            {competitions.map((competition) => (
              <CompetitionRow
                key={competition.id}
                competition={competition}
                nProps={propCountsByCompetitionId[competition.id] ?? 0}
                nResolvedProps={
                  resolvedPropCountsByCompetitionId[competition.id] ?? 0
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
