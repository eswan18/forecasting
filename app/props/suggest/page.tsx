import PageHeading from "@/components/page-heading";
import { SuggestPropForm } from "./suggest-prop-form";
import { Lightbulb } from "lucide-react";

export default async function SuggestPropPage() {
  // Middleware ensures user is logged in
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading
          title="Suggest Prop"
          breadcrumbs={{
            Home: "/",
            "Suggest Prop": "/props/suggest",
          }}
          icon={Lightbulb}
          iconGradient="bg-gradient-to-br from-yellow-500 to-orange-600"
          className="mb-2"
        />
        <SuggestPropForm />
      </div>
    </main>
  );
}
