import PageHeading from "@/components/page-heading";
import { Loader2 } from "lucide-react";

export default async function Loading() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Forecast Progress"></PageHeading>
        <div className="flex justify-center items-center h-[32rem]">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
