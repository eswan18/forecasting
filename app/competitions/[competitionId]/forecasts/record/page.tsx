import { getUnforecastedProps } from "@/lib/db_actions";
import { VProp } from "@/types/db_types";
import { RecordForecastForm } from "@/components/forms/record-forecast-form";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ErrorPage from "@/components/pages/error-page";

export default async function RecordForecastsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString);
  if (isNaN(competitionId)) {
    return <ErrorPage title="Invalid competition ID" />;
  }
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({
      url: `/forecasts/${competitionId}/forecasts/record`,
    });
  }
  let props = await getUnforecastedProps({ userId: user!.id, competitionId });
  props.sort((a, b) => a.prop_id - b.prop_id);

  // Mapping from category IDs to the props in that category.
  const propsByCategoryId: Map<number | null, VProp[]> = new Map();
  // Mapping from category IDs to category objects.
  const categories: Map<number | null, { id: number; name: string } | null> =
    new Map();
  props.forEach((prop) => {
    if (prop.category_id === null || prop.category_name === null) {
      if (!categories.has(null)) {
        categories.set(null, null);
      }
      if (!propsByCategoryId.has(null)) {
        propsByCategoryId.set(null, []);
      }
      propsByCategoryId.get(null)!.push(prop);
    } else {
      const category = { id: prop.category_id, name: prop.category_name };
      if (!categories.has(category.id)) {
        categories.set(category.id, category);
      }
      if (!propsByCategoryId.has(category.id)) {
        propsByCategoryId.set(category.id, []);
      }
      propsByCategoryId.get(category.id)!.push(prop);
    }
  });

  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <p>Record new forecasts here.</p>
        <p>
          You can edit existing forecasts on the{" "}
          <Link
            href={`/competitions/${competitionId}/forecasts`}
            className="underline"
          >
            Forecasts Page
          </Link>
          .
        </p>
        {categories.size > 0 && (
          <div className="flex flex-row my-3 items-center">
            <div className="text-muted-foreground text-xs pr-2">
              Jump to ...
            </div>
            <div className="flex flex-row flex-wrap justify-center">
              {Array.from(categories, ([categoryId, category]) => (
                <Link
                  href={`#category-${categoryId ?? "uncategorized"}`}
                  key={categoryId}
                  legacyBehavior
                >
                  <Button variant="ghost" size="sm">
                    {category?.name ?? "Uncategorized"}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-16">
          {propsByCategoryId.size === 0 ? (
            <div className="text-center">
              <div className="text-muted-foreground mb-4">
                No props to forecast
              </div>
              <p className="text-muted-foreground">
                You have already forecasted all props for this year.
              </p>
            </div>
          ) : (
            Array.from(propsByCategoryId, ([categoryId, props]) => (
              <CategoryProps
                key={categoryId}
                category={categories.get(categoryId) ?? null}
                props={props}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function CategoryProps({
  category,
  props,
}: {
  category: { id: number; name: string } | null;
  props: VProp[];
}) {
  return (
    <div>
      <div className="w-[33%] border-b-foreground border-b mb-4 px-1">
        <h2
          className="text-muted-foreground text-xs mb-1"
          id={`category-${category?.id ?? "uncategorized"}`}
        >
          {category?.name ?? "Uncategorized"}
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
