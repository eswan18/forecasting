import { SuggestPropForm } from "./suggest-prop-form";

export default async function SuggestPropPage() {
  return (
    <main className="px-6 py-8 lg:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <SuggestPropForm />
      </div>
    </main>
  );
}
