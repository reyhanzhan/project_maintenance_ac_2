import TechNav from "@/components/tech/tech-nav";

export default function TechLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <TechNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
