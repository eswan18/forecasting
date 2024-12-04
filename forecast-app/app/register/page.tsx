import { getUserFromCookies } from "@/lib/get-user";
import RegisterFormCard from "./register-form-card";

export default async function RegisterPage(
  { searchParams }: { searchParams: Promise<{ token?: string }> },
) {
  const { token } = await searchParams;
  const user = await getUserFromCookies();
  if (!token && !user?.is_admin) {
    return <div className="flex items-center justify-center pt-4">
      <div className="text-2xl text-center">
        You must use an invite link to register.
      </div>
    </div>;
  }
  return (
    <div className="flex items-center justify-center pt-4">
      <RegisterFormCard inviteToken={token} />
    </div>
  );
}
