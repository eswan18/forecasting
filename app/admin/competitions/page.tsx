import PageHeading from "@/components/page-heading";

export default async function Page() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-2xl">
        <PageHeading title="Competitions" />
      </div>
    </main>
  );
}
