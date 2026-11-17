import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Product } from '../products/product.entity.js';
import { Order } from './order.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn()
  orderId: number;

  @PrimaryColumn()
  productId: number;

  @Column()
  quantity: number;

  // The price at the time of the order, so later price changes don't rewrite history.
  @Column()
  unitPriceCents: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;
}
