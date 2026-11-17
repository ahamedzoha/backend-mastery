import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, AuthGuard } from '../auth/auth.guards.js';
import { idParam } from '../common/validation.js';
import {
  type ListQuery,
  listQuery,
  type ProductBody,
  productBody,
  type ProductPatch,
  productPatch,
} from './products.schemas.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // The pipe validates the whole query string and hands over the parsed, typed result.
  @Get()
  findAll(@Query({ schema: listQuery }) query: ListQuery) {
    return this.products.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', { schema: idParam }) id: number) {
    return this.products.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body({ schema: productBody }) body: ProductBody) {
    return this.products.create(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: productPatch }) body: ProductPatch,
  ) {
    return this.products.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id', { schema: idParam }) id: number) {
    return this.products.remove(id);
  }
}
