import { getPropsAndResolutionsByYear } from "@/lib/db_actions"
import { DataTable } from "./data-table";
import { columns } from "./columns";
import PageHeading from "@/components/page-heading";

export default async function Page({ params }: { params: { year: string } }) {
  const year = parseInt(params.year)
  const propsAndResolutions = await getPropsAndResolutionsByYear(year)
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-96">
        <PageHeading title={`${year} Props`} />
        <DataTable columns={columns} data={propsAndResolutions} />
      </div>
    </main>
  )
}