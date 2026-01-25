// Helper to get color based on probability
const getProbColor = (prob: number) => {
  if (prob <= 0.2) return "text-red-700";
  if (prob <= 0.4) return "text-orange-700";
  if (prob <= 0.6) return "text-yellow-700";
  if (prob <= 0.8) return "text-lime-700";
  return "text-green-700";
};

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
  const userPercent =
    userForecast !== null ? Math.round(userForecast * 100) : null;
  const avgPercent = average !== null ? Math.round(average * 100) : null;
  const minPercent = min !== null ? Math.round(min * 100) : null;
  const maxPercent = max !== null ? Math.round(max * 100) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">Your forecast</div>
        {userPercent !== null ? (
          <div className={`text-2xl font-bold ${getProbColor(userForecast!)}`}>
            {userPercent}%
          </div>
        ) : (
          <div className="text-2xl font-bold text-muted-foreground">—</div>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">Average</div>
        {avgPercent !== null ? (
          <div className="text-2xl font-bold text-foreground">{avgPercent}%</div>
        ) : (
          <div className="text-2xl font-bold text-muted-foreground">—</div>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">Forecasters</div>
        <div className="text-2xl font-bold text-foreground">
          {forecasterCount}
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">Range</div>
        {minPercent !== null && maxPercent !== null ? (
          <div className="text-2xl font-bold text-foreground">
            <span className="text-lg">
              {minPercent}–{maxPercent}%
            </span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-muted-foreground">—</div>
        )}
      </div>
    </div>
  );
}
