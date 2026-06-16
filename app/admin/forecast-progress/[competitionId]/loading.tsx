import PageHeading from "@/components/page-heading";
import { Spinner } from "@/components/ui/spinner";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <main className="py-10 lg:py-14">
      <Container>
        <PageHeading
          title="Forecast Progress"
          breadcrumbs={{ Admin: "/admin" }}
        />
        <div className="flex h-80 items-center justify-center rounded-lg border bg-card">
          <Spinner className="h-10 w-10 text-muted-foreground" />
        </div>
      </Container>
    </main>
  );
}
