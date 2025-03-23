import Link from "next/link";
import PageHeading from "@/components/page-heading";
import { Button } from "@/components/ui/button";

export async function InaccessiblePage(
  { title, message }: { title: string; message: string },
) {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={title} />
        <div className="flex flex-col justify-start items-start gap-3">
          <p>{message}</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
