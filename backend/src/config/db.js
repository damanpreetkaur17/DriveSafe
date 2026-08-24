const { PrismaClient } = require("@prisma/client");

let prisma;
const databaseUrl = process.env.DATABASE_URL?.replace(/&channel_binding=require/gi, "");
const prismaOptions = databaseUrl
  ? { datasources: { db: { url: databaseUrl } } }
  : {};

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(prismaOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
}

module.exports = prisma;
