import RequestPasswordResetFormCard from "./request-reset-password-form-card";
import ResetPasswordFormCard from "./reset-password-form-card";

export default async function ResetPasswordPage(
  { searchParams }: { searchParams: Promise<{ username?: string; token?: string }> },
) {
  const { username, token } = await searchParams;
  console.log("username:", username);
  console.log("token:", token);
  return (
    <div className="flex items-center justify-center mt-48">
      {(username && token)
        ? <ResetPasswordFormCard username={username} token={token} />
        : <RequestPasswordResetFormCard />}
    </div>
  );
}
