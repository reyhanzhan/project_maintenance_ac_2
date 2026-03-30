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
  const editRaw = typeof params.edit === "string" ? params.edit : "";
  const editingHospitalId = editRaw ? Number(editRaw) : 0;
  const toastType = params.toast === "error" ? "error" : params.toast === "success" ? "success" : undefined;
  const toastMessage = typeof params.message === "string" ? params.message : "";
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 8;

  const buildEditHref = (id?: number) => {
    const query = new URLSearchParams();
    if (keyword) {
      query.set("q", keyword);
    }
    if (currentPage > 1) {
      query.set("page", String(currentPage));
    }
    if (id) {
      query.set("edit", String(id));
    }
    const queryString = query.toString();
    return queryString ? `/admin/hospitals?${queryString}` : "/admin/hospitals";
  };

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
    <main className="flex-1 min-w-0 px-4 py-6 md:px-6 md:py-8">
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

        <div className="mt-5 space-y-3 md:hidden">
          {hospitals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Tidak ada data rumah sakit untuk filter ini.
            </p>
          ) : (
            hospitals.map((hospital) => (
              <article key={hospital.id} className="rounded-xl border border-slate-200 p-3">
                {(() => {
                  const isEditing = editingHospitalId === hospital.id;
                  return (
                    <>
                <p className="text-sm font-semibold text-slate-900 wrap-break-word">{hospital.name}</p>
                <p className="mt-1 text-xs text-slate-500 wrap-break-word">{hospital.address ?? "-"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">Units: {hospital._count.acUnits}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Reports: {hospital._count.reports}</span>
                </div>
                <form id={`hospital-update-mobile-${hospital.id}`} action={updateHospital} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={hospital.id} />
                  <input
                    name="name"
                    defaultValue={hospital.name}
                    required
                    readOnly={!isEditing}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                  />
                  <input
                    name="address"
                    defaultValue={hospital.address ?? ""}
                    readOnly={!isEditing}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                  />
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={isEditing ? buildEditHref() : buildEditHref(hospital.id)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {isEditing ? "Batal" : "Edit"}
                  </a>
                  <button
                    type="submit"
                    form={`hospital-update-mobile-${hospital.id}`}
                    disabled={!isEditing}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-900"
                  >
                    Simpan
                  </button>
                  <ConfirmDeleteForm
                    action={deleteHospital}
                    idValue={hospital.id}
                    itemLabel={hospital.name}
                    disabled={hospital._count.reports > 0}
                    helperText={hospital._count.reports > 0 ? "Dipakai report" : undefined}
                  />
                </div>
                    </>
                  );
                })()}
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto md:block">
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
                      {(() => {
                        const isEditing = editingHospitalId === hospital.id;
                        return (
                      <form id={`hospital-update-desktop-${hospital.id}`} action={updateHospital} className="grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="id" value={hospital.id} />
                        <input
                          name="name"
                          defaultValue={hospital.name}
                          required
                          readOnly={!isEditing}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                        />
                        <input
                          name="address"
                          defaultValue={hospital.address ?? ""}
                          readOnly={!isEditing}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                        />
                      </form>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-2">{hospital._count.acUnits}</td>
                    <td className="px-2 py-2">{hospital._count.reports}</td>
                    <td className="px-2 py-2">
                      {(() => {
                        const isEditing = editingHospitalId === hospital.id;
                        return (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={isEditing ? buildEditHref() : buildEditHref(hospital.id)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              {isEditing ? "Batal" : "Edit"}
                            </a>
                            <button
                              type="submit"
                              form={`hospital-update-desktop-${hospital.id}`}
                              disabled={!isEditing}
                              className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-900"
                            >
                              Simpan
                            </button>
                            <ConfirmDeleteForm
                              action={deleteHospital}
                              idValue={hospital.id}
                              itemLabel={hospital.name}
                              disabled={hospital._count.reports > 0}
                              helperText={hospital._count.reports > 0 ? "Dipakai report" : undefined}
                            />
                          </div>
                        );
                      })()}
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
