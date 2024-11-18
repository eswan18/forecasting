import PageHeading from "@/components/page-heading";
import { SuggestPropForm } from "./suggest-prop-form";

export default async function SuggestPropPage() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Suggest Prop" />
        <SuggestPropForm />
      </div>
    </main>
  );
}