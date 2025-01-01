import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, Loader2 } from "lucide-react";

export default async function SkeletonCard({ title }: { title: string }) {
  return (
    <Card className="w-72 h-96">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
