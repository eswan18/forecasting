import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import LoginFormCard from "./login-form-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect: string }>;
}) {
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
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your forecasting account
          </p>
        </div>
        <LoginFormCard onLogin={revalidateOnLogin} />
      </div>
    </div>
  );
}
