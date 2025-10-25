import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default async function Loading() {
  return (
    <div className="flex items-center justify-center mt-48">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Spinner className="w-24 h-24 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
