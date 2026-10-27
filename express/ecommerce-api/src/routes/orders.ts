import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { idParams } from "../lib/validation.js";

// Every order response has the same shape: the order, its lines, each line's product name.
const withItems = {
  items: {
    select: {
      quantity: true,
      unitPriceCents: true,
      product: { select: { id: true, name: true } },
    },
    orderBy: { productId: "asc" },
  },
} satisfies Prisma.OrderInclude;

export const ordersRouter = Router();

// Like the cart: logged-in users only, and the user id always comes from the token.
ordersRouter.use(requireAuth);

// Checkout: turn the cart into an order. All or nothing, inside one transaction.
ordersRouter.post("/", async (req, res) => {
  const userId = req.user!.id;

  const order = await prisma.$transaction(async (tx) => {
    // Use tx (not prisma) for every query in here, or that query runs outside the transaction.
    // Sorted by product id so two checkouts lock the same rows in the same order (no deadlock).
    const cart = await tx.cartItem.findMany({
      where: { userId },
      include: { product: { select: { name: true, priceCents: true } } },
      orderBy: { productId: "asc" },
    });

    if (cart.length === 0) {
      throw new AppError(409, "CART_EMPTY", "Your cart is empty");
    }

    for (const { productId, quantity, product } of cart) {
      // One atomic statement: UPDATE ... SET stock = stock - qty WHERE id = ? AND stock >= qty.
      // No separate "read stock, then write" step, so two buyers can't both take the last unit.
      const { count } = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      // Throwing rolls back the whole transaction, including stock already taken for earlier lines.
      if (count === 0) {
        throw new AppError(
          409,
          "OUT_OF_STOCK",
          `Not enough stock for ${product.name}`,
        );
      }
    }

    const created = await tx.order.create({
      data: {
        userId,
        totalCents: cart.reduce(
          (sum, { quantity, product }) => sum + quantity * product.priceCents,
          0,
        ),
        // The price is copied into the order, so later price changes don't rewrite history.
        items: {
          create: cart.map(({ productId, quantity, product }) => ({
            productId,
            quantity,
            unitPriceCents: product.priceCents,
          })),
        },
      },
      include: withItems,
    });

    await tx.cartItem.deleteMany({ where: { userId } });
    return created;
  });
  res.status(201).json(order);
});

ordersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: withItems,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  res.json(orders);
});

ordersRouter.get("/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const order = await prisma.order.findUnique({
    where: { id, userId: req.user!.id },
    include: withItems,
  });
  if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");
  return res.json(order);
});

// Only a PENDING order can be cancelled. Cancelling puts its stock back.
ordersRouter.post("/:id/cancel", async (req, res) => {
  const userId = req.user!.id;
  const { id } = idParams.parse(req.params);

  const order = await prisma.$transaction(async (tx) => {
    // Conditional update again: if two cancels race, only one sees PENDING, so stock comes back once.
    const { count } = await tx.order.updateMany({
      where: { id, userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    if (count === 0) {
      const existing = await tx.order.findUnique({
        where: { id, userId },
        select: { status: true },
      });

      if (!existing) throw new AppError(404, "NOT_FOUND", "Order not found");
      throw new AppError(
        409,
        "NOT_CANCELLABLE",
        `A ${existing.status} order can't be cancelled`,
      );
    }

    const items = await tx.orderItem.findMany({
      where: { orderId: id },
      orderBy: { productId: "asc" },
    });

    for (const { productId, quantity } of items) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
    }

    return tx.order.findUniqueOrThrow({ where: { id }, include: withItems });
  });
  res.json(order);
});
