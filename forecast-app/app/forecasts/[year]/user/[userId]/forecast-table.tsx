import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, X } from "lucide-react";

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
  year: number;
};

interface ForecastTableProps {
  data: ScoredForecast[];
  editable: boolean;
}

export default function ForecastTable(
  { data, editable }: ForecastTableProps,
) {
  return (
    <div className="w-full">
      <ForecastTableHeader />
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

function ForecastTableHeader() {
  return (
    <div className="w-full grid grid-cols-[2fr_1fr] px-4 pb-1 border-b text-muted">
      <div></div>
      <div className="col-span-1 grid grid-cols-[4fr_4fr_3fr] gap-x-1 text-right">
        <div className="w-full flex flex-row items-end justify-end">
          <Button variant="ghost" className="h-6 p-0 flex flex-row gap-x-1 m-0">
            Sort<ArrowUpDown size={20} />
          </Button>
        </div>
        <div className="w-full flex flex-row items-end justify-end">
          <Button variant="ghost" className="h-6 p-0 flex flex-row gap-x-1 m-0">
            Sort<ArrowUpDown size={20} />
          </Button>
        </div>
        <div className="w-full flex flex-row items-end justify-end">
          <Button variant="ghost" className="h-6 p-0 flex flex-row gap-x-1 m-0">
            Sort<ArrowUpDown size={20} className="m-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ForecastTableRow(
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
    : <p className="text-muted">?</p>;
  const penaltyString = row.penalty !== null
    ? <p>{row.penalty.toFixed(2)}</p>
    : <p className="text-muted">?</p>;
  return (
    <div className="w-full bg-card grid grid-cols-[2fr_1fr] px-4 py-4 border">
      <div className="flex flex-col gap-y-1">
        <p>{row.prop_text}</p>
        <p className="text-muted text-sm">{row.category_name}</p>
      </div>
      <div className="grid grid-cols-[4fr_4fr_3fr] gap-x-1 text-right">
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {row.forecast.toFixed(2)}
        </div>
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
