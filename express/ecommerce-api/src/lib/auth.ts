import jwt from "jsonwebtoken";
import { z } from "zod";
import { Role } from "../generated/prisma/client.js";
import { AppError } from "./errors.js";

export type AuthUser = { id: number; role: Role };

// What we expect inside a token we signed. Checked on every request, like any other input.
const tokenPayload = z.object({
  sub: z.coerce.number().int().positive(),
  role: z.enum(Role),
});

// Read lazily so importing the app (e.g. in tests) doesn't require the secret.
function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: String(user.id), role: user.role }, jwtSecret(), {
    expiresIn: "1h",
  });
}

export function verifyToken(token: string): AuthUser {
  const secret = jwtSecret();
  try {
    const payload = tokenPayload.parse(
      jwt.verify(token, secret, { algorithms: ["HS256"] }),
    );
    return { id: payload.sub, role: payload.role };
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Token is invalid or expired");
  }
}
