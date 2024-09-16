import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24">
      <h1 className="text-lg my-3">Welcome!</h1>
      <div className="flex flex-col items-start">
        <p>You&apos;re probably looking for one of these links</p>
        <ul className="list-disc px-4">
          <li className="underline"><Link href="/props/2024">2024 Props</Link></li>
          <li className="underline"><Link href="/scores/2024">2024 Scores</Link></li>
        </ul>
      </div>
    </main>
  );
}
