import { AccountDetails } from "./account-details";

export default async function Page() {
  // The sheet is the page: masthead, record, and the door to the provider. No
  // wrapper heading, because the sheet prints its own.
  return <AccountDetails idpBaseUrl={process.env.IDP_BASE_URL} />;
}
