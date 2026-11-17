import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity.js';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  findAll() {
    return this.categories.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categories.findOneBy({ id });

    if (!category) {
      throw new AppException(404, 'NOT_FOUND', 'Category not found');
    }

    return category;
  }

  // A taken name hits the unique constraint: 23505, so 409.
  create(name: string) {
    return this.categories.save(this.categories.create({ name }));
  }

  async rename(id: number, name: string) {
    // preload loads the row and merges the new values in; undefined means no such id.
    const category = await this.categories.preload({ id, name });
    if (!category) {
      throw new AppException(404, 'NOT_FOUND', 'Category not found');
    }
    return this.categories.save(category);
  }

  // A category that still has products hits the foreign key (onDelete RESTRICT): 23503, so 409.
  async remove(id: number) {
    const { affected } = await this.categories.delete(id);
    if (!affected) {
      throw new AppException(404, 'NOT_FOUND', 'Category not found');
    }
  }
}
