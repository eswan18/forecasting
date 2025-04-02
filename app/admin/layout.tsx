export default async function AdminLayout(
  { children }: { children: React.ReactNode },
) {
  return (
    <div className="w-full">
      <div className="w-full py-1 bg-accent text-accent-foreground text-center font-semibold">Admin Panel</div>
      {children}
    </div>
  );
}
