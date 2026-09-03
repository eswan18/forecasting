const loadingCss = `
.hxload {
  --paper: var(--riso-paper, #f4efe8);
  --ink: var(--riso-ink, #2b1e1a);
  --rule: color-mix(in oklab, var(--ink) 22%, transparent);
  --block: color-mix(in oklab, var(--ink) 11%, transparent);

  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
}
body:has(.hxload) { background: var(--riso-paper, #f4efe8); }

.hxload::before {
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
.hxload .col {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 3.5rem 1.75rem 5rem;
}

/* Blocks of ink where the words will be. The rules are the real ones — the
   sheet's frame is known before its content is, so it is printed first and
   only the copy is missing. */
.hxload i {
  display: block;
  height: 0.75rem;
  background: var(--block);
  animation: hxload-pulse 1.4s ease-in-out infinite;
}
.hxload .head i { height: 2.25rem; width: min(20rem, 70%); }
.hxload .head i + i { height: 0.75rem; width: min(11rem, 45%); margin-top: 1rem; }
.hxload .rule { border-bottom: 2px solid var(--ink); margin-top: 1.25rem; }

.hxload .row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 9rem;
  gap: 0 1.5rem;
  align-items: center;
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--rule);
}
.hxload .row i:last-child { justify-self: end; width: 3.5rem; }

/* Each row starts a beat later, so the sheet fills the way a page prints
   rather than blinking all at once. */
.hxload .row:nth-child(2) i { animation-delay: 0.08s; }
.hxload .row:nth-child(3) i { animation-delay: 0.16s; }
.hxload .row:nth-child(4) i { animation-delay: 0.24s; }
.hxload .row:nth-child(5) i { animation-delay: 0.32s; }
.hxload .row:nth-child(6) i { animation-delay: 0.4s; }

@keyframes hxload-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .hxload i { animation: none; }
}
@media (max-width: 46rem) {
  .hxload .row { grid-template-columns: minmax(0, 1fr) 3rem; }
  .hxload .row i:last-child { width: 2.5rem; }
}
`;

/** Widths that read as a column of claims rather than a stack of identical bars. */
const WIDTHS = ["78%", "54%", "88%", "42%", "70%", "60%"];

/**
 * What a sheet looks like before its content arrives.
 *
 * A spinner says only that something is happening; this says what is coming —
 * the masthead, the rule that opens the section, and a row per item — so the
 * page does not jump into a different shape when it lands.
 */
export function LoadingSheet({
  rows = 6,
  label = "Loading",
}: {
  rows?: number;
  /** Announced to screen readers, which have no use for the blocks. */
  label?: string;
}) {
  return (
    <div className="hxload" role="status" aria-label={label}>
      <style dangerouslySetInnerHTML={{ __html: loadingCss }} />
      <div className="col">
        <div className="head">
          <i />
          <i />
        </div>
        <div className="rule" />
        {WIDTHS.slice(0, rows).map((width) => (
          <div className="row" key={width}>
            <i style={{ width }} />
            <i />
          </div>
        ))}
      </div>
    </div>
  );
}
