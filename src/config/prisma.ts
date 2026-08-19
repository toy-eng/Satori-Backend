import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Heroku Postgres requires SSL with a self-signed certificate.
// Local development Postgres typically does NOT support SSL, so SSL is only
// enabled when explicitly requested via DATABASE_SSL=true (e.g. in production).
const sslEnabled = process.env["DATABASE_SSL"] === "true";

const adapter = new PrismaPg({
  connectionString,
  ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const prisma = new PrismaClient({ adapter });
