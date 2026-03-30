"use client";

import { useEffect, useState } from "react";

type AdminToastProps = {
  type: "success" | "error";
  message: string;
};

export default function AdminToast({ type, message }: AdminToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible || !message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-3 top-20 z-70 flex w-[calc(100%-1.5rem)] max-w-sm items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg md:right-6 md:top-6 ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-[11px] font-bold">
          {type === "success" ? "OK" : "!"}
        </span>
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-white/60"
      >
        Tutup
      </button>
    </div>
  );
}
