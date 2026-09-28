import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Managed Postgres providers (e.g. Render external URLs) require SSL with a
// provider-issued certificate, while local Postgres and Render internal
// connections do not. SSL is auto-enabled when the connection string asks for
// it, and can be forced either way with DATABASE_SSL=true|false.
const sslOverride = process.env["DATABASE_SSL"];
const sslEnabled =
  sslOverride === "true" ||
  (sslOverride !== "false" &&
    /[?&]sslmode=(require|prefer|verify)/i.test(connectionString));

const adapter = new PrismaPg({
  connectionString,
  ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const prisma = new PrismaClient({ adapter });
