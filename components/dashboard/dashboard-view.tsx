import Link from "next/link";
/**
 * The signed-in dashboard, in the landing page's print language. Presentation
 * only — see riso-dashboard.tsx for the data it is fed.
 *
 * Your standing is the argument, so it gets the big number; the leaders are its
 * caption. Everything else on the sheet is set quieter than that.
 *
 * NOTE: the print tokens are read from the global --riso-* set; the rest of this
 * (scoped to `hxd`) still duplicates a core that signed-out-landing.tsx also
 * carries. Those two should be factored into one module.
 */

export interface Standing {
  id: number;
  name: string;
  open: boolean;
  leaders: { userId: number; userName: string; score: number }[];
  you: { rank: number; score: number } | null;
  fieldSize: number;
}

export interface ResolvedItem {
  forecastId: number;
  propId: number;
  propText: string;
  forecast: number;
  resolution: boolean;
}

const ORDINALS = ["1st", "2nd", "3rd"];
export const ordinal = (n: number) =>
  n <= 3
    ? ORDINALS[n - 1]
    : `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

const css = `
.hxd {
  --paper: var(--riso-paper);
  --ink: var(--riso-ink);
  --red: var(--riso-red);
  --red-text: var(--riso-red-text);
  --rule: color-mix(in oklab, var(--ink) 22%, transparent);
  --ink-muted: color-mix(in oklab, var(--ink) 70%, transparent);
  --offset: 6px;

  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}
body:has(.hxd) { background: var(--paper); }

/* the stock's tooth, screened at 45 degrees */
.hxd::before {
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

.hxd .col {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 0 1.75rem 5rem;
}

.hxd .mono {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.hxd .muted { color: var(--ink-muted); }
.hxd .ink2 { color: var(--red-text); }


.hxd h2.kicker.first { margin-top: 3rem; }
.hxd h2.kicker {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 3.5rem 0 1.5rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--rule);
}

/* ---- a competition still taking forecasts ---- */
.hxd .season { padding: 2.25rem 0 0; }
.hxd .season + .season { border-top: 1px solid var(--rule); margin-top: 2.5rem; }
.hxd .season .head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.hxd .season .name {
  font-size: 1.44rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0;
}
.hxd .season .name a { color: inherit; text-decoration: none; }
.hxd .season .name a:hover { color: var(--red-text); }

/* the rank, printed the way the landing page prints its argument */
.hxd .rank {
  font-weight: 800;
  font-size: clamp(3.5rem, 9vw, 5.5rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  display: inline-block;
  position: relative;
  margin-left: -0.04em;
}
.hxd .rank .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(var(--offset), var(--offset));
  mix-blend-mode: multiply;
  z-index: 0;
  -webkit-user-select: none;
  user-select: none;
}
.hxd .rank .top-ink {
  position: relative;
  z-index: 1;
  background-image: radial-gradient(transparent 0.5px, var(--ink) 0.75px);
  background-size: 5px 5px;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.hxd .rank-none {
  font-size: 1.44rem;
  font-weight: 700;
  color: var(--ink-muted);
}

/* ---- your standing, and the leaders that caption it ---- */
.hxd .rank-row { margin-top: 1.25rem; display: flex; align-items: baseline; gap: 1.25rem; flex-wrap: wrap; }
.hxd .of { font-family: var(--font-roboto-mono), ui-monospace, monospace; font-size: 0.8125rem; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.hxd .leaders {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--rule);
  display: flex;
  gap: 0.5rem 2rem;
  flex-wrap: wrap;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.hxd .leaders .who { color: var(--ink); }
.hxd .leaders .n { color: var(--red-text); margin-right: 0.5rem; }
.hxd .leaders .sc { color: var(--ink-muted); margin-left: 0.5rem; }

/* the row a closed season collapses to */
.hxd .closed {
  display: flex;
  align-items: baseline;
  gap: 0.875rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--rule);
  flex-wrap: wrap;
}
.hxd .closed .name { font-size: 1rem; font-weight: 600; }
.hxd .closed .name a { color: inherit; text-decoration: none; }
.hxd .closed .name a:hover { color: var(--red-text); }
.hxd .closed .lead {
  flex: 1;
  height: 0;
  border-bottom: 1px dotted var(--rule);
  transform: translateY(-0.3em);
  min-width: 1.5rem;
}
.hxd .closed .fig {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  flex: none;
}
.hxd .closed .fig b { font-weight: 700; }
.hxd .closed .fig span { color: var(--ink-muted); }

/* ---- the two quiet columns at the foot ---- */
.hxd .foot {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 2.5rem 3rem;
  margin-top: 1rem;
}
.hxd .foot h2.kicker { margin-top: 0; }
.hxd .item {
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--rule);
  font-size: 0.9375rem;
}
.hxd .item:first-of-type { padding-top: 0; }
.hxd .item a { color: inherit; text-decoration: none; }
.hxd .item a:hover { color: var(--red-text); }
.hxd .item .meta {
  display: block;
  margin-top: 0.3125rem;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
.hxd .item .hit { color: var(--ink); }
.hxd .item .miss { color: var(--red-text); }
.hxd .empty { color: var(--ink-muted); font-size: 0.9375rem; padding: 0.875rem 0; }
`;

function Rank({ n }: { n: number }) {
  const text = ordinal(n);
  return (
    <span className="rank">
      <span className="ghost" aria-hidden="true">
        {text}
      </span>
      <span className="top-ink">{text}</span>
    </span>
  );
}

function OpenSeason({ standing }: { standing: Standing }) {
  const { you, fieldSize } = standing;
  const href = `/competitions/${standing.id}`;

  return (
    <section className="season">
      <div className="head">
        <h3 className="name">
          <Link href={href}>{standing.name}</Link>
        </h3>
        <span className="mono ink2">Open</span>
      </div>

      <div className="rank-row">
        {you ? (
          <Rank n={you.rank} />
        ) : (
          <span className="rank-none">Not scored yet</span>
        )}
        {you && (
          <span className="of">
            of {fieldSize} · {you.score.toFixed(3)}
          </span>
        )}
      </div>

      {standing.leaders.length > 0 && (
        <div className="leaders">
          <span className="mono muted">Leading</span>
          {standing.leaders.map((l, i) => (
            <span key={l.userId}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="who">{l.userName}</span>
              <span className="sc">{l.score.toFixed(3)}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ClosedSeason({ standing }: { standing: Standing }) {
  const { you } = standing;
  return (
    <div className="closed">
      <span className="name">
        <Link href={`/competitions/${standing.id}`}>{standing.name}</Link>
      </span>
      <i className="lead" aria-hidden="true" />
      <span className="fig">
        {you ? (
          <>
            <b>{ordinal(you.rank)}</b> <span>· {you.score.toFixed(3)}</span>
          </>
        ) : (
          <span>not scored</span>
        )}
      </span>
    </div>
  );
}

export function DashboardView({
  standings,
  resolved,
}: {
  standings: Standing[];
  resolved: ResolvedItem[];
}) {
  const open = standings.filter((s) => s.open);
  const closed = standings.filter((s) => !s.open);

  return (
    <div className="hxd">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="col">
        <h2 className="kicker first">Your competitions</h2>

        {open.length === 0 && closed.length === 0 && (
          <p className="empty">You&apos;re not in a competition yet.</p>
        )}

        {open.map((s) => (
          <OpenSeason key={s.id} standing={s} />
        ))}

        {closed.length > 0 && (
          <>
            <h2 className="kicker">Closed</h2>
            {closed.map((s) => (
              <ClosedSeason key={s.id} standing={s} />
            ))}
          </>
        )}

        <div className="foot">
          <div>
            <h2 className="kicker">Recently resolved</h2>
            {resolved.length === 0 ? (
              <p className="empty">Nothing resolved yet.</p>
            ) : (
              resolved.map((f) => {
                const said = f.forecast;
                const happened = f.resolution;
                const missed = happened ? said < 0.5 : said > 0.5;
                return (
                  <div className="item" key={f.forecastId}>
                    <Link href={`/props/${f.propId}`}>{f.propText}</Link>
                    <span className="meta">
                      You said {Math.round(said * 100)}% ·{" "}
                      <span className={missed ? "miss" : "hit"}>
                        {happened ? "Yes" : "No"}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div>
            <h2 className="kicker">News</h2>
            <div className="item">
              <Link href="/standalone/calibration">Personal calibrations</Link>
              <span className="meta">
                See how well your probabilities match outcomes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
