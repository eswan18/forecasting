import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default async function SkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="h-full">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
