/**
 * The measure one forecaster's progress is drawn as, scoped to `.hxp`.
 *
 * Not a bar. The app draws a proportion as a measure — a hairline for the
 * whole, ink over the done part, a square where the ink stops — and every row
 * on this page is drawn against the same 0-100 axis with the same ten stops.
 * That is the whole point: a filled bar per row can only be read one row at a
 * time, whereas a column of end marks on one shared axis answers the question
 * the page exists for, which is who is behind, before a single figure is read.
 *
 * The 100 stop is printed heavier than the rest: it is the only position on
 * the axis that means anything on its own, so a finished forecaster is the
 * one whose mark sits on the goal line.
 */
export const meterCss = `
.hxp .meter {
  display: block;
  position: relative;
  height: 1.25rem;
}
.hxp .meter .axisline {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: color-mix(in oklab, var(--ink) 16%, transparent);
  transform: translateY(-50%);
}
.hxp .meter .grid {
  position: absolute;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: color-mix(in oklab, var(--ink) 10%, transparent);
}
.hxp .meter .grid.goal {
  top: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--ink) 26%, transparent);
}
/* the done part, printed over the hairline that stands for the whole */
.hxp .meter .done {
  position: absolute;
  top: 50%;
  left: 0;
  height: 2px;
  background: var(--ink);
  transform: translateY(-50%);
}
.hxp .meter .mark {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  background: var(--ink);
  transform: translate(-50%, -50%);
}
/* A row whose data failed to load prints the axis and nothing on it: an
   unloaded forecaster is not a forecaster who has done nothing. */
.hxp .meter.unknown .axisline,
.hxp .meter.unknown .grid {
  opacity: 0.5;
}
`;

/** One stop every tenth, so the axis reads as ruled paper rather than a track. */
const STOPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * One forecaster's progress on the shared 0-100 axis.
 *
 * `value` is a fraction in [0, 1], or null when that forecaster's counts could
 * not be loaded — then the axis prints empty rather than putting a mark at
 * zero, which would read as "has forecast nothing".
 */
export function ForecastProgressMeter({ value }: { value: number | null }) {
  const pct = value === null ? null : Math.max(0, Math.min(1, value)) * 100;

  return (
    <span className={pct === null ? "meter unknown" : "meter"}>
      <span className="axisline" />
      {STOPS.map((stop) => (
        <span
          key={stop}
          className={stop === 100 ? "grid goal" : "grid"}
          style={{ left: `${stop}%` }}
        />
      ))}
      {pct !== null && (
        <>
          <span className="done" style={{ width: `${pct}%` }} />
          {pct > 0 && <span className="mark" style={{ left: `${pct}%` }} />}
        </>
      )}
    </span>
  );
}
