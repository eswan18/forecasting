import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResolutionBadgeProps {
  resolution: boolean | null;
  onClick?: () => void;
}

export function ResolutionBadge({ resolution, onClick }: ResolutionBadgeProps) {
  if (resolution === null) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "text-xs w-24 justify-center",
          onClick && "cursor-pointer hover:bg-secondary/80 transition-colors",
        )}
        onClick={onClick}
      >
        Unresolved
      </Badge>
    );
  }

  return (
    <Badge
      variant={resolution ? "default" : "destructive"}
      className={cn(
        "text-xs w-24 justify-center",
        onClick && "cursor-pointer transition-colors",
        onClick && resolution && "hover:bg-primary/90",
        onClick && !resolution && "hover:bg-destructive/90",
      )}
      onClick={onClick}
    >
      {resolution ? "True" : "False"}
    </Badge>
  );
}
