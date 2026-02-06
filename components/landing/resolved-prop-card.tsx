"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { formatDate } from "@/lib/time-utils";

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
  const timezone = useUserTimezone();
  return (
    <Link href={`/props/${propId}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent>
          {/* Top: prop text and notes */}
          <div className="mb-3">
            <p className="text-sm line-clamp-2" title={propText}>
              {propText}
            </p>
            {propNotes && (
              <p
                className="text-xs text-muted-foreground mt-1 line-clamp-3"
                title={propNotes}
              >
                {propNotes}
              </p>
            )}
          </div>

          {/* Bottom row: resolution info and forecast */}
          <div className="flex items-end justify-between">
            {/* Left: Resolution with date */}
            <div>
              <p className="text-xs text-muted-foreground">Resolution</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm font-medium">
                  {resolution ? "Yes" : "No"}
                </span>
                {resolution ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDate(resolutionDate, timezone)}
                </span>
              </div>
            </div>

            {/* Right: User's forecast */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">You said</p>
              <p className="text-sm font-medium tabular-nums mt-0.5">
                {forecast.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
