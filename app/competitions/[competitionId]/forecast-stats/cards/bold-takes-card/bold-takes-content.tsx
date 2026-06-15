import { ScrollArea } from "@/components/ui/scroll-area";

export interface BoldTake {
  forecastId: number;
  propText: string;
  userName: string;
  userForecast: number;
  meanForecast: number;
  differenceFromMean: number;
}

function ValueCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="truncate text-[10px] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function BoldTakesContent({ takes }: { takes: BoldTake[] }) {
  return (
    <ScrollArea className="h-64" type="auto">
      <div className="flex h-fit flex-col divide-y">
        {takes.map((take) => (
          <div
            key={take.forecastId}
            className="flex flex-col gap-1.5 py-3 text-xs first:pt-0"
          >
            <span className="text-foreground">{take.propText}</span>
            <div className="grid grid-cols-3 text-right">
              <ValueCell label={take.userName} value={take.userForecast} />
              <ValueCell label="Others" value={take.meanForecast} />
              <ValueCell
                label="Difference"
                value={Math.abs(take.differenceFromMean)}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
