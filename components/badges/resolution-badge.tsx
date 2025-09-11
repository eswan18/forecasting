import { Badge } from "@/components/ui/badge";

interface ResolutionBadgeProps {
  resolution: boolean | null;
}

export function ResolutionBadge({ resolution }: ResolutionBadgeProps) {
  if (resolution === null) {
    return (
      <Badge variant="secondary" className="text-xs w-24 justify-center">
        Unresolved
      </Badge>
    );
  }

  return (
    <Badge
      variant={resolution ? "default" : "destructive"}
      className="text-xs w-24 justify-center"
    >
      {resolution ? "True" : "False"}
    </Badge>
  );
}
