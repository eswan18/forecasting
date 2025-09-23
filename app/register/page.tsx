import { getUserFromCookies } from "@/lib/get-user";
import RegisterFormCard from "./register-form-card";
import { InaccessiblePage } from "@/components/inaccessible-page";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = await getUserFromCookies();
  if (!token && !user?.is_admin) {
    return (
      <InaccessiblePage
        title="No access"
        message="You must use an invite link to register. Contact Ethan for help."
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <RegisterFormCard inviteToken={token} />
      </div>
    </div>
  );
}
