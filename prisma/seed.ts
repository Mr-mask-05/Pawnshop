import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, payoutPct: 60, feePct: 0, feeFlat: 0 },
  });

  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    const hash = await bcrypt.hash("1234", 10);
    await prisma.user.create({
      data: {
        username: "admin",
        displayName: "Admin",
        hashedPassword: hash,
        staffRole: "owner",
        mustChangePassword: true,
        mustAddStateId: false,
        stateId: "ADMIN",
      },
    });
    console.log("Seeded admin / 1234");
  } else {
    console.log("Admin exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

