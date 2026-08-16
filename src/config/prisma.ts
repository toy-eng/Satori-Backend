import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Heroku Postgres requires SSL with a self-signed certificate.
const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const prisma = new PrismaClient({ adapter });
