import { prisma } from "@/lib/prisma";
import AdminPagination from "@/components/admin/admin-pagination";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const hospitalIdRaw = typeof params.hospitalId === "string" ? params.hospitalId : "";
  const technicianIdRaw = typeof params.technicianId === "string" ? params.technicianId : "";
  const hospitalId = hospitalIdRaw ? Number(hospitalIdRaw) : undefined;
  const technicianId = technicianIdRaw ? Number(technicianIdRaw) : undefined;
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 10;
  const where = {
    ...(hospitalId ? { hospitalId } : {}),
    ...(technicianId ? { userId: technicianId } : {}),
    ...(keyword
      ? {
          OR: [
            { note: { contains: keyword } },
            { hospital: { name: { contains: keyword } } },
            { acUnit: { name: { contains: keyword } } },
            { user: { name: { contains: keyword } } },
          ],
        }
      : {}),
  };

  const [hospitals, technicians, totalCount, reports] = await Promise.all([
    prisma.hospital.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: "TECHNICIAN" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
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
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="flex-1 min-w-0 px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-600">Daftar laporan uploader dengan filter dan pagination server-side.</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Total: {totalCount} data
          </div>
        </div>

        <form method="GET" className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Cari technician, hospital, unit, catatan"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="hospitalId" defaultValue={hospitalIdRaw} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Semua hospital</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
          <select name="technicianId" defaultValue={technicianIdRaw} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Semua technician</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cari
          </button>
          <a href="/admin/reports" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Reset
          </a>
        </form>

        <div className="mt-5 space-y-3 md:hidden">
          {reports.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada data report.</p>
          ) : (
            reports.map((report) => (
              <article key={report.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 wrap-break-word">
                  {report.hospital.name} - {report.acUnit.name}
                </p>
                <p className="mt-1 text-xs text-slate-600 wrap-break-word">
                  {report.user.name} ({report.user.email})
                </p>
                <p className="mt-2 text-xs text-slate-500 wrap-break-word">{report.note ?? "-"}</p>
                <p className="mt-2 text-xs text-slate-600 wrap-break-word">
                  Lokasi: {report.latitude && report.longitude
                    ? `${report.latitude.toString()}, ${report.longitude.toString()}`
                    : "-"}
                </p>
                <a
                  href={report.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  Preview Foto
                </a>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Waktu</th>
                <th className="px-2 py-2">Technician</th>
                <th className="px-2 py-2">Hospital</th>
                <th className="px-2 py-2">AC Unit</th>
                <th className="px-2 py-2">Catatan</th>
                <th className="px-2 py-2">Lokasi</th>
                <th className="px-2 py-2">Foto</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={7}>
                    Belum ada data report.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-2">{formatDateTime(report.createdAt)}</td>
                    <td className="px-2 py-2">
                      <p className="font-medium text-slate-900">{report.user.name}</p>
                      <p className="text-xs text-slate-500">{report.user.email}</p>
                    </td>
                    <td className="px-2 py-2">{report.hospital.name}</td>
                    <td className="px-2 py-2">{report.acUnit.name}</td>
                    <td className="px-2 py-2">{report.note ?? "-"}</td>
                    <td className="px-2 py-2">
                      {report.latitude && report.longitude
                        ? `${report.latitude.toString()}, ${report.longitude.toString()}`
                        : "-"}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                          IMG
                        </span>
                        <a
                          href={report.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Preview
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          basePath="/admin/reports"
          currentPage={currentPage}
          totalPages={totalPages}
          query={{ q: keyword || undefined, hospitalId: hospitalIdRaw || undefined, technicianId: technicianIdRaw || undefined }}
        />
      </div>
    </main>
  );
}
