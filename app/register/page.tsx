import { getUserFromCookies } from "@/lib/get-user";
import RegisterFormCard from "./register-form-card";
import { InaccessiblePage } from "@/components/inaccessible-page";

export default async function RegisterPage() {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    return (
      <InaccessiblePage
        title="No access"
        message="Only admins can register new users."
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <RegisterFormCard />
      </div>
    </div>
  );
}
