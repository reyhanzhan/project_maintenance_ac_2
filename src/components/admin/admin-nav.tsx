"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/admin/reports", label: "Reports", icon: <ReportIcon /> },
  { href: "/admin/hospitals", label: "Hospitals", icon: <HospitalIcon /> },
  { href: "/admin/ac-units", label: "AC Units", icon: <AcUnitIcon /> },
  { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
];

function IconWrapper({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-4 w-4 items-center justify-center">{children}</span>;
}

function DashboardIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 13h7V4H4zM13 20h7v-9h-7zM13 11h7V4h-7zM4 20h7v-5H4z" />
      </svg>
    </IconWrapper>
  );
}

function ReportIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M8 7h8M8 12h8M8 17h5" />
        <path d="M7 3h7l5 5v13H7z" />
      </svg>
    </IconWrapper>
  );
}

function HospitalIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M6 21V5h12v16" />
        <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M12 8v8M8 16h8" />
      </svg>
    </IconWrapper>
  );
}

function AcUnitIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <path d="M7 11h10M8 14h1M11.5 14h1M15 14h1M6 17v2M18 17v2" />
      </svg>
    </IconWrapper>
  );
}

function UsersIcon() {
  return (
    <IconWrapper>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M16 19a4 4 0 0 0-8 0" />
        <circle cx="12" cy="11" r="3" />
        <path d="M19 19a3 3 0 0 0-2-2.82M17 8.5a2.5 2.5 0 0 1 0 5" />
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

export function AdminNav() {
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
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Panel</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">AC Reporting</h2>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </aside>

      <nav className="sticky top-0 z-20 w-full min-w-0 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm active:bg-slate-100 hover:bg-slate-50"
            aria-expanded={isMobileDrawerOpen}
            aria-controls="admin-mobile-drawer"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
            Menu
          </button>
          <h2 className="hidden min-w-0 truncate text-sm font-bold text-slate-900 min-[380px]:block">Admin Panel</h2>
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
        id="admin-mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-80 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isMobileDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Admin Panel</p>
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
          {navItems.map((item) => {
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
    </>
  );
}
