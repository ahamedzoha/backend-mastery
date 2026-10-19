import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Prisma 7 needs a driver adapter for every database.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// passwordHash is left out of every query unless one asks for it with omit: { passwordHash: false }.
export const prisma = new PrismaClient({
  adapter,
  omit: { user: { passwordHash: true } },
});
