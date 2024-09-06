import { getPropsAndResolutionsByYear } from "@/lib/db_actions"
import PropTable from "./prop-table";

export default async function Page({ params }: { params: { year: string } }) {
  const year = parseInt(params.year)
  const propsAndResolutions = await getPropsAndResolutionsByYear(year)
  console.log(propsAndResolutions);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-96">
        <PropTable rows={propsAndResolutions} />
      </div>
    </main>
  )
}