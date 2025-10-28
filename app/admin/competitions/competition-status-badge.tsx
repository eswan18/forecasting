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
        return {
          label: "Upcoming",
          variant: "outline" as const,
        };
      case "active":
        return {
          label: "Active",
          variant: "default" as const,
        };
      case "ended":
        return {
          label: "Ended",
          variant: "secondary" as const,
        };
    }
  };

  const config = getStatusConfig(status);

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
