import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UploadReportForm from "@/components/tech/upload-report-form";
import { authOptions } from "@/lib/auth";

export default async function TechnicianUploadPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/tech/upload");
  }

  if (session.user.role !== "TECHNICIAN") {
    redirect("/admin/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-4 sm:py-8">
      <div className="mb-4 rounded-2xl bg-linear-to-r from-sky-700 to-cyan-600 p-5 text-white">
        <h1 className="text-xl font-bold">Upload Laporan AC</h1>
        <p className="mt-1 text-sm text-sky-100">Alur cepat untuk teknisi lapangan (uploader)</p>
      </div>
      <UploadReportForm />
    </main>
  );
}
