import bcrypt from 'bcryptjs';
import { Category } from './categories/category.entity.js';
import dataSource from './data-source.js';
import { Product } from './products/product.entity.js';
import { Role, User } from './users/user.entity.js';

// Same catalog as the Express seed. Prices in cents. Safe to run more than once.
const catalog = {
  Books: [
    {
      name: 'Dune',
      description: 'Frank Herbert, desert planet sci-fi classic',
      priceCents: 1899,
      stock: 12,
    },
    {
      name: 'The Pragmatic Programmer',
      description: '20th anniversary edition',
      priceCents: 4299,
      stock: 5,
    },
    {
      name: 'Clean Architecture',
      description: 'Robert C. Martin',
      priceCents: 3499,
      stock: 0,
    },
  ],
  Electronics: [
    {
      name: 'Mechanical Keyboard',
      description: 'Hot-swappable switches, USB-C',
      priceCents: 8999,
      stock: 20,
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic, USB-C receiver',
      priceCents: 2999,
      stock: 35,
    },
    {
      name: '27" 4K Monitor',
      description: 'IPS panel, USB-C power delivery',
      priceCents: 32999,
      stock: 3,
    },
    {
      name: 'Noise-Cancelling Headphones',
      description: 'Over-ear, 30h battery',
      priceCents: 19999,
      stock: 0,
    },
  ],
  Games: [
    {
      name: 'Elden Ring',
      description: 'Open-world action RPG',
      priceCents: 5999,
      stock: 8,
    },
    {
      name: 'Stardew Valley',
      description: 'Farming sim, cosy',
      priceCents: 1499,
      stock: 50,
    },
    {
      name: 'Hades',
      description: 'Roguelike dungeon crawler',
      priceCents: 2499,
      stock: 1,
    },
  ],
};

await dataSource.initialize();
const users = dataSource.getRepository(User);
const categories = dataSource.getRepository(Category);
const products = dataSource.getRepository(Product);

// Local dev admin. There is no API for creating admins, on purpose.
if (!(await users.existsBy({ email: 'admin@shop.test' }))) {
  await users.save(
    users.create({
      email: 'admin@shop.test',
      name: 'Admin',
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash('admin-password', 10),
    }),
  );
}

for (const [categoryName, items] of Object.entries(catalog)) {
  await categories.upsert({ name: categoryName }, ['name']);
  const category = await categories.findOneByOrFail({ name: categoryName });
  for (const item of items) {
    const exists = await products.existsBy({
      name: item.name,
      categoryId: category.id,
    });
    if (!exists)
      await products.save(
        products.create({ ...item, categoryId: category.id }),
      );
  }
}

console.log(
  `Seeded: ${await categories.count()} categories, ${await products.count()} products`,
);
await dataSource.destroy();
