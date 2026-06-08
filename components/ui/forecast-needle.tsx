"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * A single needle on the half-wheel.
 * - `value` is a probability in [0, 1] (clamped).
 * - `color` is any CSS color string used as the needle's fill. It can be a
 *   Tailwind palette var (`var(--color-red-500)`), a chart token
 *   (`var(--chart-1)`), or a hex/rgb string. Defaults to the theme `--primary`.
 * - `label` is an optional short caption shown in the hover/tap tooltip
 *   (e.g. "You", "Avg").
 */
export type Needle = {
  value: number;
  color?: string;
  label?: string;
};

export interface ForecastNeedleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** One or more needles drawn on the same half-wheel. */
  needles: Needle[];
  size?: "sm" | "md" | "lg";
  /** Show the 0% / 100% axis labels. Defaults to true. */
  showAxisLabels?: boolean;
}

// ---------------------------------------------------------------------------
// Geometry (pure, exported for testing)
// ---------------------------------------------------------------------------

/**
 * Total angular sweep of the gauge, in degrees. 180 would be a flat
 * semicircle; smaller values lift the ends off the baseline, making the gauge
 * taller and narrower.
 */
export const SWEEP_DEGREES = 140;

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Math angle in degrees, measured counter-clockwise from the +x axis. The arc
 * is centered on straight-up (90deg) and spans `SWEEP_DEGREES`:
 *   value 0   -> 90 + SWEEP/2  (upper-left end)
 *   value 0.5 -> 90            (straight up)
 *   value 1   -> 90 - SWEEP/2  (upper-right end)
 */
export function valueToAngle(value: number): number {
  return 90 + SWEEP_DEGREES / 2 - clamp01(value) * SWEEP_DEGREES;
}

/**
 * Clockwise SVG rotation (degrees) for a needle drawn pointing straight up at
 * value 0.5: value 0 -> -SWEEP/2, value 0.5 -> 0, value 1 -> +SWEEP/2.
 */
export function valueToRotation(value: number): number {
  return (clamp01(value) - 0.5) * SWEEP_DEGREES;
}

/** Point on a circle of `radius` around (cx, cy) at the value's angle, in SVG (y-down) coords. */
export function valueToPoint(
  value: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } {
  const radians = (valueToAngle(value) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy - radius * Math.sin(radians) };
}

// ---------------------------------------------------------------------------
// Drawing constants (in viewBox user units)
// ---------------------------------------------------------------------------

const VB_W = 176;
const VB_H = 102;
const CX = 88;
const CY = 90;
const ARC_R = 76; // centerline radius of the band
const ARC_STROKE = 18; // band thickness
const ARC_OUTLINE_WIDTH = 3; // dark ink outline around the band
const NEEDLE_R = 60;
const NEEDLE_HALF_BASE = 5;
const NEEDLE_SHOULDER = 12; // distance from the tip where the needle starts to taper
const HUB_R = 7;
const OUTLINE = "var(--foreground)";
const OUTLINE_WIDTH = 2;

// Cartoony red -> white -> green likelihood gradient.
const GRADIENT_STOPS = [
  { offset: "0%", color: "var(--color-red-500)" },
  { offset: "50%", color: "#ffffff" },
  { offset: "100%", color: "var(--color-green-500)" },
];

// The band is a circular ring sliced by a horizontal line, so its two ends are
// flat and parallel to the x-axis. The slice sits at the height of the sweep's
// end on the centerline, keeping the arch aligned with the 0% / 100% needles.
const ARC_OUTER_R = ARC_R + ARC_STROKE / 2;
const ARC_INNER_R = ARC_R - ARC_STROKE / 2;
const ARC_START = valueToPoint(0, CX, CY, ARC_R);
const ARC_END = valueToPoint(1, CX, CY, ARC_R);
const ARC_BASE_Y = ARC_START.y; // flat bottom height
const ARC_BASE_DROP = CY - ARC_BASE_Y;
const ARC_OUTER_HALF_W = Math.sqrt(ARC_OUTER_R ** 2 - ARC_BASE_DROP ** 2);
const ARC_INNER_HALF_W = Math.sqrt(ARC_INNER_R ** 2 - ARC_BASE_DROP ** 2);
// Outer arc over the top, flat slice down to the inner edge, inner arc back,
// flat slice closing the other end.
const ARC_PATH = [
  `M ${CX - ARC_OUTER_HALF_W} ${ARC_BASE_Y}`,
  `A ${ARC_OUTER_R} ${ARC_OUTER_R} 0 0 1 ${CX + ARC_OUTER_HALF_W} ${ARC_BASE_Y}`,
  `L ${CX + ARC_INNER_HALF_W} ${ARC_BASE_Y}`,
  `A ${ARC_INNER_R} ${ARC_INNER_R} 0 0 0 ${CX - ARC_INNER_HALF_W} ${ARC_BASE_Y}`,
  "Z",
].join(" ");
const NEEDLE_TIP_Y = CY - NEEDLE_R;
const NEEDLE_SHOULDER_Y = NEEDLE_TIP_Y + NEEDLE_SHOULDER;
// Blocky "pencil" needle: a straight-sided bar that tapers to a point.
const NEEDLE_POINTS = [
  `${CX - NEEDLE_HALF_BASE},${CY}`,
  `${CX - NEEDLE_HALF_BASE},${NEEDLE_SHOULDER_Y}`,
  `${CX},${NEEDLE_TIP_Y}`,
  `${CX + NEEDLE_HALF_BASE},${NEEDLE_SHOULDER_Y}`,
  `${CX + NEEDLE_HALF_BASE},${CY}`,
].join(" ");

const needleVariants = cva("relative inline-block align-top", {
  variants: {
    size: {
      sm: "w-[128px]",
      md: "w-[180px]",
      lg: "w-[248px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const pct = (value: number) => `${value.toFixed(4)}%`;

export function ForecastNeedle({
  needles,
  size = "md",
  showAxisLabels = true,
  className,
  ...props
}: ForecastNeedleProps & VariantProps<typeof needleVariants>) {
  const gradientId = React.useId();
  const [animated, setAnimated] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Sweep needles in from the center (straight up) on mount.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const ariaLabel =
    "Forecast gauge: " +
    needles
      .map((n) => {
        const value = `${Math.round(clamp01(n.value) * 100)}%`;
        return n.label ? `${n.label} ${value}` : value;
      })
      .join(", ");

  return (
    <div
      className={cn(needleVariants({ size }), className)}
      role="img"
      aria-label={ariaLabel}
      {...props}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={CX - ARC_OUTER_HALF_W}
            y1={CY}
            x2={CX + ARC_OUTER_HALF_W}
            y2={CY}
          >
            {GRADIENT_STOPS.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        </defs>

        {/* Likelihood band: red -> white -> green ring with a flat-bottomed ink outline */}
        <path
          d={ARC_PATH}
          fill={`url(#${gradientId})`}
          stroke={OUTLINE}
          strokeWidth={ARC_OUTLINE_WIDTH}
          strokeLinejoin="round"
        />

        {/* Needles */}
        {needles.map((needle, i) => {
          const color = needle.color ?? "var(--primary)";
          const rotation = animated ? valueToRotation(needle.value) : 0;
          return (
            <g
              key={i}
              style={{
                transform: `rotate(${rotation}deg)`,
                transformBox: "view-box",
                transformOrigin: `${CX}px ${CY}px`,
                transition: "transform 600ms ease-out",
              }}
            >
              <polygon
                points={NEEDLE_POINTS}
                fill={color}
                stroke={OUTLINE}
                strokeWidth={OUTLINE_WIDTH}
                strokeLinejoin="round"
              />
              {/* Wider transparent hit-area for hover / tap */}
              <line
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - NEEDLE_R}
                stroke="transparent"
                strokeWidth={16}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() =>
                  setActiveIndex((cur) => (cur === i ? null : cur))
                }
                onClick={() =>
                  setActiveIndex((cur) => (cur === i ? null : i))
                }
              />
            </g>
          );
        })}

        {/* Hub */}
        <circle
          cx={CX}
          cy={CY}
          r={HUB_R}
          fill="var(--background)"
          stroke={OUTLINE}
          strokeWidth={2.5}
        />
      </svg>

      {/* Axis labels, tucked just below each lifted arc end */}
      {showAxisLabels && (
        <>
          <AxisLabel x={ARC_START.x} y={ARC_START.y + 14} text="0%" />
          <AxisLabel x={ARC_END.x} y={ARC_END.y + 14} text="100%" />
        </>
      )}

      {/* On-hover/tap tooltip: per-needle label (if any) + percentage */}
      {needles.map((needle, i) => {
        if (activeIndex !== i) return null;
        const tip = valueToPoint(needle.value, CX, CY, NEEDLE_R);
        const left = pct((tip.x / VB_W) * 100);
        const top = pct((tip.y / VB_H) * 100);
        const percent = Math.round(clamp01(needle.value) * 100);
        return (
          <span
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded border bg-popover px-2 py-0.5 text-xs font-medium leading-none text-popover-foreground shadow-sm"
            style={{ left, top }}
          >
            {needle.label && (
              <span className="text-muted-foreground">{needle.label} </span>
            )}
            {percent}%
          </span>
        );
      })}
    </div>
  );
}

function AxisLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <span
      className="pointer-events-none absolute -translate-x-1/2 text-sm font-medium leading-none text-muted-foreground"
      style={{ left: pct((x / VB_W) * 100), top: pct((y / VB_H) * 100) }}
    >
      {text}
    </span>
  );
}
