import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalReports,
    todayReports,
    totalHospitals,
    totalUnits,
    totalTechnicians,
    latestReports,
    reportsByHospital,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),
    prisma.hospital.count(),
    prisma.acUnit.count(),
    prisma.user.count({ where: { role: Role.TECHNICIAN } }),
    prisma.report.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        hospital: { select: { name: true } },
        acUnit: { select: { name: true } },
      },
    }),
    prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: {
        reports: {
          _count: "desc",
        },
      },
      take: 5,
    }),
  ]);

  return (
    <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
      <section className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Admin Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Ringkasan Operasional Maintenance AC</h1>
        <p className="mt-2 text-sm text-slate-200">Pantau performa tim, volume laporan, dan aktivitas terbaru di satu layar.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Reports</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalReports}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reports Hari Ini</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{todayReports}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hospitals</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalHospitals}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AC Units</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalUnits}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technicians</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalTechnicians}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Laporan Terbaru</h2>
            <span className="text-xs font-semibold text-slate-500">Last {latestReports.length} entries</span>
          </div>

          {latestReports.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Belum ada laporan masuk.
            </p>
          ) : (
            <div className="space-y-2">
              {latestReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{report.hospital.name} - {report.acUnit.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Teknisi: {report.user.name}</p>
                  {report.note ? <p className="mt-1 text-xs text-slate-500">{report.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h2 className="text-lg font-bold text-slate-900">Top Hospitals by Reports</h2>
          <div className="mt-3 space-y-2">
            {reportsByHospital.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Belum ada data rumah sakit.
              </p>
            ) : (
              reportsByHospital.map((hospital) => (
                <div key={hospital.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{hospital.name}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {hospital._count.reports} report
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
