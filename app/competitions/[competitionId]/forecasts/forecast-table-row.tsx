import { Check, X } from "lucide-react";

export type ScoredForecast = {
  category_id: number;
  category_name: string;
  prop_id: number;
  prop_text: string;
  prop_notes: string | null;
  resolution: boolean | null;
  user_id: number;
  forecast: number;
  forecast_id: number;
  penalty: number | null;
};

export default function ForecastTableRow(
  { row, editable }: { row: ScoredForecast; editable: boolean },
) {
  const resolution = row.resolution !== null
    ? (
      row.resolution
        ? (
          <Check
            size={20}
            strokeWidth={3}
            className="-translate-y-1.5 text-green-500"
          />
        )
        : (
          <X
            size={20}
            strokeWidth={3}
            className="-translate-y-1.5 text-destructive"
          />
        )
    )
    : <p className="text-muted-foreground">?</p>;
  const penaltyString = row.penalty !== null
    ? <p>{row.penalty.toFixed(2)}</p>
    : <p className="text-muted-foreground">?</p>;
  return (
    <div className="w-full bg-card grid grid-cols-[1fr_1fr] sm:grid-cols-[2fr_1fr] px-4 py-4 border gap-x-1">
      <div className="flex flex-col gap-y-1">
        <p>{row.prop_text}</p>
        <p className="text-muted-foreground text-sm">{row.category_name}</p>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-1 text-right">
        <div className="w-full flex flex-row items-end justify-center sm:justify-end text-lg font-bold">
          {resolution}
        </div>
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {row.forecast.toFixed(2)}
        </div>
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {penaltyString}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Resolution</span>
        </p>
        <p className="text-xs text-muted-foreground">Predicted</p>
        <p className="text-xs text-muted-foreground">Penalty</p>
      </div>
    </div>
  );
}
