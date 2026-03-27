import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { reportUploadSchema } from "@/lib/validators/report.validator";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TECHNICIAN") {
    return NextResponse.json(
      { message: "Unauthorized. Hanya user uploader/technician yang dapat mengirim laporan." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File)) {
    return NextResponse.json({ message: "Photo file is required" }, { status: 400 });
  }

  if (!photo.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
  }

  if (photo.size > MAX_FILE_BYTES) {
    return NextResponse.json({ message: "File must be less than 10MB" }, { status: 400 });
  }

  const payload = {
    hospitalId: formData.get("hospitalId"),
    acUnitId: formData.get("acUnitId"),
    note: formData.get("note") ?? "",
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  };

  const validated = reportUploadSchema.safeParse(payload);
  if (!validated.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validated.error.flatten(),
      },
      { status: 422 }
    );
  }

  const unit = await prisma.acUnit.findFirst({
    where: {
      id: validated.data.acUnitId,
      hospitalId: validated.data.hospitalId,
    },
    select: { id: true },
  });

  if (!unit) {
    return NextResponse.json({ message: "AC unit does not belong to selected hospital" }, { status: 400 });
  }

  try {
    const photoUrl = await uploadImageToCloudinary(photo);

    const report = await prisma.report.create({
      data: {
        userId: Number(session.user.id),
        hospitalId: validated.data.hospitalId,
        acUnitId: validated.data.acUnitId,
        photoUrl,
        note: validated.data.note || null,
        latitude: validated.data.latitude ?? null,
        longitude: validated.data.longitude ?? null,
      },
      select: {
        id: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Upload route error", error);

    if (error instanceof Error && error.message === "CLOUDINARY_NOT_CONFIGURED") {
      return NextResponse.json(
        { message: "Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di .env" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Failed to upload report. Periksa konfigurasi Cloudinary dan koneksi internet." }, { status: 500 });
  }
}
