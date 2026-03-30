import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
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

async function createUser(formData: FormData) {
  "use server";
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "TECHNICIAN");
  const role = roleRaw === "ADMIN" ? Role.ADMIN : Role.TECHNICIAN;

  if (!name || !email || !password) {
    redirect("/admin/users?toast=error&message=Nama%2C%20email%2C%20dan%20password%20wajib%20diisi");
  }

  const duplicate = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (duplicate) {
    redirect("/admin/users?toast=error&message=Email%20sudah%20digunakan");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?toast=success&message=User%20berhasil%20ditambahkan");
}

async function updateUser(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "TECHNICIAN");
  const role = roleRaw === "ADMIN" ? Role.ADMIN : Role.TECHNICIAN;
  const newPassword = String(formData.get("newPassword") ?? "").trim();

  if (!id || !name || !email) {
    redirect("/admin/users?toast=error&message=Data%20user%20tidak%20valid");
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id },
    },
    select: { id: true },
  });
  if (duplicate) {
    redirect("/admin/users?toast=error&message=Email%20sudah%20digunakan%20user%20lain");
  }

  const data: {
    name: string;
    email: string;
    role: Role;
    password?: string;
  } = {
    name,
    email,
    role,
  };

  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?toast=success&message=User%20berhasil%20diperbarui");
}

async function deleteUser(formData: FormData) {
  "use server";
  await ensureAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirect("/admin/users?toast=error&message=ID%20user%20tidak%20valid");
  }

  const relatedReports = await prisma.report.count({ where: { userId: id } });
  if (relatedReports > 0) {
    redirect("/admin/users?toast=error&message=User%20tidak%20bisa%20dihapus%20karena%20sudah%20memiliki%20report");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  redirect("/admin/users?toast=success&message=User%20berhasil%20dihapus");
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const roleFilterRaw = typeof params.role === "string" ? params.role : "";
  const roleFilter = roleFilterRaw === "ADMIN" || roleFilterRaw === "TECHNICIAN" ? (roleFilterRaw as Role) : undefined;
  const toastType = params.toast === "error" ? "error" : params.toast === "success" ? "success" : undefined;
  const toastMessage = typeof params.message === "string" ? params.message : "";
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);
  const pageSize = 10;
  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
            { role: { equals: keyword.toUpperCase() as "ADMIN" | "TECHNICIAN" } },
          ],
        }
      : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="flex-1 min-w-0 px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {toastType && toastMessage ? <AdminToast type={toastType} message={toastMessage} /> : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Users</h1>
            <p className="mt-1 text-sm text-slate-600">Kelola akun admin dan uploader/technician.</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Total: {totalCount} user
          </div>
        </div>

        <form method="GET" className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Cari nama/email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="role" defaultValue={roleFilterRaw} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Semua role</option>
            <option value="TECHNICIAN">TECHNICIAN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cari
          </button>
          <a href="/admin/users" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Reset
          </a>
        </form>

        <form action={createUser} className="mt-5 grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-5">
          <input name="name" placeholder="Nama" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="password" type="password" placeholder="Password" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="role" defaultValue="TECHNICIAN" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="TECHNICIAN">TECHNICIAN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Tambah
          </button>
        </form>

        <div className="mt-5 space-y-3 md:hidden">
          {users.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Tidak ada user untuk filter ini.
            </p>
          ) : (
            users.map((user) => (
              <article key={user.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900 wrap-break-word">{user.name}</p>
                <p className="mt-1 text-xs text-slate-500 wrap-break-word">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{user.role}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Reports: {user._count.reports}</span>
                </div>

                <form action={updateUser} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={user.id} />
                  <input name="name" defaultValue={user.name} required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
                  <input name="email" defaultValue={user.email} required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
                  <select name="role" defaultValue={user.role} className="rounded-md border border-slate-300 px-2.5 py-1.5">
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <input name="newPassword" type="password" placeholder="Password baru (opsional)" className="rounded-md border border-slate-300 px-2.5 py-1.5" />
                  <button type="submit" className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900">
                    Simpan
                  </button>
                </form>

                <div className="mt-3">
                  <ConfirmDeleteForm
                    action={deleteUser}
                    idValue={user.id}
                    itemLabel={user.email}
                    disabled={user._count.reports > 0}
                    helperText={user._count.reports > 0 ? "Punya report" : undefined}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">New Password</th>
                <th className="px-2 py-2">Reports</th>
                <th className="px-2 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-center text-slate-500">
                    Tidak ada user untuk filter ini.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-2 py-2" colSpan={4}>
                    <form action={updateUser} className="grid gap-2 md:grid-cols-4">
                      <input type="hidden" name="id" value={user.id} />
                      <input name="name" defaultValue={user.name} required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
                      <input name="email" defaultValue={user.email} required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
                      <select name="role" defaultValue={user.role} className="rounded-md border border-slate-300 px-2.5 py-1.5">
                        <option value="TECHNICIAN">TECHNICIAN</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <div className="flex gap-2">
                        <input name="newPassword" type="password" placeholder="Kosongkan jika tidak diubah" className="w-full rounded-md border border-slate-300 px-2.5 py-1.5" />
                        <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">
                          Simpan
                        </button>
                      </div>
                    </form>
                  </td>
                  <td className="px-2 py-2">{user._count.reports}</td>
                  <td className="px-2 py-2">
                    <ConfirmDeleteForm
                      action={deleteUser}
                      idValue={user.id}
                      itemLabel={user.email}
                      disabled={user._count.reports > 0}
                      helperText={user._count.reports > 0 ? "Punya report" : undefined}
                    />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          basePath="/admin/users"
          currentPage={currentPage}
          totalPages={totalPages}
          query={{ q: keyword || undefined, role: roleFilter || undefined }}
        />
      </div>
    </main>
  );
}
