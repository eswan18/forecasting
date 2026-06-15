import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Wordmark } from "@/components/navbar/wordmark";

export default async function Loading() {
  return (
    <div className="flex flex-col items-center justify-start px-4 pb-8 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="gap-3">
            <Wordmark />
            <CardTitle className="text-xl font-semibold tracking-tight">
              Sign in
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-32 items-center justify-center">
            <Spinner className="h-10 w-10 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
