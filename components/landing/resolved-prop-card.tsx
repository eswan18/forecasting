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
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            {/* Left side: prop info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{propText}</p>
              {propNotes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {propNotes}
                </p>
              )}
            </div>

            {/* Right side: forecast and resolution */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">You said</p>
                <p className="text-sm font-medium tabular-nums">
                  {forecast.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground">Resolution</p>
                {resolution ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
