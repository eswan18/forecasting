import { DataTable } from "./data-table";
import { columns } from "./columns";
import PageHeading from "@/components/page-heading";
import { getUsers } from "@/lib/db_actions";

export default async function Page() {
  const users = await getUsers();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Users" />
        <DataTable
          columns={columns}
          data={users}
        />
      </div>
    </main>
  );
}
