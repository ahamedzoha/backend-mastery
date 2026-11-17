import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception.js';
import { Product } from '../products/product.entity.js';
import { CartItem } from './cart-item.entity.js';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  // The cart shows current prices. The price only gets fixed when an order is placed.
  async get(userId: number) {
    const items = await this.cartItems.find({
      where: { userId },
      relations: { product: true },
      order: { addedAt: 'ASC' },
    });

    const lines = items.map(({ product, quantity }) => ({
      product: {
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        stock: product.stock,
      },
      quantity,
      lineTotalCents: product.priceCents * quantity,
    }));

    return {
      items: lines,
      totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
    };
  }

  async setQuantity(userId: number, productId: number, quantity: number) {
    const product = await this.products.findOneBy({ id: productId });
    if (!product) throw new AppException(404, 'NOT_FOUND', 'Product not found');

    // Friendly early check only. Stock can change before checkout, where it is enforced for real.
    if (quantity > product.stock) {
      throw new AppException(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${product.stock} in stock`,
      );
    }

    // INSERT ... ON CONFLICT ("userId", "productId") DO UPDATE SET quantity = ...
    await this.cartItems.upsert({ userId, productId, quantity }, [
      'userId',
      'productId',
    ]);
    return this.get(userId);
  }

  async removeItem(userId: number, productId: number) {
    const { affected } = await this.cartItems.delete({ userId, productId });
    if (!affected) {
      throw new AppException(404, 'NOT_FOUND', 'Not in your cart');
    }
    return this.get(userId);
  }

  async clear(userId: number) {
    await this.cartItems.delete({ userId });
    return this.get(userId);
  }
}
