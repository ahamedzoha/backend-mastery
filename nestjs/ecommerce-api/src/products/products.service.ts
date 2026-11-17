import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception.js';
import { Product } from './product.entity.js';
import type {
  ListQuery,
  ProductBody,
  ProductPatch,
} from './products.schemas.js';

// Column and direction for each ?sort= value.
const sortOrders = {
  newest: ['product.createdAt', 'DESC'],
  price_asc: ['product.priceCents', 'ASC'],
  price_desc: ['product.priceCents', 'DESC'],
  name: ['product.name', 'ASC'],
} as const;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  // Every read returns the product with { id, name } of its category, like Express's include.
  private withCategory() {
    return this.products
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name']);
  }

  async findAll(query: ListQuery) {
    const { q, categoryId, minPrice, maxPrice, inStock, sort, page, pageSize } =
      query;
    const qb = this.withCategory();

    // Add a condition only when its filter was sent. (TypeORM's find() throws on undefined
    // where values, so the query builder is the simple way to build optional filters.)
    if (q) {
      // Escape LIKE wildcards, so searching for "50%" or "a_b" matches those characters.
      const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere(
        '(product.name ILIKE :pattern OR product.description ILIKE :pattern)',
        { pattern },
      );
    }
    if (categoryId !== undefined) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (minPrice !== undefined) {
      qb.andWhere('product.priceCents >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.priceCents <= :maxPrice', { maxPrice });
    }
    if (inStock !== undefined) {
      qb.andWhere(inStock ? 'product.stock > 0' : 'product.stock = 0');
    }

    const [column, direction] = sortOrders[sort];
    const [data, total] = await qb
      .orderBy(column, direction)
      // id as a tie-breaker keeps pages stable when several products share a price.
      .addOrderBy('product.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const product = await this.withCategory()
      .where('product.id = :id', { id })
      .getOne();
    if (!product) throw new AppException(404, 'NOT_FOUND', 'Product not found');
    return product;
  }

  // An unknown categoryId hits the foreign key: 23503, so 409.
  async create(body: ProductBody) {
    const { id } = await this.products.save(this.products.create(body));
    return this.findOne(id);
  }

  async update(id: number, patch: ProductPatch) {
    const product = await this.products.preload({ id, ...patch });
    if (!product) throw new AppException(404, 'NOT_FOUND', 'Product not found');
    await this.products.save(product);
    return this.findOne(id);
  }

  async remove(id: number) {
    const { affected } = await this.products.delete(id);
    if (!affected) {
      throw new AppException(404, 'NOT_FOUND', 'Product not found');
    }
  }
}
