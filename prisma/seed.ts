/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

const db = prisma as any;

async function main() {
  const email = "admin@florahub.com";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário ${email} já existe, pulando seed.`);
    return;
  }

  const user = await db.user.create({
    data: {
      email,
      name: "Admin",
      hashedPassword: await bcrypt.hash("admin123", 12),
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Usuário SUPER_ADMIN criado: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
