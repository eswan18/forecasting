import { Check, X } from "lucide-react";

import { type ChoiceKind, PROP_KIND_LABELS } from "@/lib/prop-kind";
import type { PropOptionSummary } from "@/types/db_types";

interface ChoiceForecastSummaryProps {
  kind: ChoiceKind;
  options: PropOptionSummary[];
  showCommunityAvg: boolean;
}

function percent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * A read-only view of one user's forecast on a choice prop: the row-per-option
 * counterpart to `ChoiceForecastEditor`, sharing its row shape so a card and
 * its editable twin read as one family. Once the prop is resolved each row also
 * carries its outcome.
 *
 * Purely presentational — it takes the options it is handed, so it works
 * anywhere a `PropOptionSummary[]` is in reach.
 */
export function ChoiceForecastSummary({
  kind,
  options,
  showCommunityAvg,
}: ChoiceForecastSummaryProps) {
  const hasForecast = options.some((option) => option.user_forecast != null);
  if (!hasForecast) {
    return <div className="text-sm text-muted-foreground">No forecast yet</div>;
  }

  return (
    <div
      role="list"
      aria-label={PROP_KIND_LABELS[kind]}
      className="divide-y divide-border"
    >
      {options.map((option) => {
        const forecast = option.user_forecast;
        return (
          <div key={option.option_id} role="listitem" className="py-2">
            <div className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-foreground">
                <span className="min-w-0">{option.text}</span>
                {option.outcome !== null &&
                  (option.outcome ? (
                    <Check
                      role="img"
                      aria-label="Happened"
                      className="h-3.5 w-3.5 shrink-0 text-success-muted-foreground"
                    />
                  ) : (
                    <X
                      role="img"
                      aria-label="Did not happen"
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                    />
                  ))}
              </span>
              {showCommunityAvg && option.community_average != null && (
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  avg {percent(option.community_average)}
                </span>
              )}
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                {forecast == null ? "—" : percent(forecast)}
              </span>
            </div>
            {/* The user's probability as a bar, so a column of rows can be read
                at a glance the way the needle reads on a binary card. */}
            <div className="mt-1.5 h-0.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.round((forecast ?? 0) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
