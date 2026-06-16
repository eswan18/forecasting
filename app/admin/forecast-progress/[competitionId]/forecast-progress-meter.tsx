import { cn } from "@/lib/utils";

/**
 * Compact horizontal progress meter for the forecast-progress table. `value`
 * is a fraction in [0, 1]. Completed rows read in the semantic `success`
 * color; partial rows use a neutral fill — no decorative green/yellow ramp.
 */
export function ForecastProgressMeter({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const complete = clamped >= 1;
  const started = clamped > 0;

  return (
    <div className="flex items-center justify-end gap-2.5">
      <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            complete ? "bg-success" : "bg-muted-foreground/40",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "min-w-[2.75rem] text-right font-mono text-sm tabular-nums",
          complete
            ? "text-success-muted-foreground"
            : started
              ? "text-foreground"
              : "text-muted-foreground",
        )}
      >
        {pct}%
      </span>
    </div>
  );
}
