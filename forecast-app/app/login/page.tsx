import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import LoginFormCard from "./login-form-card";

export default async function LoginPage(
  { searchParams }: { searchParams: Promise<{ redirect: string }> },
) {
  const { redirect: redirectUrlParam } = await searchParams;
  const redirectUrl = redirectUrlParam
    ? decodeURIComponent(redirectUrlParam)
    : "/";

  const revalidateOnLogin = async () => {
    "use server";
    revalidatePath("/");
    redirect(redirectUrl);
  };
  return (
    <div className="flex items-center justify-center mt-48">
      <LoginFormCard onLogin={revalidateOnLogin} />
    </div>
  );
}
