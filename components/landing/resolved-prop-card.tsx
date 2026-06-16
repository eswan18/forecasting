import { Check, X } from "lucide-react";
import Link from "next/link";
import { LocalDate } from "@/components/local-date";
import { cn, focusRing } from "@/lib/utils";

interface ResolvedPropCardProps {
  propId: number;
  propText: string;
  propNotes: string | null;
  forecast: number;
  resolution: boolean;
  resolutionDate: Date;
}

export default function ResolvedPropCard({
  propId,
  propText,
  propNotes,
  forecast,
  resolution,
  resolutionDate,
}: ResolvedPropCardProps) {
  return (
    <Link
      href={`/props/${propId}`}
      className={cn(
        "block rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20",
        focusRing,
      )}
    >
      <p
        className="text-sm font-medium leading-snug text-foreground line-clamp-2"
        title={propText}
      >
        {propText}
      </p>
      {propNotes && (
        <p
          className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2"
          title={propNotes}
        >
          {propNotes}
        </p>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Resolved
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                resolution
                  ? "bg-success-muted text-success-muted-foreground"
                  : "bg-destructive-muted text-destructive-muted-foreground",
              )}
            >
              {resolution ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {resolution ? "Yes" : "No"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              <LocalDate date={resolutionDate} />
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            You said
          </div>
          <div className="mt-1.5 font-mono text-sm font-medium tabular-nums text-foreground">
            {forecast.toFixed(2)}
          </div>
        </div>
      </div>
    </Link>
  );
}
