import { getCategories, getForecasts, getProps } from "@/lib/db_actions";
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
  if (!user) await loginAndRedirect({ url: `/forecasts/record/${year}` });

  let props = await getProps({ year });
  props.sort((a, b) => a.prop_id - b.prop_id);
  const forecasts = await getForecasts({ year });
  // Remove props that already have forecasts.
  const propIdsWithForecasts = new Set(forecasts.map((f) => f.prop_id));
  props = props.filter((prop) => !propIdsWithForecasts.has(prop.prop_id));
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
        {categories.length > 0 && (
          <>
            <div className="flex flex-row justify-start w-full text-muted-foreground mb-3">
              Jump to category...
            </div>
            <div className="flex flex-row flex-wrap justify-center w-full gap-1">
              {categories.map((category) => (
                <Link
                  href={`#category-${category.id}`}
                  key={category.id}
                >
                  <Button variant="secondary">
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="mt-8 flex flex-col gap-16">
          {propsByCategoryId.size === 0
            ? (
              <div className="text-center">
                <div className="text-lg text-muted-foreground mb-4">
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
      <h2
        className="text-lg text-muted-foreground mb-4"
        id={`category-${category.id}`}
      >
        {category.name}
      </h2>
      <div className="flex flex-col gap-8">
        {props.map((prop) => (
          <RecordForecastForm prop={prop} key={prop.prop_id} />
        ))}
      </div>
    </div>
  );
}
