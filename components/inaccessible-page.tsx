import Link from "next/link";
import PageHeading from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export async function InaccessiblePage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="flex min-h-[60vh] items-center py-12 lg:py-16">
      <Container className="max-w-xl">
        <PageHeading title={title} />
        <div className="flex flex-col items-start gap-5">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
