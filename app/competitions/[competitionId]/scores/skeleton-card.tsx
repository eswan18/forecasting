import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border"
            >
              <div className="flex-grow">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
              <div className="flex-shrink-0 w-40">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-2 w-48" />
                  <Skeleton className="h-2 w-56" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <Skeleton className="h-5 w-40 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
