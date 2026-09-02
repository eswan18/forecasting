import Link from "next/link";
import { Archivo, Roboto_Mono } from "next/font/google";

/**
 * Haruspex — the signed-out landing page.
 *
 * Rendered at "/" for visitors with no session; signed-in users get the
 * dashboard instead.
 *
 * A risograph pamphlet: two inks on warm stock, a halftone screen that lives in
 * the ink rather than on the paper, one registration error (6px) reused wherever
 * the drums meet, hard edges, and a big number as the argument.
 *
 * "Haruspex" is treated as an abstract name — no divination copy anywhere.
 *
 * The page is built around a giant gauge — the app's own forecast needle, blown
 * up and set in the right margin. The dial is a thin solid rule; the needle is
 * the screened plate, and it wavers, because a reading that will not sit still
 * is the entire subject. Copy stays left of the sheet, the instrument to its
 * right, so the two never collide.
 */

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--hx3-sans",
});
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--hx3-mono",
});

/** How scoring works. The 100% rows bracket the rest. */
const PENALTIES = [
  { said: "100%", outcome: "Yes", math: "(1.00 − 1)²", cost: "0.000", tone: "good" },
  { said: "50%", outcome: "Yes", math: "(0.50 − 1)²", cost: "0.250", tone: "flat" },
  { said: "90%", outcome: "No", math: "(0.90 − 0)²", cost: "0.810", tone: "bad" },
  { said: "100%", outcome: "No", math: "(1.00 − 0)²", cost: "1.000", tone: "bad" },
];

const css = `
.hx3 {
  --paper: oklch(95.8% 0.012 62);
  --ink: oklch(21% 0.022 32);
  --red: oklch(57% 0.165 22);
  /* prints darker than it looks in the drum — and clears AA at small sizes */
  --red-text: oklch(52% 0.16 22);
  --rule: oklch(21% 0.022 32 / 0.22);
  --ink-muted: oklch(21% 0.022 32 / 0.66);
  --offset: 6px;

  font-family: var(--hx3-sans), ui-sans-serif, system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}
body:has(.hx3) { background: oklch(95.8% 0.012 62); }
/* The sheet is the whole page — the app's navbar is for signed-in users, so it
   stands down wherever this renders. Done in CSS rather than in the navbar so
   the server-rendered markup is already correct and nothing flashes. */
body:has(.hx3) nav { display: none; }

/* The faintest tooth on the stock, set at 45 degrees like any halftone screen.
   Rotating the lattice rather than the element: a 45-degree square lattice is a
   checkerboard, so two offset gradients give full coverage at any page height. */
.hx3::before {
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

/* ---- the gauge ----
   A giant version of the app's own forecast needle. Two layers so the drums
   differ: the dial is solid and thin, the needle is screened. Anchored to the
   centre of the sheet rather than the viewport so it keeps clear of the text
   column at every width. */
.hx3 .gauge {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  top: 20.5rem;
  left: 50%;
  margin-left: 6.5rem;
  width: 48rem;
  aspect-ratio: 1000 / 700;
}
.hx3 .gauge svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
/* the needle carries the halftone; the mask is in CSS pixels so the screen
   stays circular no matter how the artwork is scaled */
.hx3 .gauge .ink {
  -webkit-mask-image: radial-gradient(#000 1.15px, transparent 1.45px);
  mask-image: radial-gradient(#000 1.15px, transparent 1.45px);
  -webkit-mask-size: 7px 7px;
  mask-size: 7px 7px;
}

/* the needle hunts, the way a real one never quite settles */
.hx3 .needle {
  transform-box: view-box;
  transform-origin: 500px 620px;
  animation: hx3-waver 11s ease-in-out infinite;
}
@keyframes hx3-waver {
  0%   { transform: rotate(0deg); }
  14%  { transform: rotate(3.1deg); }
  27%  { transform: rotate(-1.9deg); }
  41%  { transform: rotate(4.4deg); }
  55%  { transform: rotate(0.6deg); }
  68%  { transform: rotate(-3.3deg); }
  82%  { transform: rotate(1.7deg); }
  100% { transform: rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .hx3 .needle { animation: none; }
}

/* Below the width where the column stops leaving a free right margin, the
   gauge has nowhere to sit but behind the copy — so it steps back, then goes. */
@media (max-width: 64rem) {
  .hx3 .gauge { opacity: 0.45; }
}
@media (max-width: 48rem) {
  .hx3 .gauge { display: none; }
}

.hx3 .col {
  position: relative;
  z-index: 1;
  max-width: 52rem;
  margin: 0 auto;
  padding: 0 1.75rem;
}

.hx3 .mono {
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hx3 .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 0;
  border-bottom: 3px solid var(--ink);
  flex-wrap: wrap;
}

/* ---- the big number, printed twice ---- */
.hx3 .hero { padding: 5rem 0 0; position: relative; }
.hx3 .hero > * { position: relative; z-index: 1; }

.hx3 .fig {
  display: block;
  color: var(--red-text);
  margin-bottom: 1.25rem;
}

.hx3 h1 { margin: 0; font-weight: inherit; }
.hx3 .bignum {
  position: relative;
  /* shrink-to-fit so the screened block behind it hugs the glyphs */
  display: inline-block;
  font-weight: 800;
  font-size: clamp(5rem, 23vw, 14rem);
  line-height: 0.82;
  letter-spacing: -0.055em;
  /* Archivo's zero carries a left side-bearing that is glaring at 14rem;
     hang it so the number sits on the column's one hard left edge. */
  margin-left: -0.05em;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 40rem) {
  .hx3 .bignum { font-size: clamp(5rem, 30vw, 14rem); }
}
/* A hard-edged screened block thrown off register behind the numeral. */
.hx3 .bignum::before {
  content: "";
  position: absolute;
  inset: -0.04em -6% 0.06em -3%;
  background-image: radial-gradient(var(--red) 1.1px, transparent 1.4px);
  background-size: 7px 7px;
  transform: translate(calc(var(--offset) * -2.2), calc(var(--offset) * 1.8));
  opacity: 0.4;
  pointer-events: none;
  z-index: -1;
}
.hx3 .bignum .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(var(--offset), var(--offset));
  mix-blend-mode: multiply;
  z-index: 0;
  -webkit-user-select: none;
  user-select: none;
}
/* Pinholes in the black plate so the red drum shows through — the most
   recognisable riso artefact, and it doesn't depend on the offset size. */
.hx3 .bignum .top-ink {
  position: relative;
  z-index: 1;
  background-image: radial-gradient(transparent 0.5px, var(--ink) 0.75px);
  background-size: 5px 5px;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.hx3 .herolabel {
  display: block;
  margin: 2rem 0 0;
  font-size: 1.44rem;
  line-height: 1.35;
  font-weight: 600;
  max-width: 22ch;
  letter-spacing: -0.02em;
}
.hx3 .herobody {
  margin: 1.25rem 0 0;
  max-width: 42ch;
  font-size: 1.0625rem;
}
/* An inline background, not a positioned pseudo-element: a ::before only covers
   the first line fragment and leaves a stray bar when the phrase wraps. */
.hx3 .herobody strong {
  font-weight: 600;
  padding: 0.2em 0.25rem;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background-color: oklch(57% 0.165 22 / 0.13);
  background-image: radial-gradient(oklch(57% 0.165 22 / 0.55) 0.9px, transparent 1.1px);
  background-size: 5px 5px;
}

/* ---- sections ---- */
.hx3 section { margin: 7rem 0 0; }
.hx3 h2 {
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 0 0 1.75rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--rule);
  max-width: 38rem;
}

/* ---- penalty table ---- */
.hx3 table {
  width: 100%;
  max-width: 38rem;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.hx3 th {
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: left;
  font-weight: 400;
  padding: 0 0 0.875rem;
  border-bottom: 1px solid var(--rule);
}
.hx3 th:last-child, .hx3 td:last-child { text-align: right; }
.hx3 td {
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--rule);
  font-size: 1.0625rem;
  /* preflight centres table cells, which floats the penalty above its row
     because that cell carries a second line; baseline puts every figure in
     the row on one line and lets the working hang under it */
  vertical-align: baseline;
}
.hx3 .said, .hx3 .cost {
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
.hx3 .cost { font-weight: 700; }
/* the working, under the figure it produces */
.hx3 .math {
  display: block;
  margin-top: 0.375rem;
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.hx3 .formula {
  margin-top: 1.5rem;
  color: var(--ink-muted);
}
.hx3 tr.bad .cost { color: var(--red-text); }
.hx3 tr.flat .cost { color: var(--ink-muted); }

/* ---- cta ---- */
.hx3 .cta { margin: 7rem 0 0; padding-bottom: 5rem; }
/* the question is the quiet setup; the answer is the headline */
.hx3 .cta .ask {
  font-size: 1.0625rem;
  font-weight: 400;
  color: var(--ink-muted);
  max-width: none;
  margin: 0 0 0.625rem;
}
.hx3 .cta .line {
  font-size: 1.728rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  max-width: 34ch;
  margin: 0 0 2rem;
}
/* Built the way the press works: the black plate carries the outline and the
   label, the red plate prints the fill and slips by the registration vector. */
.hx3 a.btn {
  position: relative;
  display: inline-block;
  border-radius: 0;
  /* opaque paper under the label (14.7:1); the red plate shows only where it
     slips out of register, which is what a mis-registered fill looks like */
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  padding: 1.125rem 2.5rem;
  text-decoration: none;
  font-family: var(--hx3-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.hx3 a.btn::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  background: var(--red);
  transform: translate(var(--offset), var(--offset));
  transition: transform 140ms ease;
}
/* hover completes the print: plates register and the black floods */
.hx3 a.btn:hover { background: var(--ink); color: var(--paper); }
.hx3 a.btn:hover::before { transform: none; }
.hx3 a.btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }
/* masthead size: same press, smaller sheet */
.hx3 a.btn.small {
  padding: 0.5rem 1.25rem;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
}


.hx3 .colophon {
  border-top: 3px solid var(--ink);
  padding: 1.5rem 0 4rem;
}
.hx3 .colophon p { max-width: none; }

/* ---- fade-up stagger ---- */
@media (prefers-reduced-motion: no-preference) {
  .hx3 .rise { animation: hx3-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hx3 .fig { animation-delay: 40ms; }
  .hx3 .bignum { animation-delay: 120ms; }
  .hx3 .bignum .ghost { animation-delay: 280ms; animation-name: hx3-register; }
  .hx3 .herolabel { animation-delay: 420ms; }
  .hx3 .herobody { animation-delay: 520ms; }
  .hx3 section.rise:nth-of-type(1) { animation-delay: 60ms; }
  .hx3 section.rise:nth-of-type(2) { animation-delay: 160ms; }
  .hx3 section.rise:nth-of-type(3) { animation-delay: 260ms; }
}
@keyframes hx3-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes hx3-register {
  from {
    opacity: 0;
    transform: translate(calc(var(--offset) * 3), calc(var(--offset) * 3));
  }
  to {
    opacity: 1;
    transform: translate(var(--offset), var(--offset));
  }
}
`;

// Gauge geometry, in viewBox units. The sweep and the value→rotation mapping
// are the same ones `components/ui/forecast-needle.tsx` uses, so this reads as
// a giant copy of the app's own instrument rather than a new invention.
const SWEEP = 140;
const CX = 500;
const CY = 620;
const R = 430;

/** Point on the dial for a value in [0,1]; 0 is the upper-left end. */
function dialPoint(value: number, radius: number) {
  const deg = 90 + SWEEP / 2 - value * SWEEP;
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

/** Clockwise rotation for a needle drawn pointing straight up. */
const valueToRotation = (value: number) => (value - 0.5) * SWEEP;

/** The needle, drawn straight up from the hub and tapered toward the tip. */
function needlePath() {
  const tipY = CY - 412;
  const tailY = CY + 58;
  // Wide enough that the halftone reads as a screen inside a solid needle
  // rather than eating it: ~40px across the base at the rendered size.
  const tailW = 34;
  const tipW = 6;
  return [
    `M ${CX - tailW} ${tailY}`,
    `L ${CX - tipW} ${tipY}`,
    `L ${CX + tipW} ${tipY}`,
    `L ${CX + tailW} ${tailY}`,
    "Z",
  ].join(" ");
}

/**
 * The gauge: a needle in a wheel.
 *
 * The dial is a thin solid rule with graduations — the base the needle rests
 * on. The needle itself is the screened plate, and it wavers, because the whole
 * product is about a reading that will not sit still.
 */
function Gauge() {
  const start = dialPoint(0, R);
  const end = dialPoint(1, R);
  const resting = 0.56;

  return (
    <div className="gauge" aria-hidden="true">
      {/* the dial: solid, thin */}
      <svg viewBox="0 0 1000 700">
        {/* the dial: duller and heavier than the needle, so it reads as the
            base the needle rests on rather than competing with it */}
        <g
          stroke="var(--ink)"
          strokeOpacity="0.28"
          fill="none"
          strokeLinecap="round"
        >
          <path
            d={`M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`}
            strokeWidth="11"
          />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const a = dialPoint(v, R + 14);
            const b = dialPoint(v, R + 46);
            return (
              <line key={v} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth="6" />
            );
          })}
          {[0.125, 0.375, 0.625, 0.875].map((v) => {
            const a = dialPoint(v, R + 14);
            const b = dialPoint(v, R + 31);
            return (
              <line key={v} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth="4" />
            );
          })}
        </g>
        <circle cx={CX} cy={CY} r="31" fill="var(--ink)" fillOpacity="0.42" />
      </svg>

      {/* the needle: screened, and never quite still */}
      <svg viewBox="0 0 1000 700" className="ink">
        <g transform={`rotate(${valueToRotation(resting)} ${CX} ${CY})`}>
          <g className="needle">
            <path d={needlePath()} fill="var(--red)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export function SignedOutLanding() {
  return (
    <div className={`hx3 ${archivo.variable} ${robotoMono.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Gauge />

      <div className="col">
        <header className="top">
          <span className="mono">Haruspex</span>
          <Link className="btn small" href="/login">
            Sign in
          </Link>
        </header>

        <div className="hero">
          <span className="mono fig rise">Fig. 1 — a perfect score</span>
          <h1>
            <span className="bignum rise">
              <span className="ghost rise" aria-hidden="true">
                0.000
              </span>
              <span className="top-ink">0.000</span>
            </span>
            <span className="herolabel rise">
              The Brier score of a forecaster who is never wrong.
            </span>
          </h1>
          <p className="herobody rise">
            Nobody gets there. <strong>But you can try.</strong> Forecast
            against friends and strangers on sports, world politics, and even
            your personal life.
          </p>
        </div>

        <section className="rise">
          <h2>How scoring works</h2>
          <table>
            <thead>
              <tr>
                <th>Your forecast</th>
                <th>Did it happen?</th>
                <th>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {PENALTIES.map((row) => (
                <tr key={`${row.said}-${row.outcome}`} className={row.tone}>
                  <td className="said">{row.said}</td>
                  <td>{row.outcome}</td>
                  <td className="cost">
                    {row.cost}
                    <span className="math">{row.math}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mono formula">
            Penalty = (forecast − outcome)² · yes = 1, no = 0
          </p>
        </section>


        <section className="cta rise">
          <p className="ask">You called it?</p>
          <p className="line">
            Not unless you recorded it on Haruspex.
          </p>
          <Link className="btn" href="/login">
            Sign in to forecast
          </Link>
        </section>

        <div className="colophon">
          <p className="mono">
            Printed in two colours · Bright Red on Warm White
          </p>
        </div>
      </div>
    </div>
  );
}
