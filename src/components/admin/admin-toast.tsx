"use client";

import { useState } from "react";

type AdminToastProps = {
  type: "success" | "error";
  message: string;
};

export default function AdminToast({ type, message }: AdminToastProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) {
    return null;
  }

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      <p>{message}</p>
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
