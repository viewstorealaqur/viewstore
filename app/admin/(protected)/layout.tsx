import { requireOwner, getSafeUser } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  const user = await getSafeUser();

  return (
    <div className="admin-shell">
      <AdminNav userEmail={user?.email ?? ""} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
