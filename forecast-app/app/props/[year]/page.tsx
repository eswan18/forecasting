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
  // Add the "next" year - one after the last year in the list.
  years.unshift(years[0] + 1);
  const propsAndResolutions = await getProps({ year });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Props">
          <YearSelector
            years={years}
            selectedYear={year}
          />
        </PageHeading>
        <PropTable data={propsAndResolutions} allowEdits={allowEdits} />
      </div>
    </main>
  );
}
