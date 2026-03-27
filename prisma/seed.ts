import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ac-report.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "System Admin";
  const techEmail = process.env.SEED_TECH_EMAIL ?? "tech1@ac-report.local";
  const techPassword = process.env.SEED_TECH_PASSWORD ?? "Tech12345!";
  const techName = process.env.SEED_TECH_NAME ?? "Teknisi Demo";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const techPasswordHash = await bcrypt.hash(techPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: adminName,
      email: adminEmail,
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
    update: {
      name: adminName,
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: techEmail },
    create: {
      name: techName,
      email: techEmail,
      password: techPasswordHash,
      role: Role.TECHNICIAN,
    },
    update: {
      name: techName,
      password: techPasswordHash,
      role: Role.TECHNICIAN,
    },
  });

  const seedHospitals = [
    {
      name: "RS Medika Utama",
      address: "Jl. Kesehatan No. 10",
      units: ["AC-Lobby-01", "AC-ICU-01", "AC-RawatInap-02"],
    },
    {
      name: "RS Harapan Sehat",
      address: "Jl. Harapan No. 25",
      units: ["AC-Lobby-02", "AC-UGD-01", "AC-Lab-01"],
    },
    {
      name: "RS Bina Kasih",
      address: "Jl. Bina Kasih No. 3",
      units: ["AC-Poli-01", "AC-OK-01", "AC-Farmasi-01"],
    },
  ];

  for (const item of seedHospitals) {
    const existingHospital = await prisma.hospital.findFirst({
      where: { name: item.name },
      select: { id: true },
    });

    const hospital =
      existingHospital ??
      (await prisma.hospital.create({
        data: {
          name: item.name,
          address: item.address,
        },
        select: { id: true },
      }));

    for (const unitName of item.units) {
      await prisma.acUnit.upsert({
        where: {
          hospitalId_name: {
            hospitalId: hospital.id,
            name: unitName,
          },
        },
        create: {
          hospitalId: hospital.id,
          name: unitName,
        },
        update: {},
      });
    }
  }

  console.log("Seed completed.");
  console.log(`Admin: ${adminEmail}`);
  console.log("Admin Password: (from SEED_ADMIN_PASSWORD or default)");
  console.log(`Tech: ${techEmail}`);
  console.log("Tech Password: (from SEED_TECH_PASSWORD or default)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
