import { InaccessiblePage } from "@/components/inaccessible-page";
import { getUserFromCookies } from "@/lib/get-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  const authorized = user?.is_admin;
  if (!authorized) {
    return (
      <InaccessiblePage
        title="No access"
        message="Only admins can see this page."
      />
    );
  }
  return (
    <div className="w-full">
      <div className="w-full py-1 bg-accent text-accent-foreground text-center font-semibold">
        Admin Panel
      </div>
      {children}
    </div>
  );
}
