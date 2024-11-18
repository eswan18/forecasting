import PageHeading from "@/components/page-heading";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Welcome" />
        Quick Links:
        <ul className="list-disc px-4">
          <li className="underline"><Link href="/props/suggest">Suggest a prop</Link></li>
          <li className="underline"><Link href="/scores/2024">2024 Scores</Link></li>
        </ul>
      </div>
    </main>
  );
}
