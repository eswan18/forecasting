import Link from "next/link";
import { Archivo, Roboto_Mono } from "next/font/google";
import type { CSSProperties } from "react";
import type { RisoSpec } from "./riso-seeds";

/**
 * The Riso design language, parameterised.
 *
 * Riso's invariants live here and do not vary: two inks on stock, a halftone
 * screen that lives in the ink rather than on the paper, one registration error
 * reused everywhere the drums meet, hard edges, Archivo + Roboto Mono, a single
 * editorial column, a big number as the argument.
 *
 * What the seed varies is expressed entirely as custom properties, so every
 * variant shares one stylesheet and can only differ along the drawn axes.
 */

export const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--riso-sans",
});
export const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--riso-mono",
});

export function risoVars(spec: RisoSpec): CSSProperties {
  return {
    "--paper": spec.stock.value,
    "--ink": spec.dark.value,
    "--ink2": spec.ink.fill,
    "--ink2-text": spec.ink.text,
    "--screen": `${spec.screen.size}px`,
    "--dot": `${spec.screen.dot}px`,
    "--dot-out": `${spec.screen.dot + 0.2}px`,
    "--reg-x": `${spec.reg.x}px`,
    "--reg-y": `${spec.reg.y}px`,
    "--measure": spec.measure.value,
    "--weight": spec.display.weight,
    "--case": spec.display.upper ? "uppercase" : "none",
    "--tracking": spec.display.tracking,
    "--rule": spec.rule.value,
    "--blend": spec.blend,
  } as CSSProperties;
}

export const RISO_CSS = `
.riso {
  --rule-color: color-mix(in oklab, var(--ink) 22%, transparent);
  /* One muted ink instead of five different percentages. Fewer inks is more
     riso, and 66% is the lightest mix that still clears AA on every stock. */
  --ink-muted: color-mix(in oklab, var(--ink) 66%, transparent);
  /* Paper is not a seeded axis, and inline tints are only two rows tall, so
     neither should inherit a 12pt screen — that turns stock into a dotted pad
     and tints into dirt. The seeded coarseness belongs on the ink, in area. */
  --tooth: min(var(--screen), 6px);
  --tint-screen: min(var(--screen), 6px);
  font-family: var(--riso-sans), ui-sans-serif, system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}
body:has(.riso) { background: var(--paper); }

/* The faintest tooth on the stock, set at 45 degrees like any halftone screen —
   axis-aligned dots over a flat neutral read as graph paper. Rotating the
   *lattice* rather than the element: a 45-degree square lattice is just a
   checkerboard, so two offset gradients give the same pitch with full coverage
   at any page height. (Rotating the box leaves bare corners on a long page.) */
.riso::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(var(--ink) 0.7px, transparent 0.9px),
    radial-gradient(var(--ink) 0.7px, transparent 0.9px);
  background-size: calc(var(--tooth) * 1.414) calc(var(--tooth) * 1.414);
  background-position: 0 0, calc(var(--tooth) * 0.707) calc(var(--tooth) * 0.707);
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
}

.riso .col {
  position: relative;
  z-index: 1;
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 1.75rem;
}

.riso .mono {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.riso .ink2 { color: var(--ink2-text); }

.riso .top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 0;
  border-bottom: var(--rule) solid var(--ink);
  flex-wrap: wrap;
}
.riso .top a { color: var(--ink2-text); }

/* ---- the big number, printed twice ---- */
.riso .hero { padding: 5.5rem 0 0; position: relative; }
.riso .hero::before {
  content: "";
  position: absolute;
  display: none;
}
/* A hard-edged screened block thrown well off register behind the numeral.
   An airbrushed fade contradicts the hard-edges invariant, and this is the one
   place the seeded screen shows as area — a polka block at 12pt, a smooth tint
   at 4pt. Anchored to .bignum so it scales with whichever figure is printed. */
.riso .bignum::before {
  content: "";
  position: absolute;
  inset: -0.04em -6% 0.06em -3%;
  background-image: radial-gradient(var(--ink2) var(--dot), transparent var(--dot-out));
  background-size: var(--screen) var(--screen);
  transform: translate(calc(var(--reg-x) * -2.2), calc(var(--reg-y) * 1.8));
  opacity: 0.45;
  pointer-events: none;
  z-index: -1;
}
.riso .hero > * { position: relative; z-index: 1; }

.riso .fig { display: block; color: var(--ink2-text); margin-bottom: 1.25rem; }

.riso h1 { margin: 0; font-weight: inherit; }
.riso .bignum {
  position: relative;
  /* shrink-to-fit so the screened block behind it hugs the glyphs rather than
     the full column */
  display: inline-block;
  font-weight: var(--weight);
  font-size: clamp(5rem, 30vw, calc(var(--measure) / 3.7));
  line-height: 0.82;
  letter-spacing: var(--tracking);
  margin-left: -0.05em;
  font-variant-numeric: tabular-nums;
}
@media (min-width: 40rem) {
  .riso .bignum { font-size: clamp(5rem, 23vw, calc(var(--measure) / 3.7)); }
}
.riso .bignum .ghost {
  position: absolute;
  inset: 0;
  color: var(--ink2);
  transform: translate(var(--reg-x), var(--reg-y));
  mix-blend-mode: var(--blend);
  z-index: 0;
  -webkit-user-select: none;
  user-select: none;
}
/* Pinholes in the black plate, so the drum underneath shows through — the most
   recognisable riso artefact, and unlike the offset it does not shrink when the
   registration is tight. (background-clip:text has been buggy in Safari on
   transformed elements; the entrance animation lives on .bignum, not here.) */
.riso .bignum .top-ink {
  position: relative;
  z-index: 1;
  background-image: radial-gradient(transparent calc(var(--dot) * 0.55), var(--ink) calc(var(--dot) * 0.8));
  background-size: var(--screen) var(--screen);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.riso .herolabel {
  display: block;
  margin: 2rem 0 0;
  font-size: 1.44rem;
  line-height: 1.35;
  font-weight: 600;
  max-width: 22ch;
  letter-spacing: -0.02em;
  text-transform: var(--case);
}
.riso .herobody { margin: 1.5rem 0 0; max-width: 48ch; font-size: 1.0625rem; }
/* A screened tint pass. This is an inline background rather than a positioned
   pseudo-element so it survives wrapping — an absolutely positioned ::before
   only covers the first line fragment and leaves a stray bar on the rest. */
.riso .herobody strong {
  font-weight: 600;
  padding: 0.2em 0.25rem;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background-color: color-mix(in oklab, var(--ink2) 14%, transparent);
  background-image: radial-gradient(color-mix(in oklab, var(--ink2) 55%, transparent) 0.9px, transparent 1.1px);
  background-size: var(--tint-screen) var(--tint-screen);
}

/* ---- sections ---- */
.riso section { margin: 6.5rem 0 0; }
.riso h2 {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--ink2-text);
  margin: 0 0 1.75rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--rule-color);
}
.riso p { margin: 0 0 1.25rem; max-width: 52ch; }
.riso p:last-child { margin-bottom: 0; }

/* ---- tables ---- */
.riso table { width: 100%; max-width: 42rem; border-collapse: collapse; margin-top: 0.5rem; }
.riso th {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: left;
  font-weight: 400;
  padding: 0 0 0.875rem;
  border-bottom: 1px solid var(--rule-color);
}
.riso th.r, .riso td.r { text-align: right; padding-left: 1.25rem; white-space: nowrap; }
.riso td {
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--rule-color);
  font-size: 1.0625rem;
}
.riso td .said {
  display: block;
  margin-top: 0.375rem;
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.riso .num {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
.riso .cost { font-weight: 700; }
.riso tr.bad .cost { color: var(--ink2-text); }
.riso tr.flat .cost { color: var(--ink-muted); }
.riso .note {
  margin-top: 1.5rem;
  font-size: 0.9375rem;
  border-left: var(--rule) solid var(--ink2);
  padding-left: 1rem;
  max-width: 46ch;
}

/* ---- ruled lists with dot leaders ---- */
.riso ul { list-style: none; margin: 0; padding: 0; max-width: 42rem; }
.riso li {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.875rem;
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--rule-color);
  font-size: 1.0625rem;
}
/* The question hugs its own text so the leader starts where the words end — a
   leader that begins somewhere else is just a dash. Leader and figure travel
   together in .tail, so when a row runs over they drop to the next line as a
   unit with the figure still right-aligned. */
.riso li .q { flex: 0 1 auto; min-width: 0; }
.riso li .tail {
  display: flex;
  flex: 1 1 6rem;
  align-items: baseline;
  gap: 0.875rem;
}
.riso li .bullet {
  font-family: var(--riso-mono), ui-monospace, monospace;
  color: var(--ink2-text);
  font-weight: 700;
  flex: none;
}
.riso li .lead {
  flex: 1;
  height: 0;
  border-bottom: 1px dotted color-mix(in oklab, var(--ink) 35%, transparent);
  transform: translateY(-0.3em);
  min-width: 1.5rem;
}
.riso li .fig-r {
  flex: none;
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink2-text);
}
.riso li .fig-r span { color: var(--ink-muted); }

/* ---- stat band ---- */
.riso .stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
  gap: 1.5rem 2rem;
  padding: 2rem 0;
  border-top: var(--rule) solid var(--ink);
  border-bottom: 1px solid var(--rule-color);
}
.riso .stat b {
  display: block;
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: clamp(1.5rem, calc(var(--measure) / 24), 2.6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}
.riso .stat span {
  display: block;
  margin-top: 0.5rem;
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ---- cta ---- */
.riso .cta { margin: 6.5rem 0 0; padding-bottom: 6rem; }
.riso .cta p {
  font-size: 1.728rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  max-width: 22ch;
  margin: 0 0 2rem;
  text-transform: var(--case);
}
/* Built the way the press works: the black plate carries the outline and the
   label, the coloured plate prints the fill and slips by the one registration
   vector. Keeps the button's misregistration in the same direction as the
   hero's ghost, and puts the label on ink rather than on a fill it can't
   contrast against. */
.riso a.btn {
  position: relative;
  display: inline-block;
  border-radius: 0;
  /* Opaque paper under the label: ink-on-paper is 14.7:1, and the plate then
     shows only where it slips out of register, which is what a mis-registered
     fill actually looks like. No fill-under-label passes AA on all eight inks. */
  background: var(--paper);
  border: 2px solid var(--ink);
  color: var(--ink);
  padding: 1.125rem 2.5rem;
  text-decoration: none;
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.riso a.btn::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  /* an 85% screen rather than a solid flood — keeps the dark label clear of the
     fill on every ink in the catalogue, and a screened tint is riso anyway */
  background: color-mix(in oklab, var(--ink2) 85%, var(--paper));
  transform: translate(var(--reg-x), var(--reg-y));
  transition: transform 140ms ease;
}
/* hover completes the print: plates register and the black floods */
.riso a.btn:hover { background: var(--ink); color: var(--paper); }
.riso a.btn:hover::before { transform: none; }
.riso a.btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; }

/* the secondary link must not inherit the CTA headline's size */
.riso .cta .alt {
  display: block;
  margin-top: 1.75rem;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  max-width: none;
}
.riso .cta .alt a { color: var(--ink2-text); }

/* the rule spans the measure; only the text is limited, so a 6px rule doesn't
   look like a rule that failed to print */
.riso .colophon {
  border-top: var(--rule) solid var(--ink);
  padding: 1.5rem 0 0;
}
.riso .colophon p { max-width: 46ch; }
.riso footer {
  padding: 1.25rem 0 3rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.riso footer a { color: var(--ink2-text); }

/* ---- competition page ---- */
/* The season header is a kicker over the big number, not a title block —
   the interior page opens the way the cover does. */
.riso .comphead { padding: 2.5rem 0 0; }
.riso .comphead .kicker {
  display: flex;
  gap: 0.75rem 1.5rem;
  flex-wrap: wrap;
  align-items: baseline;
}
.riso .status { color: var(--ink2-text); }
.riso .comphead h1.season {
  font-family: var(--riso-sans), ui-sans-serif, sans-serif;
  font-weight: var(--weight);
  /* the display tracking is tuned for a 14rem numeral; on words it eats spaces */
  letter-spacing: -0.03em;
  text-transform: var(--case);
  font-size: 1.728rem;
  line-height: 1.15;
  color: var(--ink);
  border: 0;
  padding: 0;
  margin: 1rem 0 0;
}

/* the interior figure prints smaller than the cover's, so the two openings
   are a pair rather than a repeat */
.riso .bignum.interior { font-size: clamp(3.5rem, 17vw, calc(var(--measure) / 5.3)); }

/* Standings share the landing's leader-list vocabulary rather than a sidebar,
   so the single editorial column survives the app screen. */
.riso li.stand { gap: 1.25rem; }
.riso li.stand .rank {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--ink-muted);
  flex: none;
  width: 2rem;
}
.riso li.flat { color: var(--ink-muted); font-style: italic; }
/* the standings get the same column kickers as the tables, so both read as one object */
.riso li.head {
  font-family: var(--riso-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 0 0 0.875rem;
}
.riso li.head .lead { border-bottom-color: transparent; }
.riso li.head .fig-r { color: var(--ink-muted); }
.riso .you {
  font-weight: 700;
  padding: 0.2em 0.4rem;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background-color: color-mix(in oklab, var(--ink2) 16%, transparent);
  background-image: radial-gradient(color-mix(in oklab, var(--ink2) 55%, transparent) 0.9px, transparent 1.1px);
  background-size: var(--tint-screen) var(--tint-screen);
}

/* ---- fade-up stagger ---- */
@media (prefers-reduced-motion: no-preference) {
  .riso .rise { animation: riso-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  .riso .fig { animation-delay: 40ms; }
  .riso .bignum { animation-delay: 120ms; }
  .riso .bignum .ghost { animation-delay: 280ms; animation-name: riso-register; }
  .riso .herolabel { animation-delay: 420ms; }
  .riso .herobody { animation-delay: 520ms; }
  .riso section.rise:nth-of-type(1) { animation-delay: 60ms; }
  .riso section.rise:nth-of-type(2) { animation-delay: 160ms; }
  .riso section.rise:nth-of-type(3) { animation-delay: 260ms; }
  .riso section.rise:nth-of-type(4) { animation-delay: 360ms; }
}
@keyframes riso-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes riso-register {
  from { opacity: 0; transform: translate(calc(var(--reg-x) * 3), calc(var(--reg-y) * 3)); }
  to { opacity: 1; transform: translate(var(--reg-x), var(--reg-y)); }
}

/* ---- small screens ---- */
@media (max-width: 40rem) {
  /* four stats, so two columns packs 2x2 with nothing stranded */
  .riso .stats { grid-template-columns: repeat(2, 1fr); gap: 1.5rem 1rem; }
  .riso .stat b { font-size: 1.5rem; }
  .riso .comphead { padding-top: 1.5rem; }
  .riso .hero { padding-top: 3rem; }
  .riso section { margin-top: 4rem; }
}
`;

export function RisoFrame({
  spec,
  children,
}: {
  spec: RisoSpec;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`riso ${archivo.variable} ${robotoMono.variable}`}
      style={risoVars(spec)}
    >
      <style dangerouslySetInnerHTML={{ __html: RISO_CSS }} />
      <div className="col">{children}</div>
    </div>
  );
}

export function RisoFooter({ spec, here }: { spec: RisoSpec; here: string }) {
  const other =
    here === "landing"
      ? { href: `/landing/${spec.slug}/competition`, label: "See a competition" }
      : { href: `/landing/${spec.slug}`, label: "Back to the landing page" };
  return (
    <>
      <div className="colophon">
        <p className="mono">
          Printed in two colours · {spec.ink.name} on {spec.stock.name} ·{" "}
          {spec.screen.name} screen · Season 2026
        </p>
      </div>
      <footer>
        <Link className="mono" href={other.href}>
          {other.label}
        </Link>
        <span className="mono">{spec.name}</span>
        <Link className="mono" href="/landing">
          All versions
        </Link>
      </footer>
    </>
  );
}
