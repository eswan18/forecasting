import PageHeading from "@/components/page-heading";
import { Container } from "@/components/ui/container";
import { AccountDetails } from "./account-details";

export default async function Page() {
  const idpBaseUrl = process.env.IDP_BASE_URL;
  return (
    <main className="py-10 lg:py-14">
      <Container>
        <PageHeading
          title="Account Settings"
          subtitle="Manage your profile and identity provider details."
        />
        <AccountDetails idpBaseUrl={idpBaseUrl} />
      </Container>
    </main>
  );
}
