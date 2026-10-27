import { z } from "zod";
import { prisma } from "../lib/db.js";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";

const productIdParams = z.object({
  productId: z.coerce.number().int().positive(),
});
const quantityBody = z.object({
  quantity: z.number().int().min(1).max(99),
});

// The cart shows current prices. The prices only gets fixed when an order is placed.
async function getCart(userId: number) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          stock: true,
        },
      },
    },
    orderBy: {
      addedAt: "asc",
    },
  });

  const lines = items.map(({ product, quantity }) => ({
    product,
    quantity,
    lineTotalCents: product.priceCents * quantity,
  }));

  return {
    items: lines,
    totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
  };
}

export const cartRouter = Router();

// Every cart route needs a logged-in user. The user id always comes from the token, never from
// the URL or body, so nobody can read or change someone else's cart.
cartRouter.use(requireAuth);

cartRouter.get("/", async (req, res) => {
  res.json(await getCart(req.user!.id));
});

// PUT sets the quantity rather than adding to it, so sending the same request twice is harmless.
cartRouter.put("/items/:productId", async (req, res) => {
  const userId = req.user!.id;
  const { productId } = productIdParams.parse(req.params);
  const { quantity } = quantityBody.parse(req.body);

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: { stock: true },
  });

  if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

  // Friendly early check only. Stock can change before checkout, where it is enforced for real.
  if (quantity > product.stock) {
    throw new AppError(
      409,
      "INSUFFICIENT_STOCK",
      `Only ${product.stock} in stock`,
    );
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity },
    update: { quantity },
  });

  res.json(await getCart(userId));
});

cartRouter.delete("/items/:productId", async (req, res) => {
  const userId = req.user!.id;
  const { productId } = productIdParams.parse(req.params);
  // Throws P2025 (so 404) if this product isn't in the cart.
  await prisma.cartItem.delete({
    where: { userId_productId: { userId, productId } },
  });
  res.json(await getCart(userId));
});

cartRouter.delete("/", async (req, res) => {
  const userId = req.user!.id;
  await prisma.cartItem.deleteMany({ where: { userId } });
  res.json(await getCart(userId));
});
