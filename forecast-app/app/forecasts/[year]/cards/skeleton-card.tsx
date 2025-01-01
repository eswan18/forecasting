import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default async function SkeletonCard(
  { title, className }: { title: string; className?: string },
) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
