import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  categoryName: string | null;
  onClick?: () => void;
}

export function CategoryBadge({ categoryName, onClick }: CategoryBadgeProps) {
  if (!categoryName) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs w-24 justify-center text-center",
        onClick && "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
      )}
      onClick={onClick}
    >
      {categoryName}
    </Badge>
  );
}
