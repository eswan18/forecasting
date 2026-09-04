/** The mark's own proportions, from its viewBox: wide and short. */
const RATIO = 48 / 170;

/**
 * The Haruspex mark: a pair of gauge dials read like spectacles, arm swept up.
 *
 * Drawn in `currentColor`, stroke and fill both, so it takes the ink of
 * whatever it is set in — ink on paper in the chrome, paper on ink inside a
 * plate, red where red is the accent — and inverts with the edition for free.
 * Give it a colour by setting `color` on it or on a parent, never by editing
 * this file.
 *
 * It is about three and a half times wider than it is tall, so a width that
 * suits a square glyph will render this far too small; size it against the
 * height you want. Legible down to roughly 40px wide, below which the ticks
 * and the needles silt up.
 */
export function Haruspecs({
  width = 52,
  className,
  title,
}: {
  /** Width in px; the height follows the mark's own proportions. */
  width?: number;
  className?: string;
  /**
   * An accessible name. Omit where the mark sits beside the word "Haruspex" —
   * it is then decoration, and naming it twice is noise in a screen reader.
   */
  title?: string;
}) {
  return (
    <svg
      className={className}
      width={width}
      height={width * RATIO}
      viewBox="0 -7 170 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* the two dials */}
      <path
        d="M23 36V28a21 21 0 0 1 42 0v8zM75 36V28a21 21 0 0 1 42 0v8z"
        strokeWidth={2.7}
      />
      {/* The ticks on each dial. Drawn twice rather than once with a
          <use href="#id">, because the navbar renders the mark twice on one
          page — desktop bar and mobile drawer — and that would duplicate the
          id. A transform costs nothing and keeps the mark self-contained. */}
      {[0, 52].map((dx) => (
        <g key={dx} transform={`translate(${dx} 0)`}>
          <path d="M23 28h3.75M44 7v3.75M65 28h-3.75" strokeWidth={1.5} />
          <path d="M29.2 13.2l1.5 1.5M58.8 13.2l-1.5 1.5" strokeWidth={1.2} />
        </g>
      ))}
      {/* the needles */}
      <g fill="currentColor" stroke="none">
        <polygon points="55,17 43.6,31.9 40.1,28.4" />
        <polygon points="107,17 95.6,31.9 92.1,28.4" />
      </g>
      {/* the bridge, and the arms swept up off the right */}
      <path d="M65 28h10M24.6 26.9l39.4-27.6q3.3-2.3 5.6 1l2.3 3.3M117 28l41-28.7q3.3-2.3 5.6 1l2.3 3.3" />
    </svg>
  );
}
