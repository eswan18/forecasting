import PageHeading from "@/components/page-heading";
import { AccountDetails } from "./account-details";
import { User } from "lucide-react";

export default async function Page() {
  // Middleware ensures user is logged in
  const idpBaseUrl = process.env.IDP_BASE_URL;
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading
          title="Account & Settings"
          icon={User}
          iconGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          className="mb-2"
        />
        <AccountDetails idpBaseUrl={idpBaseUrl} />
      </div>
    </main>
  );
}
