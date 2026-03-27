import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </div>
  );
}
