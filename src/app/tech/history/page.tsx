import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TechnicianHistoryPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/tech/history");
  }

  if (session.user.role !== "TECHNICIAN") {
    redirect("/admin/dashboard");
  }

  const params = (await searchParams) ?? {};
  const uploadedAtRaw = typeof params.uploadedAt === "string" ? params.uploadedAt : undefined;

  const reports = await prisma.report.findMany({
    where: {
      userId: Number(session.user.id),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      hospital: {
        select: {
          name: true,
        },
      },
      acUnit: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-4 sm:py-8">
      <div className="mb-4 rounded-2xl bg-linear-to-r from-emerald-700 to-teal-600 p-5 text-white">
        <h1 className="text-xl font-bold">Riwayat Upload</h1>
        <p className="mt-1 text-sm text-emerald-100">20 laporan terakhir yang Anda kirim.</p>
      </div>

      {uploadedAtRaw ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Report berhasil diupload pada {formatDateTime(new Date(uploadedAtRaw))}
        </div>
      ) : null}

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Belum ada riwayat upload. Silakan kirim laporan pertama dari menu Upload.
          </div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{report.hospital.name} - {report.acUnit.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(report.createdAt)}</p>
                </div>
                <a
                  href={report.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Lihat Foto
                </a>
              </div>

              {report.note ? <p className="mt-2 text-sm text-slate-700">{report.note}</p> : null}

              {(report.latitude || report.longitude) ? (
                <p className="mt-2 text-xs text-slate-500">
                  Lokasi: {report.latitude ? report.latitude.toString() : "-"}, {report.longitude ? report.longitude.toString() : "-"}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
