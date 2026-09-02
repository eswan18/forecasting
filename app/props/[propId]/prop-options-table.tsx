import { Check, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ChoiceKind, PROP_KIND_LABELS } from "@/lib/prop-kind";
import type { PropOptionSummary } from "@/types/db_types";

interface PropOptionsTableProps {
  kind: ChoiceKind;
  options: PropOptionSummary[];
  /** Once the prop is resolved each row also carries its outcome. */
  resolved: boolean;
}

const kickerClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

function percent(probability: number | null): string {
  return probability === null ? "—" : `${Math.round(probability * 100)}%`;
}

/**
 * The per-option view of a choice prop on its own page: what the crowd thinks,
 * what the reader forecasted, and — once resolved — which options landed. It
 * stands in for the binary page's stats row, distribution chart and forecaster
 * list, none of which have a per-option meaning yet (spec §4.4).
 */
export default function PropOptionsTable({
  kind,
  options,
  resolved,
}: PropOptionsTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className={kickerClass}>Options</span>
        <span className={kickerClass}>{PROP_KIND_LABELS[kind]}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`h-9 px-4 ${kickerClass}`}>Option</TableHead>
            <TableHead className={`h-9 px-4 text-right ${kickerClass}`}>
              Average
            </TableHead>
            <TableHead className={`h-9 px-4 text-right ${kickerClass}`}>
              You
            </TableHead>
            {resolved && (
              <TableHead className={`h-9 px-4 text-right ${kickerClass}`}>
                Outcome
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((option) => (
            <TableRow key={option.option_id}>
              <TableCell className="px-4 py-3 text-foreground">
                {option.text}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                {percent(option.community_average)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-mono font-medium tabular-nums text-foreground">
                {percent(option.user_forecast)}
              </TableCell>
              {resolved && (
                <TableCell className="px-4 py-3">
                  <span className="flex justify-end">
                    {option.outcome ? (
                      <Check
                        role="img"
                        aria-label="Happened"
                        className="h-4 w-4 text-success-muted-foreground"
                      />
                    ) : (
                      <X
                        role="img"
                        aria-label="Did not happen"
                        className="h-4 w-4 text-muted-foreground/60"
                      />
                    )}
                  </span>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
