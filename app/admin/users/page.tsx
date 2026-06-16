import UsersTable from "./users-table";
import { getUsers } from "@/lib/db_actions";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { Container } from "@/components/ui/container";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const result = await getUsers();
  const users = handleServerActionResult(result);

  users.sort((a, b) => a.id - b.id);

  return (
    <main className="py-10 lg:py-14">
      <Container>
        <PageHeading
          title="Users"
          subtitle="Browse accounts, manage access, and impersonate users."
          breadcrumbs={{ Admin: "/admin" }}
        />

        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 sm:px-5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              All Users (<span className="tabular-nums">{users.length}</span>)
            </span>
          </div>
          <div className="overflow-x-auto">
            <UsersTable data={users} />
          </div>
        </section>
      </Container>
    </main>
  );
}
