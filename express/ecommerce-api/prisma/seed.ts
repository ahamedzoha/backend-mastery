import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db.js";

// Prices in cents. Safe to run more than once: existing categories and products are skipped.
const catalog = {
  Books: [
    {
      name: "Dune",
      description: "Frank Herbert, desert planet sci-fi classic",
      priceCents: 1899,
      stock: 12,
    },
    {
      name: "The Pragmatic Programmer",
      description: "20th anniversary edition",
      priceCents: 4299,
      stock: 5,
    },
    {
      name: "Clean Architecture",
      description: "Robert C. Martin",
      priceCents: 3499,
      stock: 0,
    },
  ],
  Electronics: [
    {
      name: "Mechanical Keyboard",
      description: "Hot-swappable switches, USB-C",
      priceCents: 8999,
      stock: 20,
    },
    {
      name: "Wireless Mouse",
      description: "Ergonomic, USB-C receiver",
      priceCents: 2999,
      stock: 35,
    },
    {
      name: '27" 4K Monitor',
      description: "IPS panel, USB-C power delivery",
      priceCents: 32999,
      stock: 3,
    },
    {
      name: "Noise-Cancelling Headphones",
      description: "Over-ear, 30h battery",
      priceCents: 19999,
      stock: 0,
    },
  ],
  Games: [
    {
      name: "Elden Ring",
      description: "Open-world action RPG",
      priceCents: 5999,
      stock: 8,
    },
    {
      name: "Stardew Valley",
      description: "Farming sim, cosy",
      priceCents: 1499,
      stock: 50,
    },
    {
      name: "Hades",
      description: "Roguelike dungeon crawler",
      priceCents: 2499,
      stock: 1,
    },
  ],
};

async function main() {
  // Local dev admin. There is no API for creating admins, on purpose.
  await prisma.user.upsert({
    where: { email: "admin@shop.test" },
    update: {},
    create: {
      email: "admin@shop.test",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("admin-password", 10),
    },
  });

  for (const [categoryName, products] of Object.entries(catalog)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    for (const product of products) {
      const exists = await prisma.product.findFirst({
        where: { name: product.name, categoryId: category.id },
      });
      if (!exists)
        await prisma.product.create({
          data: { ...product, categoryId: category.id },
        });
    }
  }
  console.log(
    `Seeded: ${await prisma.category.count()} categories, ${await prisma.product.count()} products`,
  );
}

main().finally(() => prisma.$disconnect());
