import LoginFormCard from "./login-form-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect: redirectUrlParam, error } = await searchParams;
  const redirectUrl = redirectUrlParam
    ? decodeURIComponent(redirectUrlParam)
    : "/";

  return (
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <LoginFormCard redirectUrl={redirectUrl} initialError={error} />
      </div>
    </div>
  );
}
