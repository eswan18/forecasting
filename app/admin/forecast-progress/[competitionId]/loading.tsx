import PageHeading from "@/components/page-heading";
import { Spinner } from "@/components/ui/spinner";

export default async function Loading() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Forecast Progress"></PageHeading>
        <div className="flex justify-center items-center h-[32rem]">
          <Spinner className="w-24 h-24 text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
