import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      <AdminNav />
      <div className="flex min-h-screen min-w-0 w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
