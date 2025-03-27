import { getProps, getPropYears } from "@/lib/db_actions";
import PropTable from "@/components/tables/prop-table";
import PageHeading from "@/components/page-heading";
import YearSelector from "../../year-selector";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page(
  { params }: { params: Promise<{ year: string; userId: string }> },
) {
  const year = parseInt((await params).year, 10);
  const userId = parseInt((await params).userId, 10);
  // Check that year & user were numbers
  if (isNaN(year)) {
    throw new Error("Invalid year");
  }
  if (isNaN(userId)) {
    throw new Error("Invalid user ID");
  }
  const user = await getUserFromCookies();
  if (user?.id !== userId) {
    throw new Error("You don't have permission to view this page");
  }
  const years = await getPropYears();
  years.sort((a, b) => b - a);
  const propsAndResolutions = await getProps({
    year,
    personal: true,
    common: false,
  });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-3xl">
        <PageHeading
          title="Personal Props"
          className="flex flex-row flex-wrap gap-x-4 lg:gap-x-8 items-end mb-4 sm:mb-8"
        >
          <YearSelector
            years={years}
            selectedYear={year}
          />
        </PageHeading>
        <PropTable
          data={propsAndResolutions}
          editable={true}
          defaultPropUserId={userId}
        />
      </div>
    </main>
  );
}
