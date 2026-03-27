"use client";

import { useId, useState } from "react";

type ConfirmDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  helperText?: string;
  idValue: number;
  itemLabel: string;
};

export default function ConfirmDeleteForm({
  action,
  disabled = false,
  helperText,
  idValue,
  itemLabel,
}: ConfirmDeleteFormProps) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
        title={disabled ? helperText : `Hapus ${itemLabel}`}
      >
        Hapus
      </button>
      {helperText && disabled ? <p className="mt-1 text-[11px] text-amber-700">{helperText}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            aria-describedby={`${dialogId}-desc`}
            aria-labelledby={`${dialogId}-title`}
            aria-modal="true"
            role="dialog"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 id={`${dialogId}-title`} className="text-lg font-bold text-slate-900">
              Konfirmasi hapus
            </h3>
            <p id={`${dialogId}-desc`} className="mt-2 text-sm text-slate-600">
              Yakin ingin menghapus <span className="font-semibold text-slate-900">{itemLabel}</span>? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <form action={action}>
                <input type="hidden" name="id" value={idValue} />
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Ya, hapus
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
