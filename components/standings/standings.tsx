"use client";

import { useState } from "react";
import Link from "next/link";
import { BigRank } from "@/components/competition-view/sheet";
import { rankForecasters, type RankedForecaster } from "@/lib/leaderboard";
import type { Category } from "@/types/db_types";
import type { CompetitionScore, UserCategoryScore } from "@/lib/db_actions";

// Module-level constant, no interpolation: this is a stylesheet, not content.
const css = `
.hxs {
  --paper: var(--riso-paper);
  --ink: var(--riso-ink);
  --red: var(--riso-red);
  --red-text: var(--riso-red-text);
  --rule: color-mix(in oklab, var(--ink) 22%, transparent);
  --ink-muted: color-mix(in oklab, var(--ink) 70%, transparent);
  --ink-faint: color-mix(in oklab, var(--ink) 38%, transparent);
  --offset: 6px;

  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}
/* --riso-paper, not --paper: the sheet's tokens are scoped to .hxs and do
   not resolve out here on the body. */
body:has(.hxs) { background: var(--riso-paper); }

.hxs::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(var(--ink) 0.7px, transparent 0.9px),
    radial-gradient(var(--ink) 0.7px, transparent 0.9px);
  background-size: 8.5px 8.5px;
  background-position: 0 0, 4.25px 4.25px;
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
}

.hxs .col {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 0 1.75rem 5rem;
}

.hxs .mono {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hxs .muted { color: var(--ink-muted); }
.hxs .num { font-variant-numeric: tabular-nums; }

.hxs .masthead { padding: 2.5rem 0 0; }
.hxs .masthead h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
}
.hxs .masthead h1 a { color: inherit; text-decoration: none; }
.hxs .masthead h1 a:hover { color: var(--red-text); }

.hxs h2.kicker {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 2rem 0 0;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--ink);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.hxs h2.kicker .aside {
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: var(--ink-muted);
}
.hxs h2.kicker a.aside { text-decoration: none; white-space: nowrap; }
.hxs h2.kicker a.aside:hover { color: var(--red-text); }

/* ---- your standing, printed the way every other sheet prints its argument ---- */
.hxs .lede {
  padding-top: 1.5rem;
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.hxs .rank {
  font-weight: 800;
  font-size: clamp(3rem, 7.5vw, 4.75rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  position: relative;
  display: inline-block;
  isolation: isolate;
}
.hxs .rank .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(var(--offset), var(--offset));
  z-index: -1;
}
.hxs .rank .top-ink {
  color: var(--ink);
  background-image:
    radial-gradient(var(--paper) 0.75px, transparent 0.85px),
    radial-gradient(var(--paper) 0.75px, transparent 0.85px);
  background-size: 5px 5px;
  background-position: 0 0, 2.5px 2.5px;
  -webkit-background-clip: text;
  background-clip: text;
}
.hxs .of {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
.hxs .of .val { color: var(--ink); }
.hxs .note {
  margin-top: 1rem;
  color: var(--ink-muted);
  font-size: 0.9375rem;
  max-width: 36rem;
}

/* ---- the board ---- */
.hxs .legend {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 1.25rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hxs .legend .key { display: inline-flex; align-items: center; gap: 0.5rem; }
.hxs .legend i { display: inline-block; flex: none; }
.hxs .legend i.k-cat { width: 9px; height: 9px; background: var(--ink-faint); }
/* the one control that changes the board belongs beside the board, not under it */
.hxs .legend .toggle {
  margin-left: auto;
  font: inherit;
  color: var(--ink-muted);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding-bottom: 0.25rem;
  white-space: nowrap;
}
.hxs .legend .toggle:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}

.hxs .cols {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) 20rem 4rem;
  gap: 0 1.25rem;
  align-items: center;
}
.hxs .head {
  padding: 1.25rem 0 0.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxs .head .lbl {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hxs .head .lbl.r { text-align: right; }
.hxs .head .ticks {
  position: relative;
  height: 1rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}
.hxs .head .ticks span { position: absolute; bottom: 0; white-space: nowrap; }
.hxs .head .ticks .mid { transform: translateX(-50%); color: var(--ink-muted); }
.hxs .head .ticks .hi { transform: translateX(-100%); }

.hxs .row {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--rule);
  width: 100%;
  text-align: left;
  background: none;
  border-left: 0;
  border-right: 0;
  border-top: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
/* an open row and its detail are one object, so no rule runs between them */
.hxs .row[aria-expanded="true"] { border-bottom: 0; }
.hxs .row:hover .name { color: var(--red-text); }
.hxs .row .pos {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
.hxs .row .name { font-size: 0.9375rem; }
.hxs .row.partial .name,
.hxs .row.partial .pos,
.hxs .row.partial .sc { color: var(--ink-muted); }
.hxs .row.mine .name,
.hxs .row.mine .pos { font-weight: 700; color: var(--ink); }
/* the same red as your mark on the axis, so the figure and the dot read as
   one statement rather than two things you have to pair up */
.hxs .row.mine .sc { font-weight: 700; color: var(--red-text); }
.hxs .row .flag {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-left: 0.75rem;
  font-weight: 400;
}
.hxs .row .sc {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* the field on one scale, with a fixed origin: the marks mean the same thing
   whatever the filter is doing, and the coin-flip line gives the eye a fact to
   read rather than just an order it already had from the rank column. */
.hxs .plot { position: relative; height: 1.25rem; }
.hxs .plot .axisline {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: color-mix(in oklab, var(--ink) 16%, transparent);
  transform: translateY(-50%);
}
.hxs .plot .grid {
  position: absolute;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: color-mix(in oklab, var(--ink) 10%, transparent);
}
.hxs .plot .grid.coin {
  top: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--ink) 26%, transparent);
}
.hxs .plot .dot {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--ink);
  transform: translate(-50%, -50%);
}
.hxs .plot .dot.partial { background: var(--ink-faint); }
/* after .partial on purpose: if the viewer is themselves partial, the mark
   that says "this is you" wins. */
.hxs .plot .dot.mine { background: var(--red); }
.hxs .plot .tick {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--ink-faint);
  transform: translate(-50%, -50%);
}

/* ---- one forecaster's categories, opened in place ---- */
.hxs .detail { padding-bottom: 1rem; border-bottom: 1px solid var(--rule); }
.hxs .detail .cat { padding: 0.125rem 0; }
.hxs .detail .cat .name {
  font-size: 0.875rem;
  color: var(--ink-muted);
  padding-left: 1rem;
}
.hxs .detail .cat .sc {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink-muted);
}
.hxs .detail .more {
  display: inline-block;
  margin: 0.875rem 0 0 3.75rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding-bottom: 0.25rem;
}
.hxs .detail .more:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxs .detail .none {
  padding-left: 1rem;
  color: var(--ink-muted);
  font-size: 0.875rem;
}

.hxs .foot { padding-top: 1.25rem; }
.hxs .foot .note { color: var(--ink-muted); font-size: 0.875rem; max-width: 36rem; }
.hxs .empty { color: var(--ink-muted); padding: 2rem 0; }

/* On a phone the axis is the only thing that needs the full width, so it drops
   to a line of its own and everything that names the forecaster — place, name,
   score — stays on the line above it. Placing the score explicitly is what
   makes that work: it comes after the axis in the markup, so auto-placement
   would otherwise push it past the axis onto a third line.

   With each forecaster two lines tall, a rule between them is redundant and
   costs the height a phone can least afford. Spacing separates them instead:
   a quarter-rem inside a forecaster, five times that between. */
@media (max-width: 46rem) {
  .hxs .cols { grid-template-columns: 2.25rem minmax(0, 1fr) 3.5rem; gap: 0.25rem 0.75rem; }
  .hxs .plot { grid-column: 1 / -1; grid-row: 2; }
  .hxs .head .lbl.r { grid-column: 3; grid-row: 1; }
  .hxs .head .ticks { grid-column: 1 / -1; grid-row: 2; }
  .hxs .row .sc { grid-column: 3; grid-row: 1; }
  /* place and score are pinned to the two edges, so a left-set name leaves a
     ragged trench across the middle of every line; centring it in the column
     it already owns closes that up */
  .hxs .head .lbl.who,
  .hxs .row .name { text-align: center; }
  .hxs .row { padding: 1.25rem 0 0; border-bottom: 0; }
  .hxs .detail { padding-bottom: 0; border-bottom: 0; }
  .hxs .detail .more { margin-left: 0; }
}
`;

/** What you score by calling everything a coin flip. The line the board reads against. */
const COIN_FLIP = 0.25;
/**
 * The axis is fixed at 0–0.5 rather than fitted to the field. Nothing about it
 * moves — not between filters, not between competitions — and the coin-flip
 * line sits exactly in the middle, so which half of the scale you are on is
 * readable before any number is. A score past 0.5 pins at the end; the score
 * column carries the record.
 */
const AXIS_FROM = 0;
const AXIS_TO = 0.5;
const STEP = 0.05;
const GRID_STOPS = Array.from(
  { length: Math.round((AXIS_TO - AXIS_FROM) / STEP) + 1 },
  (_, i) => AXIS_FROM + i * STEP,
);
const at = (score: number) =>
  Math.min(
    100,
    Math.max(0, ((score - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100),
  );

interface Row extends Omit<RankedForecaster, "rank"> {
  /** Null for a partial forecaster: an average over a different set of props
   *  can be placed on the axis but cannot be given a place in the order. */
  rank: number | null;
  categoryScores: UserCategoryScore[];
}

export interface StandingsProps {
  scores: CompetitionScore;
  categories: Category[];
  competitionId: number;
  competitionName: string;
  currentUserId: number | null;
  /** When false (the default), forecasters with a partial set are hidden. */
  showIncomplete?: boolean;
  /** Where the filter control goes. Omit to render the board without one. */
  toggleHref?: string;
}

/**
 * The full standings.
 *
 * The field is plotted on one shared score axis rather than merely listed, so
 * the page answers what a ranked table can't: how far apart the field is, and
 * who is on the wrong side of a coin flip.
 *
 * Two things make that honest. The axis has a fixed origin — it snaps to a
 * 0.05 grid over the whole field and always contains 0.25 — so a mark means
 * the same thing whatever the filter is doing. And partial forecasters are
 * never ranked: they appear on the axis, where their score is legitimately
 * interesting, but they take no place in the order, so showing them cannot
 * move anyone else's rank.
 */
export function Standings({
  scores,
  categories,
  competitionId,
  competitionName,
  currentUserId,
  showIncomplete = false,
  toggleHref,
}: StandingsProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const rankArgs = {
    overallScores: scores.overallScores,
    incompleteUserIds: scores.incompleteUserIds,
    currentUserId,
  };

  const categoriesFor = (userId: number) =>
    scores.categoryScores.filter((cs) => cs.userId === userId);

  // Ranked over complete forecasters only, always — the filter changes who is
  // shown, never who is ranked where.
  const ranked: Row[] = rankForecasters({
    ...rankArgs,
    showIncomplete: false,
  }).map((u) => ({ ...u, categoryScores: categoriesFor(u.userId) }));

  const partials: Row[] = rankForecasters({ ...rankArgs, showIncomplete: true })
    .filter((u) => u.isIncomplete)
    .map((u) => ({
      ...u,
      rank: null,
      categoryScores: categoriesFor(u.userId),
    }));

  // Partials sit where their score puts them: that placement is the reason to
  // show them at all.
  const rows: Row[] = showIncomplete
    ? [...ranked, ...partials].sort((a, b) => a.score - b.score)
    : ranked;

  const meAnywhere =
    [...ranked, ...partials].find((u) => u.isCurrentUser) ?? null;
  const iAmPartial = meAnywhere !== null && meAnywhere.rank === null;
  const leader = ranked[0] ?? null;
  const backHref = `/competitions/${competitionId}`;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const toggleRow = (userId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const Axis = ({ children }: { children?: React.ReactNode }) => (
    <span className="plot">
      <span className="axisline" />
      {GRID_STOPS.map((v) => (
        <span
          key={v}
          className={Math.abs(v - COIN_FLIP) < 1e-9 ? "grid coin" : "grid"}
          style={{ left: `${at(v)}%` }}
        />
      ))}
      {children}
    </span>
  );

  const toggle = toggleHref && partials.length > 0 && (
    <Link className="toggle" href={toggleHref}>
      {showIncomplete
        ? "Hide partial"
        : `Show ${partials.length} partial forecaster${partials.length === 1 ? "" : "s"}`}
    </Link>
  );

  return (
    <div className="hxs">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="col">
        <header className="masthead">
          <h1>
            <Link href={backHref}>{competitionName}</Link>
          </h1>
        </header>

        <h2 className="kicker">
          <span>
            Full standings{" "}
            <span className="aside num">· {ranked.length} ranked</span>
          </span>
          <Link className="aside" href={backHref}>
            ← Overview
          </Link>
        </h2>

        {ranked.length === 0 && partials.length === 0 ? (
          <p className="empty">
            Nothing is scored yet. The standings appear once the first prop
            resolves.
          </p>
        ) : (
          <>
            {meAnywhere && (
              <>
                <div className="lede">
                  {!iAmPartial && meAnywhere.rank !== null && (
                    <BigRank n={meAnywhere.rank} />
                  )}
                  <span className="of">
                    {iAmPartial ? "Unranked · " : `of ${ranked.length} · `}
                    <span className="val">{meAnywhere.score.toFixed(3)}</span>
                    {!iAmPartial &&
                      leader &&
                      meAnywhere.userId !== leader.userId && (
                        <>
                          {" · "}
                          {(meAnywhere.score - leader.score).toFixed(3)} behind
                          {" #1 "}
                          {leader.userName}
                        </>
                      )}
                  </span>
                </div>
                {iAmPartial && (
                  <p className="note">
                    You&apos;ve scored {meAnywhere.score.toFixed(3)}, but
                    haven&apos;t forecasted every prop — an average over a
                    partial set isn&apos;t comparable, so you aren&apos;t ranked
                    yet.
                  </p>
                )}
              </>
            )}

            <div className="legend">
              {expanded.size > 0 && (
                <span className="key">
                  <i className="k-cat" /> Category
                </span>
              )}
              <span>Brier · lower is better</span>
              {toggle}
            </div>

            <div className="cols head">
              <span className="lbl">#</span>
              <span className="lbl who">Forecaster</span>
              <div className="ticks">
                <span>{AXIS_FROM.toFixed(1)}</span>
                <span className="mid" style={{ left: `${at(COIN_FLIP)}%` }}>
                  0.25
                </span>
                <span className="hi" style={{ left: "100%" }}>
                  {AXIS_TO.toFixed(1)}
                </span>
              </div>
              <span className="lbl r">Score</span>
            </div>

            {rows.length === 0 ? (
              <p className="empty">
                Nobody has forecasted every prop yet, so nobody is ranked.
              </p>
            ) : (
              rows.map((row) => (
                <div key={row.userId}>
                  <button
                    type="button"
                    className={[
                      "cols row",
                      row.isCurrentUser ? "mine" : "",
                      row.isIncomplete ? "partial" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-expanded={expanded.has(row.userId)}
                    onClick={() => toggleRow(row.userId)}
                  >
                    <span className="pos">
                      {row.rank === null
                        ? "—"
                        : String(row.rank).padStart(2, "0")}
                    </span>
                    <span className="name">
                      {row.userName}
                      {row.isIncomplete && (
                        <span className="flag">partial</span>
                      )}
                    </span>
                    <Axis>
                      <span
                        className={[
                          "dot",
                          row.isIncomplete ? "partial" : "",
                          row.isCurrentUser ? "mine" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ left: `${at(row.score)}%` }}
                      />
                    </Axis>
                    <span className="sc">{row.score.toFixed(3)}</span>
                  </button>

                  {expanded.has(row.userId) && (
                    <div className="detail">
                      {row.categoryScores.length === 0 ? (
                        <p className="none">No category scores yet.</p>
                      ) : (
                        row.categoryScores.map((cs) => (
                          <div className="cols cat" key={cs.categoryId}>
                            <span />
                            <span className="name">
                              {categoryName.get(cs.categoryId) ??
                                "Uncategorised"}
                            </span>
                            <Axis>
                              <span
                                className="tick"
                                style={{ left: `${at(cs.score)}%` }}
                              />
                            </Axis>
                            <span className="sc">{cs.score.toFixed(3)}</span>
                          </div>
                        ))
                      )}
                      <Link
                        className="more"
                        href={`/competitions/${competitionId}/scores/user/${row.userId}`}
                      >
                        Every forecast →
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="foot">
              <p className="note">
                A Brier score runs from 0 (perfect) to 1 (as wrong as possible).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
