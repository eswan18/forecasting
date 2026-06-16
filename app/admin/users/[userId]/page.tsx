import { getUserById } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { redirect } from "next/navigation";
import UserDetailCard from "./user-detail-card";
import { Container } from "@/components/ui/container";
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
    <main className="py-10 lg:py-14">
      <Container className="max-w-3xl">
        <PageHeading
          title={user.name ?? "User"}
          breadcrumbs={{
            Admin: "/admin",
            Users: "/admin/users",
          }}
        />
        <UserDetailCard user={user} />
      </Container>
    </main>
  );
}
