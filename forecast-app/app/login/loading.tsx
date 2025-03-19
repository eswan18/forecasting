import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default async function Loading() {
  return (
    <div className="flex items-center justify-center mt-48">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
