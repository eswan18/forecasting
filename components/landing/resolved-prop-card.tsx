import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface ResolvedPropCardProps {
  propId: number;
  propText: string;
  propNotes: string | null;
  forecast: number;
  resolution: boolean;
}

export default function ResolvedPropCard({
  propId,
  propText,
  propNotes,
  forecast,
  resolution,
}: ResolvedPropCardProps) {
  return (
    <Link href={`/props/${propId}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent>
          <div className="flex items-start gap-3">
            {/* Left side: prop info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">{propText}</p>
              {propNotes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {propNotes}
                </p>
              )}
            </div>

            {/* Right side: forecast and resolution stacked */}
            <div className="flex flex-col items-center gap-y-4 shrink-0">
              <div className="flex items-center gap-1 line-clamp-2">
                {resolution ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {resolution ? "Yes" : "No"}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">You said</p>
                <p className="text-sm font-medium tabular-nums">
                  {forecast.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
