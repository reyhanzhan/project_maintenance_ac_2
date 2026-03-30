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

async function createAcUnit(formData: FormData) {
  "use server";
  await ensureAdmin();

  const hospitalId = Number(formData.get("hospitalId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!hospitalId || !name) {
    redirect("/admin/ac-units?toast=error&message=Hospital%20dan%20nama%20unit%20wajib%20diisi");
  }

  const duplicate = await prisma.acUnit.findFirst({
    where: {
      hospitalId,
      name,
    },
    select: { id: true },
  });
  if (duplicate) {
    redirect("/admin/ac-units?toast=error&message=Unit%20AC%20sudah%20ada%20di%20hospital%20tersebut");
  }

  await prisma.acUnit.create({
    data: {
      hospitalId,
      name,
    },
  });

  revalidatePath("/admin/ac-units");
  redirect("/admin/ac-units?toast=success&message=Unit%20AC%20berhasil%20ditambahkan");
}

async function updateAcUnit(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  const hospitalId = Number(formData.get("hospitalId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !hospitalId || !name) {
    redirect("/admin/ac-units?toast=error&message=Data%20unit%20AC%20tidak%20valid");
  }

  const duplicate = await prisma.acUnit.findFirst({
    where: {
      hospitalId,
      name,
      NOT: { id },
    },
    select: { id: true },
  });
  if (duplicate) {
    redirect("/admin/ac-units?toast=error&message=Nama%20unit%20sudah%20dipakai%20di%20hospital%20tersebut");
  }

  await prisma.acUnit.update({
    where: { id },
    data: {
      hospitalId,
      name,
    },
  });

  revalidatePath("/admin/ac-units");
  redirect("/admin/ac-units?toast=success&message=Unit%20AC%20berhasil%20diperbarui");
}

async function deleteAcUnit(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirect("/admin/ac-units?toast=error&message=ID%20unit%20AC%20tidak%20valid");
  }

  const reportCount = await prisma.report.count({ where: { acUnitId: id } });
  if (reportCount > 0) {
    redirect("/admin/ac-units?toast=error&message=Unit%20AC%20tidak%20bisa%20dihapus%20karena%20sudah%20dipakai%20report");
  }

  await prisma.acUnit.delete({ where: { id } });
  revalidatePath("/admin/ac-units");
  redirect("/admin/ac-units?toast=success&message=Unit%20AC%20berhasil%20dihapus");
}

export default async function AdminAcUnitsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const hospitalFilterRaw = typeof params.hospitalId === "string" ? params.hospitalId : "";
  const hospitalFilter = hospitalFilterRaw ? Number(hospitalFilterRaw) : undefined;
  const editRaw = typeof params.edit === "string" ? params.edit : "";
  const editingUnitId = editRaw ? Number(editRaw) : 0;
  const toastType = params.toast === "error" ? "error" : params.toast === "success" ? "success" : undefined;
  const toastMessage = typeof params.message === "string" ? params.message : "";
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 10;

  const buildEditHref = (id?: number) => {
    const query = new URLSearchParams();
    if (keyword) {
      query.set("q", keyword);
    }
    if (hospitalFilterRaw) {
      query.set("hospitalId", hospitalFilterRaw);
    }
    if (currentPage > 1) {
      query.set("page", String(currentPage));
    }
    if (id) {
      query.set("edit", String(id));
    }
    const queryString = query.toString();
    return queryString ? `/admin/ac-units?${queryString}` : "/admin/ac-units";
  };

  const where = {
    ...(hospitalFilter ? { hospitalId: hospitalFilter } : {}),
    ...(keyword
      ? {
          OR: [{ name: { contains: keyword } }, { hospital: { name: { contains: keyword } } }],
        }
      : {}),
  };

  const [hospitals, totalCount, units] = await Promise.all([
    prisma.hospital.findMany({ orderBy: { name: "asc" } }),
    prisma.acUnit.count({ where }),
    prisma.acUnit.findMany({
      where,
      orderBy: [{ hospital: { name: "asc" } }, { name: "asc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
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
            <h1 className="text-xl font-bold text-slate-900">AC Units</h1>
            <p className="mt-1 text-sm text-slate-600">Kelola unit AC berdasarkan rumah sakit.</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Total: {totalCount} data
          </div>
        </div>

        <form method="GET" className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Cari unit/hospital"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="hospitalId" defaultValue={hospitalFilterRaw} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Semua rumah sakit</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cari
          </button>
          <a href="/admin/ac-units" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Reset
          </a>
        </form>

        <form action={createAcUnit} className="mt-5 grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
          <select name="hospitalId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Pilih rumah sakit</option>
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
          <input name="name" placeholder="Nama unit AC" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Tambah
          </button>
        </form>

        <div className="mt-5 space-y-3 md:hidden">
          {units.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Tidak ada data AC unit untuk filter ini.
            </p>
          ) : (
            units.map((unit) => (
              <article key={unit.id} className="rounded-xl border border-slate-200 p-3">
                {(() => {
                  const isEditing = editingUnitId === unit.id;
                  return (
                    <>
                <p className="text-sm font-semibold text-slate-900 wrap-break-word">{unit.name}</p>
                <p className="mt-1 text-xs text-slate-500 wrap-break-word">Hospital: {unit.hospital.name}</p>
                <p className="mt-1 text-xs text-slate-600">Reports: {unit._count.reports}</p>

                <form id={`ac-unit-update-mobile-${unit.id}`} action={updateAcUnit} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={unit.id} />
                  <select
                    name="hospitalId"
                    defaultValue={unit.hospitalId}
                    required
                    disabled={!isEditing}
                    className="rounded-md border border-slate-300 px-2.5 py-1.5 disabled:bg-slate-50"
                  >
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="name"
                    defaultValue={unit.name}
                    required
                    readOnly={!isEditing}
                    className="rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                  />
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={isEditing ? buildEditHref() : buildEditHref(unit.id)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {isEditing ? "Batal" : "Edit"}
                  </a>
                  <button
                    type="submit"
                    form={`ac-unit-update-mobile-${unit.id}`}
                    disabled={!isEditing}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-900"
                  >
                    Simpan
                  </button>
                  <ConfirmDeleteForm
                    action={deleteAcUnit}
                    idValue={unit.id}
                    itemLabel={unit.name}
                    disabled={unit._count.reports > 0}
                    helperText={unit._count.reports > 0 ? "Dipakai report" : undefined}
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
                <th className="px-2 py-2">Hospital</th>
                <th className="px-2 py-2">Nama Unit</th>
                <th className="px-2 py-2">Reports</th>
                <th className="px-2 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-5 text-center text-slate-500">
                    Tidak ada data AC unit untuk filter ini.
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id} className="border-b border-slate-100">
                    <td className="px-2 py-2" colSpan={2}>
                      {(() => {
                        const isEditing = editingUnitId === unit.id;
                        return (
                      <form id={`ac-unit-update-desktop-${unit.id}`} action={updateAcUnit} className="grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="id" value={unit.id} />
                        <select
                          name="hospitalId"
                          defaultValue={unit.hospitalId}
                          required
                          disabled={!isEditing}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 disabled:bg-slate-50"
                        >
                          {hospitals.map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}
                            </option>
                          ))}
                        </select>
                        <input
                          name="name"
                          defaultValue={unit.name}
                          required
                          readOnly={!isEditing}
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 read-only:bg-slate-50"
                        />
                      </form>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-2">{unit._count.reports}</td>
                    <td className="px-2 py-2">
                      {(() => {
                        const isEditing = editingUnitId === unit.id;
                        return (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={isEditing ? buildEditHref() : buildEditHref(unit.id)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              {isEditing ? "Batal" : "Edit"}
                            </a>
                            <button
                              type="submit"
                              form={`ac-unit-update-desktop-${unit.id}`}
                              disabled={!isEditing}
                              className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-900"
                            >
                              Simpan
                            </button>
                            <ConfirmDeleteForm
                              action={deleteAcUnit}
                              idValue={unit.id}
                              itemLabel={unit.name}
                              disabled={unit._count.reports > 0}
                              helperText={unit._count.reports > 0 ? "Dipakai report" : undefined}
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
          basePath="/admin/ac-units"
          currentPage={currentPage}
          totalPages={totalPages}
          query={{ q: keyword || undefined, hospitalId: hospitalFilterRaw || undefined }}
        />
      </div>
    </main>
  );
}
