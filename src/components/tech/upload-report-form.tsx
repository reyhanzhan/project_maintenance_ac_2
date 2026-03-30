"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Hospital = {
  id: number;
  name: string;
  address: string | null;
};

type AcUnit = {
  id: number;
  name: string;
  hospitalId: number;
};

export default function UploadReportForm() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [units, setUnits] = useState<AcUnit[]>([]);

  const [hospitalId, setHospitalId] = useState("");
  const [acUnitId, setAcUnitId] = useState("");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadHospitals = async () => {
      setLoadingHospitals(true);
      const response = await fetch("/api/hospitals", { cache: "no-store" });

      if (!response.ok) {
        setErrorMessage("Gagal memuat data rumah sakit");
        setLoadingHospitals(false);
        return;
      }

      const payload = (await response.json()) as { data: Hospital[] };
      setHospitals(payload.data);
      setLoadingHospitals(false);
    };

    loadHospitals().catch(() => {
      setErrorMessage("Terjadi kesalahan saat memuat rumah sakit");
      setLoadingHospitals(false);
    });
  }, []);

  useEffect(() => {
    if (!hospitalId) {
      return;
    }

    const loadUnits = async () => {
      setLoadingUnits(true);
      const response = await fetch(`/api/ac-units?hospitalId=${hospitalId}`, { cache: "no-store" });

      if (!response.ok) {
        setErrorMessage("Gagal memuat data AC unit");
        setLoadingUnits(false);
        return;
      }

      const payload = (await response.json()) as { data: AcUnit[] };
      setUnits(payload.data);
      setLoadingUnits(false);
    };

    loadUnits().catch(() => {
      setErrorMessage("Terjadi kesalahan saat memuat AC unit");
      setLoadingUnits(false);
    });
  }, [hospitalId]);

  const canSubmit = useMemo(() => {
    return Boolean(hospitalId && acUnitId && photo && !submitting);
  }, [hospitalId, acUnitId, photo, submitting]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setPhoto(selectedFile);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Browser tidak mendukung geolocation");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
      },
      () => {
        setErrorMessage("Gagal mengambil lokasi GPS");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!photo) {
      setErrorMessage("Foto wajib diisi");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("hospitalId", hospitalId);
    formData.append("acUnitId", acUnitId);
    formData.append("note", note);

    if (latitude) {
      formData.append("latitude", latitude);
    }

    if (longitude) {
      formData.append("longitude", longitude);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as { message?: string; data?: { createdAt: string } };

    if (!response.ok) {
      setErrorMessage(payload.message ?? "Gagal upload report");
      setSubmitting(false);
      return;
    }

    const uploadedAt = payload.data?.createdAt;
    const redirectUrl = uploadedAt
      ? `/tech/history?uploadedAt=${encodeURIComponent(uploadedAt)}`
      : "/tech/history";

    router.push(redirectUrl);
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-1 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="photo">
          Foto AC
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          required
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Anda bisa ambil foto langsung atau pilih dari galeri/file.</p>
        {photo ? <p className="mt-1 text-xs text-slate-500">{photo.name}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="hospital">
          Rumah Sakit
        </label>
        <select
          id="hospital"
          value={hospitalId}
          onChange={(event) => {
            setHospitalId(event.target.value);
            setAcUnitId("");
            setUnits([]);
          }}
          required
          disabled={loadingHospitals}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">{loadingHospitals ? "Memuat rumah sakit..." : "Pilih rumah sakit"}</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>
        {!loadingHospitals && hospitals.length === 0 ? (
          <p className="mt-1 text-xs text-amber-700">Data rumah sakit belum tersedia. Jalankan seed lalu refresh halaman.</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="acUnit">
          Unit AC
        </label>
        <select
          id="acUnit"
          value={acUnitId}
          onChange={(event) => setAcUnitId(event.target.value)}
          required
          disabled={!hospitalId || loadingUnits}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Pilih unit AC</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="note">
          Catatan (opsional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Tambahkan kondisi AC, kendala, atau rekomendasi"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
        Tanggal dan jam upload tersimpan otomatis oleh sistem saat Anda menekan tombol Upload Report.
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Lokasi GPS (opsional)</p>
          <button
            type="button"
            onClick={requestLocation}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Ambil Lokasi
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={latitude}
            readOnly
            placeholder="Latitude"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={longitude}
            readOnly
            placeholder="Longitude"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      <div className="sticky bottom-0 bg-white pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Upload Report"}
        </button>
      </div>
    </form>
  );
}
