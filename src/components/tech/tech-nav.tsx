"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

export default function TechNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
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
  );
}
