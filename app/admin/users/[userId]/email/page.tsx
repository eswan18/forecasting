import { redirect } from "next/navigation";

import { getUserById } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";

import SendEmailForm from "./send-email-form";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function SendEmailPage({ params }: PageProps) {
  const { userId } = await params;
  const userIdNumber = parseInt(userId, 10);

  if (isNaN(userIdNumber)) {
    redirect("/admin/users");
  }

  const result = await getUserById(userIdNumber);
  const user = handleServerActionResult(result);

  if (!user) {
    redirect("/admin/users");
  }

  // Nothing to write to, so there is no form to show.
  if (!user.email) {
    redirect(`/admin/users/${userIdNumber}`);
  }

  return <SendEmailForm user={user} />;
}
