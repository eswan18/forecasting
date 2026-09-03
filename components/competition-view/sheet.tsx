import Link from "next/link";
import type { OpenProp, Standing } from "./types";

/**
 * The print grammar shared by all three competition layouts, scoped to `.hxc`.
 *
 * Two rule weights, two meanings, exactly as on the dashboard:
 *   2px ink      — a section starts here
 *   1px hairline — between two items inside a section
 * A head binds down: 4rem of paper above it, 1.5rem below.
 *
 * NOTE: this still duplicates a core that dashboard-view.tsx carries too. The
 * global --riso-* tokens are shared; the scoped layout rules are not, and the
 * three sheets should eventually be factored into one module.
 */
export const sheetCss = `
.hxc {
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
/* --riso-paper, not --paper: the sheet's tokens are scoped to .hxc and do
   not resolve out here on the body. */
body:has(.hxc) { background: var(--riso-paper); }

/* the stock's tooth, screened at 45 degrees */
.hxc::before {
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

.hxc .col {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 0 1.75rem 5rem;
}

/* one notch below a kicker, so red mono caps can only mean "section head" */
.hxc .mono {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hxc .muted { color: var(--ink-muted); }
.hxc .ink2 { color: var(--red-text); }
.hxc .num { font-variant-numeric: tabular-nums; }

.hxc h2.kicker {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 4rem 0 0;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--ink);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.hxc h2.kicker.first { margin-top: 2rem; }
.hxc h2.kicker .aside {
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: var(--ink-muted);
}
.hxc h2.kicker a.aside { text-decoration: none; }
.hxc h2.kicker a.aside:hover { color: var(--red-text); }

/* ---- the masthead ---- */
.hxc .masthead { padding: 2.5rem 0 0; }
.hxc .masthead h1 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0.5rem 0 0;
}
.hxc .masthead .links {
  margin-top: 1rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.hxc .masthead .links a {
  color: var(--ink-muted);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding-bottom: 0.25rem;
}
.hxc .masthead .links a::after { content: " →"; }
.hxc .masthead .links a:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxc .masthead .meta {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem 1.5rem;
  flex-wrap: wrap;
  color: var(--ink-muted);
}

/* ---- the big number, printed the way the landing page prints its argument ---- */
.hxc .rank {
  font-weight: 800;
  font-size: clamp(3rem, 7.5vw, 4.75rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  position: relative;
  display: inline-block;
  isolation: isolate;
}
.hxc .rank .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(var(--offset), var(--offset));
  z-index: -1;
}
.hxc .rank .top-ink {
  color: var(--ink);
  background-image:
    radial-gradient(var(--paper) 0.75px, transparent 0.85px),
    radial-gradient(var(--paper) 0.75px, transparent 0.85px);
  background-size: 5px 5px;
  background-position: 0 0, 2.5px 2.5px;
  -webkit-background-clip: text;
  background-clip: text;
}

/* ---- standings ---- */
.hxc table.board { width: 100%; border-collapse: collapse; }
.hxc table.board td {
  padding: 0.75rem 0;
  border-top: 1px solid var(--rule);
  vertical-align: baseline;
}
.hxc table.board tr:first-child td { border-top: 0; }
.hxc table.board td.legend {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  text-align: right;
  padding: 0 0 0.75rem;
}
.hxc table.board td.rest a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding-bottom: 0.125rem;
}
.hxc table.board td.rest a:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxc table.board td.rest {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hxc table.board .pos {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  width: 3rem;
}
.hxc table.board .who { width: auto; }
.hxc table.board .sc {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  width: 5rem;
}
/* the viewer's own line: the only bold row in the table, which is enough to
   find it. Red is reserved for urgency, so it is not spent here. */
.hxc table.board tr.mine td { font-weight: 700; }
.hxc table.board tr.mine .pos { color: var(--ink); }
.hxc table.board tr.incomplete td { color: var(--ink-muted); }
.hxc table.board .flag {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-left: 0.75rem;
  font-weight: 400;
}

/* ---- a prop you still owe ---- */
.hxc .owed {
  display: flex;
  align-items: baseline;
  gap: 0.875rem;
  padding: 0.875rem 0;
  border-top: 1px solid var(--rule);
  flex-wrap: wrap;
}
.hxc h2.kicker + .owed, .hxc .owed:first-child { border-top: 0; padding-top: 1.5rem; }
.hxc .owed .text { font-size: 1rem; flex: 1 1 20rem; min-width: 0; }
.hxc .owed .text a { color: inherit; text-decoration: none; }
.hxc .owed .text a:hover { color: var(--red-text); }
/* not scoped to .owed: variant B's docket uses these too */
.hxc .due {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  flex: none;
}
.hxc .due.soon { color: var(--red-text); }

/* ---- the three lists, as a set of routes off the page ---- */
.hxc .routes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0;
  margin-top: 1.5rem;
}
.hxc .routes a {
  display: block;
  padding: 1.25rem 1.25rem 1.25rem 0;
  text-decoration: none;
  color: inherit;
}
.hxc .routes .n {
  display: block;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
/* These are destinations, and a bare numeral over a caption doesn't say so.
   The arrow is the page's existing "go here" mark (the section asides use it)
   and the underline is the one affordance nobody has to learn — both drawn as
   rules, which is what this language builds everything from. */
.hxc .routes .lbl {
  display: inline-block;
  margin-top: 0.5rem;
  padding-bottom: 0.3125rem;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  transition: color 120ms ease, border-color 120ms ease;
}
.hxc .routes .lbl::after { content: " →"; }
.hxc .routes a:hover .n,
.hxc .routes a:focus-visible .n { color: var(--red-text); }
.hxc .routes a:hover .lbl,
.hxc .routes a:focus-visible .lbl {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxc .routes a:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }

.hxc .more {
  display: block;
  padding: 0.875rem 0;
  border-top: 1px solid var(--rule);
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  text-decoration: none;
}
.hxc .more:hover { color: var(--red-text); }

.hxc .note {
  margin-top: 1.25rem;
  color: var(--ink-muted);
  font-size: 0.9375rem;
}
.hxc .of {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
.hxc .of .val { color: var(--ink); }

.hxc .empty { color: var(--ink-muted); padding: 1.5rem 0; }

/* ---- narrow screens ---- */
/* Last in the sheet on purpose: these lose to equally specific rules that come
   later in source order. */
@media (max-width: 40rem) {
  /* the masthead's counts wrap to two rows of figures nobody opened the page
     for, and the same numbers are already in the routes at the foot */
  .hxc .masthead .wide-only { display: none; }
}
`;

const ORDINALS = ["1st", "2nd", "3rd"];
export const ordinal = (n: number) =>
  n <= 3
    ? ORDINALS[n - 1]
    : `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** The big number, printed on two plates that slip by the registration vector. */
export function BigRank({ n }: { n: number }) {
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

/**
 * Days until a deadline, or null when there isn't one. Deliberately coarse:
 * the page only needs "is this urgent", and an exact clock would be wrong
 * anyway once the server-rendered string meets the browser's timezone.
 */
export function daysUntil(deadline: Date | null, now: Date): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now.getTime();
  // Floor, not ceil: two hours out is "today", not "1 day".
  return Math.floor(ms / 86_400_000);
}

export function DueLabel({
  deadline,
  now,
}: {
  deadline: Date | null;
  now: Date;
}) {
  const days = daysUntil(deadline, now);
  if (days === null) return <span className="due">no deadline</span>;
  if (days <= 0) return <span className="due soon">due today</span>;
  return (
    <span className={days <= 7 ? "due soon" : "due"}>
      {days === 1 ? "1 day" : `${days} days`}
    </span>
  );
}

export function OwedProp({
  prop,
  competitionId,
  now,
}: {
  prop: OpenProp;
  competitionId: number;
  now: Date;
}) {
  return (
    <div className="owed">
      <span className="text">
        <Link href={`/competitions/${competitionId}/props/${prop.propId}`}>
          {prop.propText}
        </Link>
      </span>
      <DueLabel deadline={prop.deadline} now={now} />
    </div>
  );
}

/**
 * The one ranking algorithm on the page. A partial forecast set makes a Brier
 * score incomparable, so incomplete forecasters are excluded by default and
 * everyone else is ranked over what remains. Both the table and the big number
 * read from this, so they cannot disagree.
 */
export function rankStandings(
  standings: Standing[],
  showIncomplete = false,
): (Standing & { rank: number })[] {
  const eligible = showIncomplete
    ? standings
    : standings.filter((s) => !s.incomplete);
  return eligible.map((s, i) => ({ ...s, rank: i + 1 }));
}

/**
 * The standings table. `limit` truncates the visible field; the viewer's own
 * row is always shown, appended after an ellipsis when they fall outside the
 * cut, so "where am I" never costs a click.
 */
export function Board({
  standings,
  currentUserId,
  limit,
  showIncomplete = false,
  moreHref,
}: {
  standings: Standing[];
  currentUserId: number;
  limit?: number;
  showIncomplete?: boolean;
  /** Where the truncation row goes — the field it is hiding. */
  moreHref?: string;
}) {
  const ranked = rankStandings(standings, showIncomplete);
  const shown = limit ? ranked.slice(0, limit) : ranked;
  const mine = ranked.find((s) => s.userId === currentUserId);
  const mineIsCut =
    mine !== undefined && !shown.some((s) => s.userId === mine.userId);
  // Everyone the cut hides, including the viewer if they are one of them.
  const hidden = ranked.length - shown.length - (mineIsCut ? 1 : 0);

  // The viewer is scored but not ranked — a partial forecast set. Without this
  // they got a table they do not appear in and no explanation.
  const viewerUnranked = standings.find(
    (s) => s.userId === currentUserId && s.incomplete,
  );

  if (ranked.length === 0) {
    return <p className="empty">Nothing scored yet.</p>;
  }

  return (
    <>
      <table className="board">
        <tbody>
          <tr>
            <td className="legend" colSpan={3}>
              Brier · lower is better
            </td>
          </tr>
          {shown.map((s) => (
            <Row key={s.userId} s={s} isMine={s.userId === currentUserId} />
          ))}
          {hidden > 0 && (
            <tr>
              <td className="rest" colSpan={3}>
                {moreHref ? (
                  <Link href={moreHref}>⋯ {hidden} more</Link>
                ) : (
                  <>⋯ {hidden} more</>
                )}
              </td>
            </tr>
          )}
          {mineIsCut && <Row s={mine} isMine />}
        </tbody>
      </table>
      {viewerUnranked && (
        <p className="note">
          You&apos;ve scored {viewerUnranked.score.toFixed(3)}, but haven&apos;t
          forecasted every prop — a partial set isn&apos;t comparable, so
          you&apos;re not ranked yet.
        </p>
      )}
    </>
  );
}

function Row({
  s,
  isMine,
}: {
  s: Standing & { rank: number };
  isMine: boolean;
}) {
  return (
    <tr
      className={`${isMine ? "mine" : ""} ${s.incomplete ? "incomplete" : ""}`}
    >
      <td className="pos">{String(s.rank).padStart(2, "0")}</td>
      <td className="who">
        {s.userName}
        {s.incomplete && <span className="flag">partial</span>}
      </td>
      <td className="sc">{s.score.toFixed(3)}</td>
    </tr>
  );
}

/**
 * The three lists, as counted routes off the page. Every layout carries these,
 * so "see all open / unresolved / resolved" is never more than one click away
 * wherever the reader is.
 */
export function Routes({
  competitionId,
  counts,
}: {
  competitionId: number;
  counts: { open: number; unresolved: number; resolved: number };
}) {
  const base = `/competitions/${competitionId}`;
  // An empty list is a dead link, and a display-size 0 is the loudest possible
  // way to say "nothing here". Omit the route instead.
  const routes = [
    { n: counts.open, label: "Open props", path: "props/open" },
    { n: counts.unresolved, label: "Awaiting result", path: "props/awaiting" },
    { n: counts.resolved, label: "Resolved", path: "props/resolved" },
  ].filter((r) => r.n > 0);

  if (routes.length === 0) return null;

  return (
    <nav className="routes">
      {routes.map((r) => (
        <Link key={r.path} href={`${base}/${r.path}`}>
          <span className="n num">{r.n}</span>
          <span className="lbl">{r.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/**
 * The line beside the big ordinal. "Ranked", not "scored": an incomplete
 * forecaster has a score but no rank, so this is the field you are placed
 * against — which is why it is smaller than the masthead's forecaster count.
 */
export function ScoreLine({
  score,
  field,
  nextDue,
}: {
  score: number;
  field: number;
  /** Days to the soonest owed prop, when there is one. */
  nextDue?: number | null;
}) {
  return (
    <span className="of">
      of {field} ranked · <span className="val">{score.toFixed(3)}</span>
      {nextDue !== null && nextDue !== undefined && (
        <> · next due {nextDue <= 0 ? "today" : `in ${nextDue}d`}</>
      )}
    </span>
  );
}
