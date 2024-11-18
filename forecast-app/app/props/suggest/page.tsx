import PageHeading from "@/components/page-heading";
import { SuggestPropForm } from "./suggest-prop-form";
import { getUserFromCookies } from "@/lib/get-user";
import { redirect } from "next/navigation";

export default async function SuggestPropPage() {
  const user = await getUserFromCookies();
  if (!user) {
    redirect("/login");
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Suggest Prop" />
        <SuggestPropForm />
      </div>
    </main>
  );
}
