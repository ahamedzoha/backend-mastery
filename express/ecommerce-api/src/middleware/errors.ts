import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../lib/errors.js";

// Prisma error codes worth turning into a client error instead of a 500.
const prismaErrors: Record<
  string,
  { status: number; code: string; message: string }
> = {
  P2002: {
    status: 409,
    code: "ALREADY_EXISTS",
    message: "A record with that value already exists",
  },
  P2003: {
    status: 409,
    code: "CONFLICT",
    message: "A related record is missing or still in use",
  },
  P2025: { status: 404, code: "NOT_FOUND", message: "Record not found" },
};

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(404, "NOT_FOUND", `No route for ${req.method} ${req.path}`),
  );
};

// Express 5 forwards errors from async handlers here, so no asyncHandler wrapper.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ error: { code: "VALIDATION", details: err.issues } });
    return;
  }
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    prismaErrors[err.code]
  ) {
    const { status, code, message } = prismaErrors[err.code];
    res.status(status).json({ error: { code, message } });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res
      .status(400)
      .json({ error: { code: "INVALID_JSON", message: "Malformed JSON" } });
    return;
  }
  console.error(err);
  res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Something went wrong" } });
};
