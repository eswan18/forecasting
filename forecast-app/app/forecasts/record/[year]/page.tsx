import { getCategories, getProps } from "@/lib/db_actions";
import { Category, VProp } from "@/types/db_types";
import { RecordPropForm } from "./record-prop-form";
import { getUserFromCookies } from "@/lib/get-user";
import { redirect } from "next/navigation";
import PageHeading from "@/components/page-heading";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RecordForecastsPage(
  { params }: { params: Promise<{ year: number }> },
) {
  const user = await getUserFromCookies();
  if (!user) redirect("/login");
  const { year } = await params;
  const props = await getProps({ year });
  const categories = await getCategories();
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
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`Record Forecasts for ${year}`} />
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
        <div className="mt-8 flex flex-col gap-16">
          {Array.from(
            propsByCategoryId,
            ([categoryId, { category, props }]) => (
              <CategoryProps
                key={categoryId}
                category={category}
                props={props}
              />
            ),
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
        {props.map((prop) => <RecordPropForm prop={prop} key={prop.prop_id} />)}
      </div>
    </div>
  );
}
