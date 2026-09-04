import Link from "next/link";

import { sheetCss } from "@/components/prop-list/sheet";
import { getCompetitions, getProps } from "@/lib/db_actions";

import CompetitionRow from "./competition-row";
import { statusCss } from "./competition-status-badge";
import { rowCss } from "./row-css";
import CreateCompetitionButton from "./create-competition-button";

/**
 * The admin table, built the way the public list of seasons is built: one grid
 * for the whole page with `display: contents` rows, so every date and every
 * count sits under the one above it however long the list gets. What this one
 * adds is the management the public list has no business showing — the counts,
 * and a menu per row.
 */

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
        dangerouslySetInnerHTML={{ __html: sheetCss + statusCss + rowCss }}
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
