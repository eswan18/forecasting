import UserList from "@/components/user-list";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="flex flex-col">
          <h1 className="text-lg">Links</h1>
          <ul className="list-disc">
            <li><Link href="/props/2024">2024 Props</Link></li>
            <li><Link href="/scores/2024">2024 Scores</Link></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
