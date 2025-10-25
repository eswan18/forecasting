import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default async function SkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="h-full">
        <div className="flex justify-center items-center h-full">
          <Spinner className="w-24 h-24 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
