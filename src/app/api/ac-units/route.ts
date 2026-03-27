import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const hospitalIdRaw = request.nextUrl.searchParams.get("hospitalId");
  const hospitalId = Number(hospitalIdRaw);

  if (!hospitalIdRaw || Number.isNaN(hospitalId) || hospitalId <= 0) {
    return NextResponse.json({ message: "hospitalId is required" }, { status: 400 });
  }

  const units = await prisma.acUnit.findMany({
    where: { hospitalId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      hospitalId: true,
    },
  });

  return NextResponse.json({ data: units });
}
