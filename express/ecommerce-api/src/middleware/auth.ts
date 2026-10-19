import type { RequestHandler } from "express";
import { type AuthUser, verifyToken } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";

// Teach TypeScript that requireAuth adds req.user.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** 401 unless the request has a valid `Authorization: Bearer <token>` header. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;
  if (!token)
    throw new AppError(401, "UNAUTHENTICATED", "Missing bearer token");
  req.user = verifyToken(token);
  next();
};

/** 403 unless the logged-in user is an admin. Use after requireAuth. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "ADMIN")
    throw new AppError(403, "FORBIDDEN", "Admins only");
  next();
};
