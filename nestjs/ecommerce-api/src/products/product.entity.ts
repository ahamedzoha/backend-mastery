import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Category } from '../categories/category.entity.js';

// Unlike Prisma, TypeORM can declare a CHECK constraint, and the migration picks it up.
@Entity('products')
@Check('products_stock_non_negative', '"stock" >= 0')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @Index()
  @Column()
  priceCents: number;

  @Column({ default: 0 })
  stock: number;

  @Index()
  @Column()
  categoryId: number;

  // Relation<> keeps the type out of the emitted decorator metadata, which avoids
  // "Cannot access X before initialization" when two ESM entity files import each other.
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Relation<Category>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
