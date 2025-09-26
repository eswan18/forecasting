import PageHeading from "@/components/page-heading";
import { Separator } from "@/components/ui/separator";
import StandaloneTabs from "./standalone-tabs";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";

export default async function CompetitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: "/standalone/props" });
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <PageHeading title="Standalone Forecasts" className="mb-2" />
      <p className="mb-4 text-muted-foreground">
        Forecasts not associated with a competition
      </p>
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center justify-start mb-4 gap-y-2">
          <Separator />
          <StandaloneTabs className="w-full" />
        </div>
        {children}
      </div>
    </main>
  );
}
