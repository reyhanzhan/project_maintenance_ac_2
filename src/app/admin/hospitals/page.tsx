import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPagination from "@/components/admin/admin-pagination";
import AdminToast from "@/components/admin/admin-toast";
import ConfirmDeleteForm from "@/components/admin/confirm-delete-form";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function ensureAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createHospital(formData: FormData) {
  "use server";
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const addressRaw = String(formData.get("address") ?? "").trim();
  const address = addressRaw.length > 0 ? addressRaw : null;

  if (!name) {
    redirect("/admin/hospitals?toast=error&message=Nama%20rumah%20sakit%20wajib%20diisi");
  }

  const duplicate = await prisma.hospital.findFirst({
    where: { name },
    select: { id: true },
  });
  if (duplicate) {
    redirect("/admin/hospitals?toast=error&message=Nama%20rumah%20sakit%20sudah%20ada");
  }

  await prisma.hospital.create({
    data: {
      name,
      address,
    },
  });

  revalidatePath("/admin/hospitals");
  redirect("/admin/hospitals?toast=success&message=Rumah%20sakit%20berhasil%20ditambahkan");
}

async function updateHospital(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const addressRaw = String(formData.get("address") ?? "").trim();
  const address = addressRaw.length > 0 ? addressRaw : null;

  if (!id || !name) {
    redirect("/admin/hospitals?toast=error&message=Data%20rumah%20sakit%20tidak%20valid");
  }

  const duplicate = await prisma.hospital.findFirst({
    where: {
      name,
      NOT: { id },
    },
    select: { id: true },
  });
  if (duplicate) {
    redirect("/admin/hospitals?toast=error&message=Nama%20rumah%20sakit%20sudah%20dipakai");
  }

  await prisma.hospital.update({
    where: { id },
    data: {
      name,
      address,
    },
  });

  revalidatePath("/admin/hospitals");
  redirect("/admin/hospitals?toast=success&message=Rumah%20sakit%20berhasil%20diperbarui");
}

async function deleteHospital(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirect("/admin/hospitals?toast=error&message=ID%20rumah%20sakit%20tidak%20valid");
  }

  const relatedReports = await prisma.report.count({ where: { hospitalId: id } });
  if (relatedReports > 0) {
    redirect("/admin/hospitals?toast=error&message=Rumah%20sakit%20tidak%20bisa%20dihapus%20karena%20sudah%20dipakai%20report");
  }

  await prisma.hospital.delete({ where: { id } });
  revalidatePath("/admin/hospitals");
  redirect("/admin/hospitals?toast=success&message=Rumah%20sakit%20berhasil%20dihapus");
}

export default async function AdminHospitalsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const toastType = params.toast === "error" ? "error" : params.toast === "success" ? "success" : undefined;
  const toastMessage = typeof params.message === "string" ? params.message : "";
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 8;

  const where = keyword
    ? {
        OR: [{ name: { contains: keyword } }, { address: { contains: keyword } }],
      }
    : undefined;

  const [totalCount, hospitals] = await Promise.all([
    prisma.hospital.count({ where }),
    prisma.hospital.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            acUnits: true,
            reports: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {toastType && toastMessage ? <AdminToast type={toastType} message={toastMessage} /> : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hospitals</h1>
            <p className="mt-1 text-sm text-slate-600">Kelola data rumah sakit yang digunakan uploader.</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Total: {totalCount} data
          </div>
        </div>

        <form method="GET" className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto]">
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Cari nama/alamat rumah sakit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cari
          </button>
          <a href="/admin/hospitals" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Reset
          </a>
        </form>

        <form action={createHospital} className="mt-5 grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            name="name"
            placeholder="Nama rumah sakit"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input name="address" placeholder="Alamat (opsional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Tambah
          </button>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Alamat</th>
                <th className="px-2 py-2">AC Units</th>
                <th className="px-2 py-2">Reports</th>
                <th className="px-2 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-5 text-center text-slate-500">
                    Tidak ada data rumah sakit untuk filter ini.
                  </td>
                </tr>
              ) : (
                hospitals.map((hospital) => (
                  <tr key={hospital.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-2" colSpan={2}>
                      <form action={updateHospital} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                        <input type="hidden" name="id" value={hospital.id} />
                        <input
                          name="name"
                          defaultValue={hospital.name}
                          required
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
                        />
                        <input
                          name="address"
                          defaultValue={hospital.address ?? ""}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
                        />
                        <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">
                          Simpan
                        </button>
                      </form>
                    </td>
                    <td className="px-2 py-2">{hospital._count.acUnits}</td>
                    <td className="px-2 py-2">{hospital._count.reports}</td>
                    <td className="px-2 py-2">
                      <ConfirmDeleteForm
                        action={deleteHospital}
                        idValue={hospital.id}
                        itemLabel={hospital.name}
                        disabled={hospital._count.reports > 0}
                        helperText={hospital._count.reports > 0 ? "Dipakai report" : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

          <AdminPagination
            basePath="/admin/hospitals"
            currentPage={currentPage}
            totalPages={totalPages}
            query={{ q: keyword || undefined }}
          />
      </div>
    </main>
  );
}
