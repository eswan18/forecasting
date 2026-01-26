import { Badge } from "@/components/ui/badge";
import { CompetitionStatus } from "@/lib/competition-status";

interface CompetitionStatusBadgeProps {
  status: CompetitionStatus;
}

export function CompetitionStatusBadge({
  status,
}: CompetitionStatusBadgeProps) {
  const getStatusConfig = (status: CompetitionStatus) => {
    switch (status) {
      case "upcoming":
        return { label: "Upcoming", variant: "outline" as const };
      case "forecasts-open":
        return { label: "Forecasts open", variant: "default" as const };
      case "forecasts-closed":
        return { label: "Forecasts closed", variant: "secondary" as const };
      case "ended":
        return { label: "Ended", variant: "secondary" as const };
      case "private":
        return { label: "Private", variant: "outline" as const };
    }
  };

  const config = getStatusConfig(status);

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
