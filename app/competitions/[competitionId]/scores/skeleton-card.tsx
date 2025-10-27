import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Explanation section skeleton */}
      <div className="w-full rounded-lg mb-8">
        <Skeleton className="h-5 w-40 mb-2" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>

      {/* Leaderboard cards skeleton */}
      <div className="flex flex-col gap-y-4 w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="w-full h-42">
            <CardContent
              className="p-6
              grid grid-cols-[5rem_auto] grid-rows-2 grid-flow-col
              lg:flex lg:flex-row lg:gap-x-4 lg:items-center h-full"
            >
              {/* User Info */}
              <div className="flex items-center justify-start gap-3 mb-1 lg:w-60 h-full">
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Score as Text */}
              <div className="lg:text-right flex flex-col justify-end">
                <Skeleton className="h-6 lg:h-8 w-20" />
                <Skeleton className="hidden lg:block h-3 w-20 mt-1" />
              </div>

              {/* Visual Bars */}
              <Skeleton className="ml-auto w-30 lg:w-100 row-span-2 h-full"></Skeleton>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
