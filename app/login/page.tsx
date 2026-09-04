import { LoginSheet } from "./login-sheet";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect: redirectUrlParam, error } = await searchParams;
  const redirectUrl = redirectUrlParam
    ? decodeURIComponent(redirectUrlParam)
    : "/";

  return <LoginSheet redirectUrl={redirectUrl} initialError={error} />;
}
