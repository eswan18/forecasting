import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

/**
 * The "Forecasting" brand mark: a small gauge glyph that echoes the
 * ForecastNeedle (a hairline arc + a single indigo needle + hub) followed by
 * the wordmark set in semibold, tight-tracked sans.
 *
 * Pure presentational leaf — no router/db coupling — so the navbar supplies the
 * surrounding <Link>, and it's trivial to render in Storybook.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn("inline-flex select-none items-center gap-2", className)}
    >
      <GaugeGlyph />
      <span className="text-base font-semibold tracking-tight text-foreground">
        Forecasting
      </span>
    </span>
  );
}

/**
 * A miniature gauge: a calm hairline band with one indigo needle. Colors are
 * all design tokens so it adapts to light/dark automatically. Deliberately
 * monochrome+indigo (no red→green likelihood gradient) to stay minimal.
 */
function GaugeGlyph() {
  return (
    <svg
      viewBox="0 0 22 20"
      className="h-5 w-[22px] shrink-0 overflow-visible"
      aria-hidden="true"
    >
      {/*
        The artwork is vertically centered in the 22x20 viewBox so the glyph
        sits on the same mid-line as the adjacent wordmark under `items-center`.
        The gauge baseline is at y=13: the arc rises ~9 units above it while the
        hub drops ~2.75 below, centering the painted bounds on y≈10. (Authoring
        the arc at y=15 left the glyph bottom-heavy, so it rendered low.)
      */}
      {/* Gauge band */}
      <path
        d="M 3 13 A 8 8 0 0 1 19 13"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Needle — the single indigo accent, pointing up and to the right */}
      <line
        x1={11}
        y1={13}
        x2={14.5}
        y2={6.2}
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Hub */}
      <circle
        cx={11}
        cy={13}
        r={2}
        fill="var(--background)"
        stroke="var(--foreground)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
