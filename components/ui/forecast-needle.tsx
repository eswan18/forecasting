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
 * - `label` is an optional short caption shown near the needle's tip
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
  /** Show the 0% / 50% / 100% axis labels. Defaults to true. */
  showAxisLabels?: boolean;
}

// ---------------------------------------------------------------------------
// Geometry (pure, exported for testing)
// ---------------------------------------------------------------------------

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Math angle in degrees, measured counter-clockwise from the +x axis:
 *   value 0   -> 180  (points left)
 *   value 0.5 ->  90  (points straight up)
 *   value 1   ->   0  (points right)
 */
export function valueToAngle(value: number): number {
  return 180 * (1 - clamp01(value));
}

/**
 * Clockwise SVG rotation (degrees) for a needle drawn pointing straight up at
 * value 0.5: value 0 -> -90, value 0.5 -> 0, value 1 -> +90.
 */
export function valueToRotation(value: number): number {
  return (clamp01(value) - 0.5) * 180;
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

const VB_W = 200;
const VB_H = 120;
const CX = 100;
const CY = 95;
const ARC_R = 76;
const ARC_STROKE = 18;
const ARC_BORDER = 2; // dark outline thickness on each edge of the arc
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

const ARC_PATH = `M ${CX - ARC_R} ${CY} A ${ARC_R} ${ARC_R} 0 0 1 ${CX + ARC_R} ${CY}`;
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
      sm: "w-[140px]",
      md: "w-[200px]",
      lg: "w-[280px]",
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
            x1={CX - ARC_R}
            y1={CY}
            x2={CX + ARC_R}
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

        {/* Likelihood arc: dark outline behind a red -> white -> green band */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={ARC_STROKE + ARC_BORDER * 2}
          strokeLinecap="butt"
        />
        <path
          d={ARC_PATH}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={ARC_STROKE}
          strokeLinecap="butt"
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

      {/* Axis labels */}
      {showAxisLabels && (
        <>
          <AxisLabel x={CX - ARC_R} y={CY + 12} text="0%" />
          <AxisLabel x={CX + ARC_R} y={CY + 12} text="100%" />
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
