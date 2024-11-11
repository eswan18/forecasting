import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation'
import LoginFormCard from "./login-form-card";

export default async function LoginPage() {
  const revalidateOnLogin = async () => {
    "use server";
    revalidatePath("/");
    redirect("/");
  }
  return (
    <div className="flex items-center justify-center mt-48">
      <LoginFormCard onLogin={revalidateOnLogin} />
    </div>
  );
}
