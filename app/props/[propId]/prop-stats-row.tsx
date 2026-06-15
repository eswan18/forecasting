interface StatProps {
  label: string;
  value: string;
  muted?: boolean;
}

function Stat({ label, value, muted }: StatProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface PropStatsRowProps {
  userForecast: number | null;
  average: number | null;
  forecasterCount: number;
  min: number | null;
  max: number | null;
}

export default function PropStatsRow({
  userForecast,
  average,
  forecasterCount,
  min,
  max,
}: PropStatsRowProps) {
  const pct = (v: number | null) => (v !== null ? `${Math.round(v * 100)}%` : "—");
  const range =
    min !== null && max !== null
      ? `${Math.round(min * 100)}–${Math.round(max * 100)}%`
      : "—";

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat
        label="Your Forecast"
        value={pct(userForecast)}
        muted={userForecast === null}
      />
      <Stat label="Average" value={pct(average)} muted={average === null} />
      <Stat label="Forecasters" value={String(forecasterCount)} />
      <Stat label="Range" value={range} muted={min === null || max === null} />
    </div>
  );
}
