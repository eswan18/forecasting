import PageHeading from "@/components/page-heading";
import { getSuggestedProps } from "@/lib/db_actions";

export default async function SuggestedProps() {
  const suggestedProps = await getSuggestedProps();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Suggested Props" />
        <ul className="flex flex-col gap-4">
          {suggestedProps.map((prop) => (
            <li key={prop.id} className="flex flex-col gap-0.5">
              <div className="text-sm">{prop.user_username} ({prop.user_name})</div>
              <div className="">{prop.prop_text}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
