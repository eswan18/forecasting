"use client"; // Error boundaries must be Client Components

import PageHeading from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center py-12 lg:py-16">
      <Container className="max-w-xl">
        <PageHeading title="Page not found" />
        <div className="flex flex-col items-start gap-5">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find the page you were looking for.
          </p>
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
