import {
  getCategories,
  getForecasts,
  getProps,
  getUnforecastedProps,
} from "@/lib/db_actions";
import { Category, VProp } from "@/types/db_types";
import { RecordForecastForm } from "@/components/forms/record-forecast-form";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import PageHeading from "@/components/page-heading";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RecordForecastsPage(
  { params }: { params: Promise<{ year: number }> },
) {
  const { year } = await params;

  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `/forecasts/record/${year}` });
    return <></>; // will never reach this line due to redirect.
  }

  let props = await getUnforecastedProps({ userId: user.id, year });
  props.sort((a, b) => a.prop_id - b.prop_id);
  // Group props by category in a map.
  const propsByCategoryId: Map<number, { category: Category; props: VProp[] }> =
    new Map();
  props.forEach((prop) => {
    const categoryId = prop.category_id;
    if (!propsByCategoryId.has(categoryId)) {
      const category = { id: categoryId, name: prop.category_name };
      propsByCategoryId.set(categoryId, { category, props: [prop] });
    } else {
      propsByCategoryId.get(categoryId)!.props.push(prop);
    }
  });
  const categories = (await getCategories()).filter((c) =>
    propsByCategoryId.has(c.id)
  ).sort((a, b) => a.name < b.name ? -1 : 1);
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`Record Forecasts for ${year}`} />
        <p>Record new forecasts here.</p>
        <p>
          You can edit existing forecasts on the{" "}
          <Link
            href={`/forecasts/${year}/user/${user.id}`}
            className="underline"
          >
            {year.toString()} Forecast History
          </Link>{" "}
          page.
        </p>
        {categories.length > 0 && (
          <div className="flex flex-row my-3 items-center">
            <div className="text-muted-foreground text-xs pr-2">
              Jump to ...
            </div>
            <div className="flex flex-row flex-wrap justify-center">
              {categories.map((category) => (
                <Link
                  href={`#category-${category.id}`}
                  key={category.id}
                >
                  <Button variant="ghost" size="sm">
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-16">
          {propsByCategoryId.size === 0
            ? (
              <div className="text-center">
                <div className="text-muted-foreground mb-4">
                  No props to forecast
                </div>
                <p className="text-muted-foreground">
                  You have already forecasted all props for this year.
                </p>
              </div>
            )
            : (
              Array.from(
                propsByCategoryId,
                ([categoryId, { category, props }]) => (
                  <CategoryProps
                    key={categoryId}
                    category={category}
                    props={props}
                  />
                ),
              )
            )}
        </div>
      </div>
    </main>
  );
}

function CategoryProps(
  { category, props }: { category: Category; props: VProp[] },
) {
  return (
    <div>
      <div className="w-[33%] border-b-foreground border-b mb-4 px-1">
        <h2
          className="text-muted-foreground text-xs mb-1"
          id={`category-${category.id}`}
        >
          {category.name}
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        {props.map((prop) => (
          <RecordForecastForm prop={prop} key={prop.prop_id} />
        ))}
      </div>
    </div>
  );
}
