import PageHeading from "@/components/page-heading";
import { AccountDetails } from "./account-details";

export default async function Page() {
  const idpBaseUrl = process.env.IDP_BASE_URL;
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading
          title="Account Settings"
          className="mb-2"
        />
        <AccountDetails idpBaseUrl={idpBaseUrl} />
      </div>
    </main>
  );
}
