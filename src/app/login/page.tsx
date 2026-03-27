"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: callbackUrl ?? "/",
    });

    if (result?.error) {
      setLoading(false);
      setError("Email atau password tidak valid");
      return;
    }

    const session = await getSession();
    const fallbackByRole = session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/tech/upload";
    const destination = callbackUrl && callbackUrl !== "/login" ? callbackUrl : fallbackByRole;

    setLoading(false);
    router.push(destination);
    router.refresh();
  };

  return (
      <main className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef5fb_100%)]">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-stretch px-4 py-5 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
          <section className="hidden overflow-hidden rounded-4xl border border-slate-200/70 bg-slate-900 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:flex lg:flex-col lg:justify-between">
            <div className="relative overflow-hidden px-8 py-8 xl:px-12 xl:py-10">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.22),transparent_35%,rgba(52,211,153,0.18)_100%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  AC Maintenance Control
                </div>

                <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight text-white xl:text-5xl">
                  Satu pintu untuk laporan lapangan, validasi admin, dan monitoring unit AC rumah sakit.
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 xl:text-[15px]">
                  Dirancang untuk operasional harian yang cepat: teknisi upload dari lapangan, admin memantau performa unit, dan seluruh histori tersimpan rapi dalam satu dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 bg-white/5 px-8 py-8 backdrop-blur xl:grid-cols-[1.1fr_0.9fr] xl:px-12">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">Operational Snapshot</p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-semibold text-white">24/7</p>
                    <p className="mt-1 text-sm text-slate-300">Akses admin dan teknisi</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-white">Realtime</p>
                    <p className="mt-1 text-sm text-slate-300">Status upload dan histori</p>
                  </div>
                </div>
                <div className="mt-6 h-28 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(15,23,42,0.18)_45%,rgba(16,185,129,0.24))] p-4">
                  <div className="flex h-full items-end gap-2">
                    {[48, 72, 58, 86, 68, 90, 78].map((value, index) => (
                      <div key={index} className="flex-1 rounded-t-full bg-white/70" style={{ height: `${value}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Upload laporan lengkap dengan foto dan timestamp otomatis.",
                  "Pantau seluruh rumah sakit, unit AC, dan histori teknisi.",
                  "Kontrol akses admin dan uploader dari satu sistem.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center py-4 lg:items-stretch lg:py-0 lg:pl-8">
            <div className="w-full max-w-xl lg:max-w-none lg:flex-1">
              <div className="overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:flex lg:h-full lg:flex-col">
                <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))] px-6 py-6 md:px-8">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                        <path d="M12 3 4.5 7v5.5c0 4.6 2.9 7.7 7.5 8.5 4.6-.8 7.5-3.9 7.5-8.5V7z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Secure Access</p>
                      <h2 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.03em] text-slate-950 md:text-3xl">Masuk ke portal operasional</h2>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                        Login aman untuk tim lapangan dan admin maintenance dalam satu sistem terpusat.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Enkripsi aktif
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M12 8v4l2.5 2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      Session timeout otomatis
                    </span>
                  </div>
                </div>

                <div className="px-6 py-6 md:px-8 md:py-8 lg:flex-1 lg:space-y-6">
                  <form className="space-y-5" onSubmit={onSubmit}>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
                        Email
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-slate-400">
                          <path d="M4 7.5 12 13l8-5.5" />
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                        </svg>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          autoComplete="email"
                          placeholder="nama@rumahsakit.com"
                          className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                          Password
                        </label>
                        <span className="text-xs font-medium text-slate-400">Case-sensitive</span>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-slate-400">
                          <rect x="4" y="11" width="16" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                        </svg>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          autoComplete="current-password"
                          placeholder="Masukkan password Anda"
                          className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                        >
                          {showPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#0f3d66_48%,#0ea5e9_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200/50 transition hover:-translate-y-px hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path d="M5 12h14" />
                        <path d="m13 5 7 7-7 7" />
                      </svg>
                      {loading ? "Memproses login..." : "Masuk ke sistem"}
                    </button>
                  </form>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Butuh Bantuan Login?</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">Hubungi admin fasilitas untuk reset akun atau validasi akses pengguna baru.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tips Keamanan</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">Jangan simpan password di perangkat umum dan selalu logout setelah selesai digunakan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}
