import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/errors.js";
import { healthRouter } from "./routes/health.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/categories", categoriesRouter);
  app.use("/products", productsRouter);
  app.use("/cart", cartRouter);
  app.use("/orders", ordersRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
