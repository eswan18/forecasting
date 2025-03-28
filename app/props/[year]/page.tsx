import { getProps, getPropYears } from "@/lib/db_actions";
import PropTable from "@/components/tables/prop-table";
import PageHeading from "@/components/page-heading";
import YearSelector from "./year-selector";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page(
  { params }: { params: Promise<{ year: number }> },
) {
  const { year } = await params;
  // Check that year is a number.
  if (isNaN(year)) {
    throw new Error("Invalid year");
  }
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;
  const years = await getPropYears();
  years.sort((a, b) => b - a);
  // Passing null as the userId gets us only public props.
  const propsAndResolutions = await getProps({ year, userId: null });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-3xl">
        <PageHeading
          title="Public Props"
          className="flex flex-row flex-wrap gap-x-4 lg:gap-x-8 items-end mb-4 sm:mb-8"
        >
          <YearSelector
            years={years}
            selectedYear={year}
          />
        </PageHeading>
        <PropTable data={propsAndResolutions} editable={allowEdits} />
      </div>
    </main>
  );
}
