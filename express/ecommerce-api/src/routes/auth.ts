import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { signToken } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

// No role field: Zod drops unknown keys, so nobody can register themselves as ADMIN.
const registerBody = z.object({
  email: z.email().toLowerCase(),
  // bcrypt only looks at the first 72 bytes of a password.
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100),
});

const loginBody = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password, name } = registerBody.parse(req.body);
  const passwordHash = await bcrypt.hash(password, 10);
  // A taken email hits the unique constraint: P2002, so 409.
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = loginBody.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email },
    omit: { passwordHash: false },
  });
  // Same answer for "no such user" and "wrong password", so the response doesn't reveal which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect",
    );
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token: signToken(user), user: safeUser });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  res.json(user);
});
