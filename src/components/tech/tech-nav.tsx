"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const items = [
  { href: "/tech/upload", label: "Upload", icon: <UploadIcon /> },
  { href: "/tech/history", label: "Riwayat", icon: <HistoryIcon /> },
];

function IconWrapper({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-4 w-4 items-center justify-center">{children}</span>;
}

function UploadIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 16V6" />
        <path d="M8 10l4-4 4 4" />
        <path d="M5 18h14" />
      </svg>
    </IconWrapper>
  );
}

function HistoryIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    </IconWrapper>
  );
}

function LogoutIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M14 7l5 5-5 5" />
        <path d="M19 12H9" />
        <path d="M11 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
      </svg>
    </IconWrapper>
  );
}

function MenuIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </IconWrapper>
  );
}

function CloseIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </IconWrapper>
  );
}

export default function TechNav() {
  const pathname = usePathname();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileDrawerOpen) {
      return;
    }

    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";

    return () => {
      style.overflow = previousOverflow;
    };
  }, [isMobileDrawerOpen]);

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-5xl min-w-0 items-center justify-between gap-2 px-3 py-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm active:bg-slate-100 hover:bg-slate-50"
            aria-expanded={isMobileDrawerOpen}
            aria-controls="tech-mobile-drawer"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
            Menu
          </button>
          <p className="hidden min-w-0 truncate text-sm font-bold text-slate-900 min-[380px]:block">Uploader Panel</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 active:bg-slate-100 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden ${
          isMobileDrawerOpen ? "pointer-events-auto opacity-100" : "hidden"
        }`}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="tech-mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-80 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isMobileDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Uploader Panel</p>
            <h2 className="mt-1 text-base font-bold text-slate-900">AC Reporting</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700"
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-sky-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </aside>

      <nav className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/95 backdrop-blur lg:block">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">Uploader Panel</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
