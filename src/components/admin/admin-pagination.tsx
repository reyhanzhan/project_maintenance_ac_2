import Link from "next/link";

type AdminPaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  query: Record<string, string | undefined>;
};

function buildHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export default function AdminPagination({ basePath, currentPage, totalPages, query }: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-slate-500 sm:text-left">
        Halaman {currentPage} dari {totalPages}
      </p>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
        <Link
          href={buildHref(basePath, query, Math.max(1, currentPage - 1))}
          className={`rounded-lg border px-3 py-2 text-center font-semibold ${
            currentPage === 1
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Sebelumnya
        </Link>
        <Link
          href={buildHref(basePath, query, Math.min(totalPages, currentPage + 1))}
          className={`rounded-lg border px-3 py-2 text-center font-semibold ${
            currentPage === totalPages
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Berikutnya
        </Link>
      </div>
    </div>
  );
}
