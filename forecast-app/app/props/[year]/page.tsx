import { getPropsAndResolutionsByYear } from "@/lib/db_actions"
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import PageHeading from "@/components/page-heading";

export default async function Page({ params }: { params: { year: string } }) {
  const year = parseInt(params.year)
  const propsAndResolutions = await getPropsAndResolutionsByYear(year)
  return (
    <main className="flex flex-col items-center justify-between py-12 px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`${year} Props`} />
        <DataTable
          getColumns={getColumns}
          data={propsAndResolutions}
          allowResolutionEdits={false}
        />
      </div>
    </main>
  )
}