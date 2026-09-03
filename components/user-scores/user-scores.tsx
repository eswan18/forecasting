"use client";

import { useState } from "react";
import Link from "next/link";
import { Penalty, sheetCss } from "@/components/prop-list/sheet";
import { axisCss } from "@/components/prop-list/layout-axis";
import { KIND_LABEL, linesOf, pct, type PropView } from "@/components/prop-list/types";

/**
 * Only what this sheet adds to the shared prop grammar: the plated overall
 * score, and the sub-head each category gets. Everything else — the stock, the
 * kicker, the plot, its marks — comes from `sheetCss` and `axisCss`, which is
 * why this sheet is scoped `.hxp` like the prop lists rather than inventing a
 * scope of its own.
 *
 * Module-level constant, no interpolation: this is a stylesheet, not content.
 */
const ownCss = `
/* sheetCss caps .lede at 34rem for the prop sheets' prose; here the row spans
   the column, or the switch's margin-left:auto pushes it to the edge of a box
   two thirds the width of the page and it lands mid-line beside the caption. */
.hxp .lede {
  padding-top: 1.5rem;
  max-width: none;
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.hxp .figure {
  font-weight: 800;
  font-size: clamp(3rem, 7.5vw, 4.75rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  position: relative;
  display: inline-block;
  isolation: isolate;
}
.hxp .figure .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(6px, 6px);
  z-index: -1;
}
.hxp .figure .top-ink {
  color: var(--ink);
  background-image:
    radial-gradient(var(--paper) 0.75px, transparent 0.85px),
    radial-gradient(var(--paper) 0.75px, transparent 0.85px);
  background-size: 5px 5px;
  background-position: 0 0, 2.5px 2.5px;
  -webkit-background-clip: text;
  background-clip: text;
}
.hxp .of {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
/* the grouping switch: two words, the live one in ink */
.hxp .grouping {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.875rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hxp .grouping button {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0 0 0.25rem;
  cursor: pointer;
  color: var(--ink-muted);
}
.hxp .grouping button:hover { color: var(--red-text); }
.hxp .grouping button[aria-pressed="true"] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}

/* a category is a section of the sheet, and carries its own subtotal */
.hxp h3.cat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 2.25rem 0 0;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--ink-muted);
}
.hxp h3.cat .v {
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
/* the flat list has no category head to hold it off the score above it */
.hxp section.flat { padding-top: 2.25rem; }
`;

/** One category's forecasts, with the subtotal they add up to. */
export interface ScoreSection {
  key: string;
  label: string;
  /** Null when the category has no aggregate score of its own. */
  score: number | null;
  props: PropView[];
  /** Per prop, the Brier the server already computed. */
  penalties: Record<number, number | null>;
}

export interface UserScoresProps {
  competitionId: number;
  competitionName: string;
  userName: string;
  /** The viewer looking at their own sheet, which changes only the wording. */
  isSelf: boolean;
  overallScore: number;
  forecastCount: number;
  /** Grouped by category, cheapest category first. */
  sections: ScoreSection[];
  /** Every forecast on one list, cheapest first. */
  flat: ScoreSection;
}

/**
 * One forecaster's every resolved forecast in a competition.
 *
 * This is the resolved prop list narrowed to a person, so it is drawn as the
 * resolved prop list: the same shared probability axis, the same tail from
 * what they said to what happened, the same penalty column.
 *
 * Ordered cheapest-first throughout, and groupable by category or flat: the
 * category view says which subject is costing you, the flat one says which
 * individual calls did.
 */
export function UserScores({
  competitionId,
  competitionName,
  userName,
  isSelf,
  overallScore,
  forecastCount,
  sections,
  flat,
}: UserScoresProps) {
  const [byCategory, setByCategory] = useState(true);
  const score = overallScore.toFixed(3);
  const standingsHref = `/competitions/${competitionId}/standings`;
  const shown = byCategory ? sections : [flat];

  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + axisCss + ownCss }} />
      <div className="col">
        <header className="masthead">
          <h1>
            <Link href={`/competitions/${competitionId}`}>
              {competitionName}
            </Link>
          </h1>
        </header>

        <h2 className="kicker">
          <span>
            {isSelf ? "Your forecasts" : userName}{" "}
            <span className="aside num">· {forecastCount} resolved</span>
          </span>
          <Link className="aside" href={standingsHref}>
            ← Standings
          </Link>
        </h2>

        {forecastCount === 0 ? (
          <p className="empty">
            Nothing has resolved yet, so there is nothing to score.
          </p>
        ) : (
          <>
            <div className="lede">
              <span className="figure">
                <span className="ghost" aria-hidden="true">
                  {score}
                </span>
                <span className="top-ink">{score}</span>
              </span>
              <span className="of">Brier · lower is better</span>
              <span className="grouping">
                <button
                  type="button"
                  aria-pressed={byCategory}
                  onClick={() => setByCategory(true)}
                >
                  By category
                </button>
                <button
                  type="button"
                  aria-pressed={!byCategory}
                  onClick={() => setByCategory(false)}
                >
                  All
                </button>
              </span>
            </div>

            {shown.map((section) => (
              <section
                key={section.key}
                className={section.label === "" ? "flat" : undefined}
              >
                {section.label !== "" && (
                  <h3 className="cat">
                    <span>{section.label}</span>
                    {section.score !== null && (
                      <span className="v">{section.score.toFixed(3)}</span>
                    )}
                  </h3>
                )}

                {section.props.map((prop) => {
                  const lines = linesOf(prop);
                  const isChoice = prop.kind !== "binary";
                  return (
                    <div key={prop.propId}>
                      {isChoice && (
                        <div className="grouprow">
                          <span className="claim">
                            <Link href={`/props/${prop.propId}`}>
                              {prop.text}
                            </Link>
                          </span>
                          <span className="mono muted">
                            {KIND_LABEL[prop.kind]}
                          </span>
                        </div>
                      )}
                      {lines.map((line) => {
                        const you = line.yourForecast;
                        const truth =
                          line.outcome === null ? null : line.outcome ? 1 : 0;
                        const showTail = you !== null && truth !== null;
                        const lo = showTail ? Math.min(you!, truth!) : 0;
                        const hi = showTail ? Math.max(you!, truth!) : 0;
                        return (
                          <div
                            className={
                              isChoice ? "cols plotrow opt" : "cols plotrow"
                            }
                            key={line.key}
                          >
                            <span className="claim">
                              {isChoice ? (
                                line.label
                              ) : (
                                <Link href={`/props/${prop.propId}`}>
                                  {line.label}
                                </Link>
                              )}
                            </span>
                            <div className="plot">
                              <span className="axisline" />
                              <span className="grid" style={{ left: "0%" }} />
                              <span className="grid" style={{ left: "25%" }} />
                              <span
                                className="grid mid"
                                style={{ left: "50%" }}
                              />
                              <span className="grid" style={{ left: "75%" }} />
                              <span className="grid" style={{ left: "100%" }} />
                              {showTail && (
                                <span
                                  className="tail"
                                  style={{
                                    left: `${lo * 100}%`,
                                    width: `${(hi - lo) * 100}%`,
                                  }}
                                />
                              )}
                              {truth !== null && (
                                <span
                                  className="truth"
                                  style={{ left: `${truth * 100}%` }}
                                />
                              )}
                              {you !== null && (
                                <>
                                  <span
                                    className="you"
                                    style={{ left: `${you * 100}%` }}
                                  />
                                  <span
                                    className={
                                      you <= 0.06
                                        ? "val at-start"
                                        : you >= 0.94
                                          ? "val at-end"
                                          : "val"
                                    }
                                    style={{ left: `${you * 100}%` }}
                                  >
                                    {pct(you)}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="cell-r">
                              {!isChoice && (
                                <Penalty
                                  value={section.penalties[prop.propId] ?? null}
                                />
                              )}
                            </span>
                          </div>
                        );
                      })}
                      {isChoice && (
                        <div className="cols plotrow opt">
                          <span className="claim mono muted">Prop penalty</span>
                          <span />
                          <span className="cell-r">
                            <Penalty
                              value={section.penalties[prop.propId] ?? null}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
