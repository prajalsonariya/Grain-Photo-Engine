const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  console.log("Deleted all users. DB is reset.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
