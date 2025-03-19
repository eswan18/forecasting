import { Check, CircleCheck, CircleX, TrendingUpDown, X } from "lucide-react";
import { ScoredForecast, useForecastColumns } from "./forecast-columns";

interface ForecastTableProps {
  data: ScoredForecast[];
  editable: boolean;
  scored: boolean;
}

export default function ForecastTable(
  { data, editable, scored }: ForecastTableProps,
) {
  return (
    <div className="w-full">
      <ul className="w-full flex flex-col">
        {data.map((row) => (
          <li key={row.forecast_id}>
            <ForecastTableRow row={row} editable={editable} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForecastTableRow(
  { row, editable }: { row: ScoredForecast; editable: boolean },
) {
  const resolution = row.resolution !== null
    ? (
      <p>
        {row.resolution
          ? (
            <Check
              size={20}
              strokeWidth={3}
              className="-translate-y-1.5 text-green-500"
            />
          )
          : <X size={20} strokeWidth={3} className="-translate-y-1.5 text-destructive" />}
      </p>
    )
    : <p className="text-muted">?</p>;
  const penaltyString = row.penalty !== null
    ? <p>{row.penalty.toFixed(2)}</p>
    : <p className="text-muted">?</p>;
  return (
    <div className="w-full bg-card grid grid-cols-3 px-4 py-4 border">
      <div className="col-span-2 flex flex-col gap-y-1">
        <p>{row.prop_text}</p>
        <p className="text-muted text-sm">{row.category_name}</p>
      </div>
      <div className="col-span-1 grid grid-cols-3 gap-x-1 text-right">
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {row.forecast.toFixed(2)}
        </div>

        {/* */}
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {resolution}
        </div>

        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {penaltyString}
        </div>

        <p className="text-xs text-muted">Predicted</p>
        <p className="text-xs text-muted">Resolution</p>
        <p className="text-xs text-muted">Penalty</p>
      </div>
    </div>
  );
}
