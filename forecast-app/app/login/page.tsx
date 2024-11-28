import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import LoginFormCard from "./login-form-card";

export default async function LoginPage(
  { searchParams }: { searchParams: Promise<{ redirect: string }> },
) {
  const { redirect: redirectUrl } = await searchParams;
  const decodedRedirectUrl = decodeURIComponent(redirectUrl);

  const revalidateOnLogin = async () => {
    "use server";
    revalidatePath("/");
    redirect(decodedRedirectUrl);
  };
  return (
    <div className="flex items-center justify-center mt-48">
      <LoginFormCard onLogin={revalidateOnLogin} />
    </div>
  );
}
