"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sheetCss } from "@/components/prop-list/sheet";
import { axisCss } from "@/components/prop-list/layout-axis";
import { pct } from "@/components/prop-list/types";
import { MIN_FOR_BOX } from "./build-stats";
import type { ForecastStatsData, Tab } from "./types";

/**
 * Only the marks this sheet adds. The column grid, the head, the ticks, the
 * plot rule and the legend all come from `axisCss`, so 50% sits at the same x
 * here as it does on the prop lists — which is the whole point of drawing
 * these on a shared rule.
 *
 * Module-level constant, no interpolation: this is a stylesheet, not content.
 */
const ownCss = `
/* No value labels ride above these marks, so the plot is shorter than the
   prop lists' and everything sits on the centre line. */
.hxp .plot { height: 1.5rem; }
.hxp .plot .axisline { top: 50%; }
.hxp .plot .grid { top: 25%; bottom: 25%; }

/* the middle half of the crowd */
.hxp .plot .box {
  position: absolute;
  top: 50%;
  height: 10px;
  background: color-mix(in oklab, var(--ink) 22%, transparent);
  transform: translateY(-50%);
}
/* the crowd's mean, drawn one way on every section that shows it */
.hxp .plot .avg {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 1rem;
  background: var(--ink);
  transform: translate(-50%, -50%);
}
/* one forecast's distance from the crowd */
.hxp .plot .gap {
  position: absolute;
  top: 50%;
  height: 3px;
  background: var(--red);
  transform: translateY(-50%);
}
.hxp .plot .mark {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--ink);
  transform: translate(-50%, -50%);
}
.hxp .plot .mine-mark { background: var(--red); }

/* Squared tabs sitting on the section rule. Each is a hairline box open at
   the bottom; the live one is drawn in ink and punches a hole in the 2px rule
   beneath it, so it reads as continuous with the panel below while the others
   stay closed off behind it. Same two inks, same zero radius, same two rule
   weights as everything else on the sheet. */
.hxp .tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 4rem 0 0;
  border-bottom: 2px solid var(--ink);
}
.hxp .tabs a {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--ink-faint);
  background: none;
  border: 1px solid var(--rule);
  /* the rule below shows through, and -2px lets the live tab cover it */
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 0.625rem 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: color 120ms ease;
}
/* collapse the doubled edge between neighbours */
.hxp .tabs a + a { margin-left: -1px; }
.hxp .tabs a { text-decoration: none; }
.hxp .tabs a:hover { color: var(--ink-muted); }
.hxp .tabs a[aria-selected="true"] {
  position: relative;
  z-index: 1;
  color: var(--red-text);
  border-color: var(--ink);
  border-bottom-color: var(--paper);
}
@media (max-width: 46rem) {
  .hxp .tabs a {
    font-size: 0.625rem;
    letter-spacing: 0.06em;
    padding: 0.5rem 0.25rem;
  }
}

/* The column head is the control: it names the figure and points at the
   direction, so there is no separate widget to explain. */
.hxp .axis-head .sort {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0 0 0.125rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .axis-head .sort:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxp .axis-head .sort .arrow { margin-left: 0.375rem; }

.hxp .masthead .meta {
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
}
.hxp .masthead .meta .back { text-decoration: none; white-space: nowrap; }
.hxp .masthead .meta .back:hover { color: var(--red-text); }

.hxp .plotrow .who { font-size: 0.9375rem; }
.hxp .plotrow.mine .who,
.hxp .plotrow.mine .claim { font-weight: 700; }
.hxp .plotrow.mine .cell-r { color: var(--red-text); font-weight: 700; }
/* a run of takes on one prop names the prop once, then just the people */
.hxp .plotrow.same .who { padding-left: 1.5rem; color: var(--ink-muted); }
/* This sheet moves the rule onto the plot's centre line, so its figures align
   to the row like anything else and must not take the axis sheet's drop. */
.hxp .plotrow:has(.plot) .cell-r {
  height: auto;
  padding-top: 0;
  display: block;
  align-self: auto;
}
.hxp .cell-r {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink-muted);
}
.hxp .cell-r .n {
  display: block;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
}

/* A card of stock over the plot it belongs to. Hover on a pointer, tap on
   touch; the panel is inert either way so it can never eat the tap. */
.hxp .plot .tip {
  position: absolute;
  /* below, not above: above it covers the sticky head on the first row, and
     the head carries the scale the panel's numbers are read against */
  top: calc(100% + 0.375rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  background: var(--paper);
  border: 2px solid var(--ink);
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 0.25rem 1.5rem;
  padding: 0.5rem 0.75rem;
  white-space: nowrap;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  pointer-events: none;
}
.hxp .plot .tip .k { color: var(--ink-muted); }
.hxp .plot .tip .v {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
/* red is already the sheet's mark for you, so your line in the panel takes it
   too and pairs with the red mark on the rule behind it */
.hxp .plot .tip .mine { color: var(--red-text); }
/* Every row is a containing block all the time, so showing a panel only
   changes the row's stacking order and never its layout. The state class is
   named tipped rather than open because the shared axis already spends
   .cols.open on the open-props column set, and reusing the name silently
   re-columned the row. */
.hxp .plotrow { position: relative; }
.hxp .plotrow.tipped { z-index: 3; }

/* On a phone the plot drops under the claim and the figure gets a line of its
   own, so each section places that figure where it means something rather than
   leaving it stranded at the right edge. */
@media (max-width: 46rem) {
  .hxp .cell-r .n { display: none; }
  .hxp .plotrow .cell-r { grid-column: 1 / -1; }

  /* the spread is already the sort column and the bar shows it; a line per row
     for a number nobody is scanning is a row of its own */
  .hxp .plotrow.spread .cell-r { display: none; }

  /* certainty's band is centred on 50%, so its figure is too */
  .hxp .plotrow.cert .cell-r { text-align: center; }

  /* the gap belongs over the span it measures, not at the far right */
  .hxp .plotrow.bold .cell-r {
    position: relative;
    height: 1.25rem;
    text-align: left;
  }
  .hxp .plotrow.bold .cell-r .v {
    position: absolute;
    left: var(--mid);
    transform: translateX(-50%);
    white-space: nowrap;
  }
}

.hxp .legend i.k-box { width: 22px; height: 10px; background: color-mix(in oklab, var(--ink) 22%, transparent); }
.hxp .legend i.k-avg { width: 2px; height: 16px; background: var(--ink); }
.hxp .legend i.k-mark { width: 9px; height: 9px; background: var(--ink); }
.hxp .legend i.k-you { width: 9px; height: 9px; background: var(--red); }
.hxp .legend i.k-gap { width: 22px; height: 3px; background: var(--red); }
`;

function Head({
  label,
  right,
  desc,
  onToggle,
}: {
  label: string;
  right: string;
  /** True when the biggest value is at the top. */
  desc: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="cols axis-head">
      <span className="lbl">{label}</span>
      <div className="ticks">
        <span>0%</span>
        <span className="mid" style={{ left: "50%" }}>
          50%
        </span>
        <span className="hi" style={{ left: "100%" }}>
          100%
        </span>
      </div>
      <span className="lbl r">
        <button
          type="button"
          className="sort"
          onClick={onToggle}
          aria-label={`Sort by ${right}, ${desc ? "largest" : "smallest"} first`}
        >
          {right}
          <span className="arrow" aria-hidden="true">
            {desc ? "\u2193" : "\u2191"}
          </span>
        </button>
      </span>
    </div>
  );
}

/** One line of a panel. `mine` marks the reader's own figure. */
type TipRow = [key: string, value: string, mine?: boolean];

function Tip({ rows }: { rows: TipRow[] }) {
  return (
    <span className="tip" role="tooltip">
      {rows.map(([k, v, mine]) => (
        <React.Fragment key={k}>
          <span className={mine ? "k mine" : "k"}>{k}</span>
          <span className={mine ? "v mine" : "v"}>{v}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

function Axis({
  children,
  tip,
}: {
  children?: React.ReactNode;
  tip?: React.ReactNode;
}) {
  return (
    <div className="plot">
      {tip}
      <span className="axisline" />
      <span className="grid" style={{ left: "0%" }} />
      <span className="grid" style={{ left: "25%" }} />
      <span className="grid mid" style={{ left: "50%" }} />
      <span className="grid" style={{ left: "75%" }} />
      <span className="grid" style={{ left: "100%" }} />
      {children}
    </div>
  );
}

const at = (v: number) => `${v * 100}%`;

const TABS: { id: Tab; label: string }[] = [
  { id: "divisive", label: "Most divisive" },
  { id: "boldest", label: "Boldest takes" },
  { id: "certainty", label: "Certainty" },
];

/**
 * Forecast stats: three readings of one crowd, on one rule.
 *
 * Every figure on this page is a probability, so every figure is a mark at the
 * same place it would sit on any other sheet — which lets the sections be read
 * against each other. A forecast that shows up as an outlier in "boldest
 * takes" is visibly the outermost point of its row twenty lines above.
 *
 * Certainty obeys the same rule rather than borrowing its gridlines for a
 * different quantity: a forecaster's typical distance from a coin flip is
 * drawn as a band centred on 50%, so its width is directly comparable to the
 * quartile boxes above it and the centre line is the coin flip it is named for.
 */
export function ForecastStats({
  data,
  tab = "divisive",
}: {
  data: ForecastStatsData;
  /** Which section is showing. Comes from `?view=` so it can be linked to. */
  tab?: Tab;
}) {
  const { competitionId, competitionName } = data;
  const backHref = `/competitions/${competitionId}`;

  // Hover opens it on a pointer; on touch there is no hover, so a tap toggles.
  const [open, setOpen] = useState<string | null>(null);
  const hover = (key: string) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") setOpen(key);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") setOpen(null);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") setOpen(open === key ? null : key);
    },
  });

  const [spreadDesc, setSpreadDesc] = useState(true);
  const [gapDesc, setGapDesc] = useState(true);
  const [certaintyDesc, setCertaintyDesc] = useState(true);

  const flip = (desc: boolean) => (n: number) => (desc ? n : -n);

  // A prop too thin to have a spread has no value to sort by, so it stays at
  // the bottom whichever way the column points.
  const spreads = [...data.spreads].sort((a, b) => {
    const aThin = a.n < MIN_FOR_BOX;
    const bThin = b.n < MIN_FOR_BOX;
    if (aThin !== bThin) return aThin ? 1 : -1;
    return flip(spreadDesc)(b.p75 - b.p25 - (a.p75 - a.p25));
  });

  const boldest = [...data.boldest].sort((a, b) =>
    flip(gapDesc)(
      Math.abs(b.forecast - b.crowdMean) - Math.abs(a.forecast - a.crowdMean),
    ),
  );

  const certainties = [...data.certainties].sort((a, b) =>
    flip(certaintyDesc)(b.certainty - a.certainty),
  );

  return (
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{ __html: sheetCss + axisCss + ownCss }}
      />
      <div className="col">
        <header className="masthead">
          <h1>
            <Link href={backHref}>{competitionName}</Link>
          </h1>
          <div className="meta">
            <span className="mono ink2">
              Forecast stats{" "}
              <span className="muted num">
                · {data.forecastCount} forecasts from {data.forecasterCount}
              </span>
            </span>
            <Link className="mono muted back" href={backHref}>
              ← Overview
            </Link>
          </div>
        </header>

        {data.forecastCount === 0 ? (
          <p className="empty">
            Nobody has forecasted a binary prop in this competition yet.
          </p>
        ) : (
          <>
            <nav className="tabs" role="tablist">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  href={`/competitions/${competitionId}/forecast-stats?view=${t.id}`}
                  // A view of one page rather than a place of its own: the URL
                  // is shareable either way, and back should leave the page.
                  replace
                  scroll={false}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            {tab === "divisive" && (
              <>
                <div className="legend">
                  <span className="key">
                    <i className="k-box" /> 25th to 75th percentile
                  </span>
                  <span className="key">
                    <i className="k-you" /> You
                  </span>
                </div>

                <Head
                  label="Prop"
                  right="Spread"
                  desc={spreadDesc}
                  onToggle={() => setSpreadDesc(!spreadDesc)}
                />

                {spreads.map((s) => {
                  const thin = s.n < MIN_FOR_BOX;
                  return (
                    <div
                      className={
                        open === `s${s.propId}`
                          ? "cols plotrow spread tipped"
                          : "cols plotrow spread"
                      }
                      key={s.propId}
                      {...hover(`s${s.propId}`)}
                    >
                      <span className="claim">
                        <Link href={`/props/${s.propId}`}>{s.text}</Link>
                      </span>
                      <Axis
                        tip={
                          open === `s${s.propId}` ? (
                            <Tip
                              rows={[
                                ["25th", pct(s.p25)],
                                ["75th", pct(s.p75)],
                                [
                                  "You",
                                  s.yours === null ? "—" : pct(s.yours),
                                  true,
                                ],
                              ]}
                            />
                          ) : undefined
                        }
                      >
                        {!thin && (
                          <span
                            className="box"
                            style={{
                              left: at(s.p25),
                              width: at(s.p75 - s.p25),
                            }}
                          />
                        )}
                        {s.yours !== null && (
                          <span
                            className="mark mine-mark"
                            style={{ left: at(s.yours) }}
                          />
                        )}
                      </Axis>
                      <span className="cell-r">
                        {thin ? "—" : pct(s.p75 - s.p25)}
                        <span className="n">n={s.n}</span>
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {tab === "boldest" && boldest.length === 0 && (
              <p className="empty">
                No prop has enough forecasts yet to say who strayed from the
                crowd.
              </p>
            )}

            {tab === "boldest" && boldest.length > 0 && (
              <>
                <div className="legend">
                  <span className="key">
                    <i className="k-avg" /> Crowd average
                  </span>
                  <span className="key">
                    <i className="k-mark" /> Their forecast
                  </span>
                  <span className="key">
                    <i className="k-gap" /> The gap
                  </span>
                </div>

                <Head
                  label="Prop"
                  right="Gap"
                  desc={gapDesc}
                  onToggle={() => setGapDesc(!gapDesc)}
                />

                {boldest.map((t, i) => {
                  const lo = Math.min(t.forecast, t.crowdMean);
                  const hi = Math.max(t.forecast, t.crowdMean);
                  // A run of takes on one prop names it once.
                  const same = i > 0 && boldest[i - 1].propId === t.propId;
                  return (
                    <div
                      className={[
                        "cols plotrow bold",
                        same ? "same" : "",
                        t.isYou ? "mine" : "",
                        open === `b${t.forecastId}` ? "tipped" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={t.forecastId}
                      {...hover(`b${t.forecastId}`)}
                    >
                      {same ? (
                        <span className="who">{t.userName}</span>
                      ) : (
                        <span className="claim">
                          <Link href={`/props/${t.propId}`}>{t.propText}</Link>{" "}
                          <span className="mono muted">{t.userName}</span>
                        </span>
                      )}
                      <Axis
                        tip={
                          open === `b${t.forecastId}` ? (
                            <Tip
                              rows={[
                                ["Crowd average", pct(t.crowdMean)],
                                [t.userName, pct(t.forecast)],
                              ]}
                            />
                          ) : undefined
                        }
                      >
                        <span
                          className="gap"
                          style={{ left: at(lo), width: at(hi - lo) }}
                        />
                        <span
                          className="avg"
                          style={{ left: at(t.crowdMean) }}
                        />
                        <span
                          className="mark"
                          style={{ left: at(t.forecast) }}
                        />
                      </Axis>
                      <span
                        className="cell-r"
                        style={
                          { "--mid": at((lo + hi) / 2) } as React.CSSProperties
                        }
                      >
                        <span className="v">
                          {pct(Math.abs(t.forecast - t.crowdMean))}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {tab === "certainty" && (
              <>
                <div className="legend">
                  <span className="key">
                    <i className="k-box" /> Average distance from 50%
                  </span>
                </div>

                <Head
                  label="Forecaster"
                  right="Certainty"
                  desc={certaintyDesc}
                  onToggle={() => setCertaintyDesc(!certaintyDesc)}
                />

                {certainties.map((c) => (
                  <div
                    className={[
                      "cols plotrow cert",
                      c.isYou ? "mine" : "",
                      open === `c${c.userId}` ? "tipped" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={c.userId}
                    {...hover(`c${c.userId}`)}
                  >
                    <span className="who">{c.userName}</span>
                    <Axis
                      tip={
                        open === `c${c.userId}` ? (
                          <Tip rows={[["Certainty", `±${pct(c.certainty)}`]]} />
                        ) : undefined
                      }
                    >
                      <span
                        className="box"
                        style={{
                          left: at(0.5 - c.certainty),
                          width: at(c.certainty * 2),
                        }}
                      />
                    </Axis>
                    <span className="cell-r">±{pct(c.certainty)}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
