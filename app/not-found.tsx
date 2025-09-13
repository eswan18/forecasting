"use client"; // Error boundaries must be Client Components

import PageHeading from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="404: Not Found" />
        <div className="flex flex-col justify-start items-start gap-3">
          <p>Could not find requested resource</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
