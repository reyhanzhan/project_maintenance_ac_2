import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hospitals = await prisma.hospital.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
    },
  });

  return NextResponse.json({ data: hospitals });
}
