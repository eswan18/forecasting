import { getPropsAndResolutionsByYear } from "@/lib/db_actions";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import PageHeading from "@/components/page-heading";

export default async function Page(
  { params }: { params: Promise<{ year: string }> },
) {
  const year = parseInt((await params).year);
  const propsAndResolutions = await getPropsAndResolutionsByYear(year);
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`${year} Props`} />
        <DataTable
          getColumns={getColumns}
          data={propsAndResolutions}
        />
      </div>
    </main>
  );
}
