import PageHeading from "@/components/page-heading";

export default function ErrorPage(
  { title, children }: { title: string; children?: React.ReactNode },
) {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={title} />
        <div className="flex flex-col justify-start items-start gap-3">
          {children}
        </div>
      </div>
    </main>
  );
}
