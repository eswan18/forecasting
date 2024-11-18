import PageHeading from "@/components/page-heading";
import { getSuggestedProps } from "@/lib/db_actions";

export default async function SuggestedProps() {
  const suggestedProps = await getSuggestedProps();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Suggested Props" />
        <ul>
          {suggestedProps.map((suggestedProp) => (
            <li key={suggestedProp.id}>
              User {suggestedProp.suggester_user_id}:  {suggestedProp.prop}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
