import { getUserById } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { redirect } from "next/navigation";
import UserDetailCard from "./user-detail-card";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
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

  return <UserDetailCard user={user} />;
}
