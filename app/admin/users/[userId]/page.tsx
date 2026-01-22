import { getUserById } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { redirect } from "next/navigation";
import UserDetailCard from "./user-detail-card";
import PageHeading from "@/components/page-heading";

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

  return (
    <main className="flex flex-col items-center py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-4xl">
        <PageHeading
          title={user.name}
          breadcrumbs={{
            Admin: "/admin",
            Users: "/admin/users",
          }}
        />
        <UserDetailCard user={user} />
      </div>
    </main>
  );
}
