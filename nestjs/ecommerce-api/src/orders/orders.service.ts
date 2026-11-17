import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { CartItem } from '../cart/cart-item.entity.js';
import { AppException } from '../common/app.exception.js';
import { Product } from '../products/product.entity.js';
import { Order, OrderStatus } from './order.entity.js';
import { OrderItem } from './order-item.entity.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  // Every order response has the same shape: the order, its lines, each line's product id and name.
  private withItems() {
    return this.orders
      .createQueryBuilder('order')
      .leftJoin('order.items', 'item')
      .addSelect(['item.quantity', 'item.unitPriceCents'])
      .leftJoin('item.product', 'product')
      .addSelect(['product.id', 'product.name']);
  }

  // Checkout: turn the cart into an order. All or nothing, inside one transaction.
  async checkout(userId: number) {
    const orderId = await this.dataSource.transaction(async (manager) => {
      // Use manager (not a repository) for every query in here, or that query runs outside the
      // transaction. Sorted by product id so two checkouts lock rows in the same order (no deadlock).
      const cart = await manager.find(CartItem, {
        where: { userId },
        relations: { product: true },
        order: { productId: 'ASC' },
      });
      if (cart.length === 0) {
        throw new AppException(409, 'CART_EMPTY', 'Your cart is empty');
      }

      for (const { productId, quantity, product } of cart) {
        // One atomic statement: UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty.
        // No separate "read stock, then write" step, so two buyers can't both take the last unit.
        const { affected } = await manager.decrement(
          Product,
          { id: productId, stock: MoreThanOrEqual(quantity) },
          'stock',
          quantity,
        );
        // Throwing rolls back the whole transaction, including stock already taken for earlier lines.
        if (!affected) {
          throw new AppException(
            409,
            'OUT_OF_STOCK',
            `Not enough stock for ${product.name}`,
          );
        }
      }

      // cascade: ['insert'] on Order.items, so saving the order inserts its lines too.
      const order = await manager.save(
        manager.create(Order, {
          userId,
          totalCents: cart.reduce(
            (sum, { quantity, product }) => sum + quantity * product.priceCents,
            0,
          ),
          // The price is copied into the order, so later price changes don't rewrite history.
          items: cart.map(({ productId, quantity, product }) => ({
            productId,
            quantity,
            unitPriceCents: product.priceCents,
          })),
        }),
      );

      await manager.delete(CartItem, { userId });
      return order.id;
    });

    return this.findOne(userId, orderId);
  }

  findAll(userId: number) {
    return this.withItems()
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC')
      .addOrderBy('item.productId', 'ASC')
      .getMany();
  }

  // Looked up by id AND user, so someone else's order is a 404: we don't even confirm it exists.
  async findOne(userId: number, id: number) {
    const order = await this.withItems()
      .where('order.id = :id', { id })
      .andWhere('order.userId = :userId', { userId })
      .orderBy('item.productId', 'ASC')
      .getOne();
    if (!order) throw new AppException(404, 'NOT_FOUND', 'Order not found');
    return order;
  }

  // Only a PENDING order can be cancelled. Cancelling puts its stock back.
  async cancel(userId: number, id: number) {
    await this.dataSource.transaction(async (manager) => {
      // Conditional update again: if two cancels race, only one sees PENDING, so stock comes back once.
      const { affected } = await manager.update(
        Order,
        { id, userId, status: OrderStatus.PENDING },
        { status: OrderStatus.CANCELLED },
      );

      if (!affected) {
        const existing = await manager.findOneBy(Order, { id, userId });
        if (!existing) {
          throw new AppException(404, 'NOT_FOUND', 'Order not found');
        }
        throw new AppException(
          409,
          'NOT_CANCELLABLE',
          `A ${existing.status} order can't be cancelled`,
        );
      }

      const items = await manager.find(OrderItem, {
        where: { orderId: id },
        order: { productId: 'ASC' },
      });
      for (const { productId, quantity } of items) {
        await manager.increment(Product, { id: productId }, 'stock', quantity);
      }
    });

    return this.findOne(userId, id);
  }
}
