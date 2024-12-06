import PageHeading from "@/components/page-heading";

export default async function EmailSentPage() {
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title="Password Reset Email Sent!" />
        <div className="flex flex-col gap-6">
          <p>
            If this username exists and is associated with your email address,
            you&apos;ll receive a password reset email.
          </p>
          <div>
            <p className="font-semibold">
              It usually takes about 5 minutes, so please be patient.
            </p>
            <p>We use a low-budget (i.e. free) email-sending service. Sorry!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
