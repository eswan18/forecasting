import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  categoryName: string | null;
}

export function CategoryBadge({ categoryName }: CategoryBadgeProps) {
    if (!categoryName) {
        return <span className="text-muted-foreground text-sm">—</span>;
    }

    return (
        <Badge variant="outline" className="text-xs w-24 justify-center text-center">
            {categoryName}
        </Badge>
    );
}
