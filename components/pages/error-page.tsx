import PageHeading from "@/components/page-heading";
import { Container } from "@/components/ui/container";

export default function ErrorPage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[60vh] items-center py-12 lg:py-16">
      <Container className="max-w-xl">
        <PageHeading title={title} />
        <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
          {children}
        </div>
      </Container>
    </main>
  );
}
