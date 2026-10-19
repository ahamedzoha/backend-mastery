import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { idParams } from "../lib/validation.js";

// description and stock are optional, not .default(): the database fills them on create,
// and a .default() would also kick in on PATCH and silently reset them.
const productBody = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive(),
});

// Query strings are always strings, so numbers need z.coerce and booleans need z.stringbool()
// (z.coerce.boolean() turns "false" into true).
const listQuery = z
  .object({
    q: z.string().trim().min(1).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    inStock: z.stringbool().optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "name"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (q) =>
      q.minPrice === undefined ||
      q.maxPrice === undefined ||
      q.minPrice <= q.maxPrice,
    {
      message: "minPrice must not exceed maxPrice",
      path: ["minPrice"],
    },
  );

const sortOrders = {
  newest: { createdAt: "desc" },
  price_asc: { priceCents: "asc" },
  price_desc: { priceCents: "desc" },
  name: { name: "asc" },
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

const withCategory = {
  category: { select: { id: true, name: true } },
} as const;

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const { q, categoryId, minPrice, maxPrice, inStock, sort, page, pageSize } =
    listQuery.parse(req.query);

  // Prisma skips any filter whose value is undefined, so unused params simply drop out.
  const where: Prisma.ProductWhereInput = {
    OR: q
      ? [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ]
      : undefined,
    categoryId,
    priceCents: { gte: minPrice, lte: maxPrice },
    stock:
      inStock === undefined ? undefined : inStock ? { gt: 0 } : { equals: 0 },
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: withCategory,
      // id as a tie-breaker keeps pages stable when several products share a price.
      orderBy: [sortOrders[sort], { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

productsRouter.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const product = await prisma.product.findUnique({
    where: { id },
    include: withCategory,
  });
  if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
  res.json(product);
});

productsRouter.post("/", async (req, res) => {
  const data = productBody.parse(req.body);
  const product = await prisma.product.create({ data, include: withCategory });
  res.status(201).json(product);
});

productsRouter.patch("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const data = productBody.partial().parse(req.body);
  const product = await prisma.product.update({
    where: { id },
    data,
    include: withCategory,
  });
  res.json(product);
});

productsRouter.delete("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  await prisma.product.delete({ where: { id } });
  res.status(204).end();
});
