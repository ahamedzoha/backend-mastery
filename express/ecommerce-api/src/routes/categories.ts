import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { idParams } from "../lib/validation.js";

const categoryBody = z.object({
  name: z.string().trim().min(1).max(100),
});

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

categoriesRouter.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
  res.json(category);
});

categoriesRouter.post("/", async (req, res) => {
  const data = categoryBody.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

categoriesRouter.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const data = categoryBody.parse(req.body);
  // No existence check: if the id is unknown, Prisma throws P2025 and the error handler sends 404.
  const category = await prisma.category.update({ where: { id }, data });
  res.json(category);
});

categoriesRouter.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  await prisma.category.delete({ where: { id } });
  res.status(204).end();
});
