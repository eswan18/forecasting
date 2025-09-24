import RequestPasswordResetFormCard from "./request-reset-password-form-card";
import ResetPasswordFormCard from "./reset-password-form-card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; token?: string }>;
}) {
  const { username, token } = await searchParams;
  return (
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {username && token ? (
          <ResetPasswordFormCard username={username} token={token} />
        ) : (
          <RequestPasswordResetFormCard />
        )}
      </div>
    </div>
  );
}
