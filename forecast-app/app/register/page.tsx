import RegisterFormCard from "./register-form-card";

export default async function RegisterPage(
  { searchParams }: { searchParams: Promise<{ token?: string }> },
) {
  const { token } = await searchParams;
  return (
    <div className="flex items-center justify-center pt-4">
      <RegisterFormCard inviteToken={token} />
    </div>
  );
}
